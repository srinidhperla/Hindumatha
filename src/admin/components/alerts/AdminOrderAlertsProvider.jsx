import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { fetchOrders } from "@/features/orders/orderSlice";

const API_URL = import.meta.env.VITE_API_URL;
const ALERT_RING_DURATION_MS = 5500;
const ALERT_GAP_MS = 1000;
const ALERT_REPEAT_MS = ALERT_RING_DURATION_MS + ALERT_GAP_MS;
const ALERT_PRE_GAIN = 2.3;
const ALERT_POST_GAIN = 1.3;
const ALERTS_ENABLED_STORAGE_KEY = "bakeryAdminAlertsEnabled";
const PUSH_SUBSCRIBED_STORAGE_KEY = "bakeryAdminPushSubscribed";
const FCM_TOKEN_STORAGE_KEY = "bakeryAdminFcmToken";
const SOUND_ARMED_STORAGE_KEY = "bakeryAdminSoundArmed";
const ALERT_AUDIO_FILE_PATH = "/sounds/airtel_ringtone.mp3";

const AdminOrderAlertsContext = createContext(null);

const canUseNotifications = () =>
  typeof window !== "undefined" && "Notification" in window;

const canUseAudio = () =>
  typeof window !== "undefined" &&
  ("AudioContext" in window || "webkitAudioContext" in window);

const canUseServiceWorker = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator;

const canUsePushManager = () =>
  typeof window !== "undefined" && "PushManager" in window;

const canUseLocalStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
});

const isFirebaseConfigured = () => {
  const firebaseConfig = getFirebaseConfig();
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
  );
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0)),
  );
};

const registerFcmToken = async ({ registration, authToken }) => {
  if (!isFirebaseConfigured()) {
    return { skipped: true, reason: "firebase-config-missing" };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
  if (!vapidKey) {
    return { skipped: true, reason: "firebase-vapid-key-missing" };
  }

  const [{ getApp, getApps, initializeApp }, { getMessaging, getToken }] =
    await Promise.all([import("firebase/app"), import("firebase/messaging")]);

  const firebaseApp = getApps().some((app) => app.name === "admin-alerts-app")
    ? getApp("admin-alerts-app")
    : initializeApp(getFirebaseConfig(), "admin-alerts-app");
  const messaging = getMessaging(firebaseApp);
  const fcmToken = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!fcmToken) {
    return { skipped: true, reason: "fcm-token-unavailable" };
  }

  const response = await fetch(`${API_URL}/site/alerts/fcm-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token: fcmToken,
      userAgent: navigator.userAgent || "",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to register FCM token");
  }

  localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
  return { subscribed: true, channel: "fcm" };
};

const FloatingAlertUnlock = ({ onUnlock }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
    <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-[24px] border border-amber-200 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="flex flex-col gap-2 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            ?? Sound needs one tap to re-arm
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            Browser blocks audio until first interaction after a refresh. Tap
            anywhere or use the button.
          </p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white admin-motion hover:bg-amber-500"
        >
          Arm Sound
        </button>
      </div>
    </div>
  </div>
);

export const AdminOrderAlertsProvider = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token, user } = useSelector((state) => state.auth);
  const { orders } = useSelector((state) => state.orders);
  const isAdmin = Boolean(token && user?.role === "admin");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const canReceiveAdminAlerts = isAdmin && isAdminRoute;
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(ALERTS_ENABLED_STORAGE_KEY) === "true";
  });
  const [notificationPermission, setNotificationPermission] = useState(
    canUseNotifications() ? Notification.permission : "unsupported",
  );
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundArmed, setSoundArmed] = useState(() => {
    if (!canUseLocalStorage()) {
      return false;
    }

    return localStorage.getItem(SOUND_ARMED_STORAGE_KEY) === "true";
  });
  const [pushSubscribed, setPushSubscribed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(PUSH_SUBSCRIBED_STORAGE_KEY) === "true";
  });
  const [activeAlertOrderIds, setActiveAlertOrderIds] = useState([]);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const audioContextRef = useRef(null);
  const htmlAudioRef = useRef(null);
  const titleBlinkIntervalRef = useRef(null);
  const alertRepeatIntervalRef = useRef(null);
  const originalTitleRef = useRef(
    typeof document !== "undefined" ? document.title : "",
  );

  const stopTitleBlink = useCallback(() => {
    if (titleBlinkIntervalRef.current) {
      window.clearInterval(titleBlinkIntervalRef.current);
      titleBlinkIntervalRef.current = null;
    }

    if (typeof document !== "undefined") {
      document.title = originalTitleRef.current;
    }
  }, []);

  const startTitleBlink = useCallback(() => {
    if (typeof document === "undefined" || !document.hidden) {
      return;
    }

    if (titleBlinkIntervalRef.current) {
      return;
    }

    let showAlertTitle = true;
    titleBlinkIntervalRef.current = window.setInterval(() => {
      document.title = showAlertTitle
        ? "New order waiting for acceptance"
        : originalTitleRef.current;
      showAlertTitle = !showAlertTitle;
    }, 1000);
  }, []);

  const ensureAudioReady = useCallback(async () => {
    if (!canUseAudio()) {
      return false;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    const isReady = audioContextRef.current.state === "running";
    setAudioEnabled(isReady);

    if (isReady) {
      setSoundArmed(true);
      if (canUseLocalStorage()) {
        localStorage.setItem(SOUND_ARMED_STORAGE_KEY, "true");
      }
    }

    return isReady;
  }, []);

  const attemptSilentAudioUnlock = useCallback(async () => {
    if (!canUseAudio() || !canUseLocalStorage()) {
      return false;
    }

    if (localStorage.getItem(SOUND_ARMED_STORAGE_KEY) !== "true") {
      return false;
    }

    const probeAudio = new Audio(ALERT_AUDIO_FILE_PATH);
    probeAudio.preload = "auto";
    probeAudio.muted = true;

    try {
      const playResult = probeAudio.play();
      if (playResult && typeof playResult.then === "function") {
        await playResult;
      }
      probeAudio.pause();
      probeAudio.currentTime = 0;
      return ensureAudioReady();
    } catch {
      return false;
    }
  }, [ensureAudioReady]);

  const playHtmlAudioFallback = useCallback(async () => {
    if (!alertsEnabled) {
      return false;
    }

    try {
      if (!htmlAudioRef.current) {
        const audio = new Audio(ALERT_AUDIO_FILE_PATH);
        audio.preload = "auto";
        audio.loop = false;
        htmlAudioRef.current = audio;
      }

      const audio = htmlAudioRef.current;
      audio.currentTime = 0;
      const playResult = audio.play();
      if (playResult && typeof playResult.then === "function") {
        await playResult;
      }

      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([220, 120, 260, 120, 320]);
      }

      setAudioEnabled(true);
      return true;
    } catch {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([220, 120, 260]);
      }
      return false;
    }
  }, [alertsEnabled]);

  const playAlertTone = useCallback(async () => {
    if (!alertsEnabled) {
      return;
    }

    try {
      const isReady = await ensureAudioReady();
      if (!isReady) {
        await playHtmlAudioFallback();
        return;
      }

      const audioContext = audioContextRef.current;
      const preGain = audioContext.createGain();
      const compressor = audioContext.createDynamicsCompressor();
      const postGain = audioContext.createGain();

      preGain.gain.setValueAtTime(ALERT_PRE_GAIN, audioContext.currentTime);
      compressor.threshold.setValueAtTime(-28, audioContext.currentTime);
      compressor.knee.setValueAtTime(18, audioContext.currentTime);
      compressor.ratio.setValueAtTime(14, audioContext.currentTime);
      compressor.attack.setValueAtTime(0.001, audioContext.currentTime);
      compressor.release.setValueAtTime(0.22, audioContext.currentTime);
      postGain.gain.setValueAtTime(ALERT_POST_GAIN, audioContext.currentTime);

      preGain.connect(compressor);
      compressor.connect(postGain);
      postGain.connect(audioContext.destination);

      // Fetch and decode the Airtel ringtone MP3
      const response = await fetch(ALERT_AUDIO_FILE_PATH);
      if (!response.ok) {
        throw new Error("Failed to fetch ringtone file");
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Play the ringtone multiple times to fill the alert duration
      const ringtoneStartTime = audioContext.currentTime;
      const ringDurationSec = ALERT_RING_DURATION_MS / 1000;
      let playTime = ringtoneStartTime;

      while (playTime - ringtoneStartTime < ringDurationSec) {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(preGain);

        const remainingTime = ringDurationSec - (playTime - ringtoneStartTime);
        const sourceEndTime =
          playTime + Math.min(audioBuffer.duration, remainingTime);

        source.start(playTime);
        source.stop(sourceEndTime);

        playTime += audioBuffer.duration;
      }
    } catch {
      setAudioEnabled(false);
      await playHtmlAudioFallback();
    }
  }, [alertsEnabled, ensureAudioReady, playHtmlAudioFallback]);

  const unlockSound = useCallback(async () => {
    const isReady = await ensureAudioReady();

    if (isReady) {
      await playAlertTone();
    }

    return isReady;
  }, [ensureAudioReady, playAlertTone]);

  const ensureNotificationsReady = useCallback(
    async ({ request = false } = {}) => {
      if (!canUseNotifications()) {
        return "unsupported";
      }

      if (Notification.permission === "default" && request) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
      }

      setNotificationPermission(Notification.permission);
      return Notification.permission;
    },
    [],
  );

  const fetchPushStatus = useCallback(async () => {
    if (!token) {
      throw new Error("Missing auth token");
    }

    const response = await fetch(`${API_URL}/site/alerts/push-status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch push alert status");
    }

    return response.json();
  }, [token]);

  const subscribeForPushAlerts = useCallback(async () => {
    if (!canReceiveAdminAlerts) {
      return { skipped: true, reason: "admin-route-required" };
    }

    if (!canUseServiceWorker()) {
      return { skipped: true, reason: "push-not-supported" };
    }

    const permission = await ensureNotificationsReady();
    if (permission !== "granted") {
      return { skipped: true, reason: "notification-not-granted" };
    }

    const pushStatus = await fetchPushStatus();
    if (!pushStatus.configured) {
      return { skipped: true, reason: "push-not-configured" };
    }

    const registration =
      await navigator.serviceWorker.register("/admin-alert-sw.js");
    await navigator.serviceWorker.ready;

    if (!token) {
      return { skipped: true, reason: "missing-token" };
    }

    if (pushStatus.fcmConfigured) {
      try {
        const result = await registerFcmToken({
          registration,
          authToken: token,
        });

        if (result?.subscribed) {
          localStorage.setItem(PUSH_SUBSCRIBED_STORAGE_KEY, "true");
          setPushSubscribed(true);
          return result;
        }
      } catch {
        // Continue with web-push fallback when FCM setup is unavailable.
      }
    }

    if (!canUsePushManager() || !pushStatus.publicKey) {
      return { skipped: true, reason: "web-push-not-configured" };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushStatus.publicKey),
      });
    }

    const response = await fetch(`${API_URL}/site/alerts/push-subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to subscribe for push alerts");
    }

    localStorage.setItem(PUSH_SUBSCRIBED_STORAGE_KEY, "true");
    setPushSubscribed(true);

    return { subscribed: true, channel: "web-push" };
  }, [canReceiveAdminAlerts, ensureNotificationsReady, fetchPushStatus, token]);

  const enableAlerts = useCallback(async () => {
    setAlertsEnabled(true);
    localStorage.setItem(ALERTS_ENABLED_STORAGE_KEY, "true");
    await Promise.allSettled([
      ensureNotificationsReady({ request: true }),
      ensureAudioReady(),
    ]);
    await subscribeForPushAlerts().catch(() => null);
  }, [ensureAudioReady, ensureNotificationsReady, subscribeForPushAlerts]);

  const runManualAlertTest = useCallback(async () => {
    await enableAlerts();

    const permission = await ensureNotificationsReady();
    if (permission === "granted") {
      new Notification("Bakery alert test", {
        body: "This is a test notification from admin orders.",
        requireInteraction: false,
        silent: false,
      });
    }

    await playAlertTone();
  }, [enableAlerts, ensureNotificationsReady, playAlertTone]);

  const showBackgroundOrderNotification = useCallback(
    async ({
      title = "New bakery order",
      body = "A new order needs attention.",
      tag = "bakery-order-alert",
    } = {}) => {
      const permission = await ensureNotificationsReady();
      if (permission !== "granted") {
        return false;
      }

      // Prefer service worker notifications in background/minimized state.
      if (canUseServiceWorker()) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            tag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: { url: "/admin/orders" },
          });
          return true;
        } catch {
          // Fall back to window Notification below.
        }
      }

      try {
        new Notification(title, {
          body,
          tag,
          requireInteraction: true,
          silent: false,
        });
        return true;
      } catch {
        return false;
      }
    },
    [ensureNotificationsReady],
  );

  useEffect(() => {
    if (!canReceiveAdminAlerts || !alertsEnabled || audioEnabled) {
      return undefined;
    }

    const unlockAlerts = () => {
      ensureAudioReady();
      ensureNotificationsReady();
    };

    window.addEventListener("pointerdown", unlockAlerts, true);
    window.addEventListener("keydown", unlockAlerts, true);
    window.addEventListener("touchstart", unlockAlerts, true);
    window.addEventListener("focus", unlockAlerts);

    return () => {
      window.removeEventListener("pointerdown", unlockAlerts);
      window.removeEventListener("keydown", unlockAlerts);
      window.removeEventListener("touchstart", unlockAlerts);
      window.removeEventListener("focus", unlockAlerts);
    };
  }, [
    alertsEnabled,
    audioEnabled,
    ensureAudioReady,
    ensureNotificationsReady,
    canReceiveAdminAlerts,
  ]);

  useEffect(() => {
    if (
      !canReceiveAdminAlerts ||
      !alertsEnabled ||
      audioEnabled ||
      !soundArmed
    ) {
      return undefined;
    }

    attemptSilentAudioUnlock();
    return undefined;
  }, [
    alertsEnabled,
    audioEnabled,
    attemptSilentAudioUnlock,
    canReceiveAdminAlerts,
    soundArmed,
  ]);

  useEffect(() => {
    if (!canReceiveAdminAlerts || !canUseServiceWorker()) {
      return undefined;
    }

    const onServiceWorkerMessage = (event) => {
      const messageType = event?.data?.type;
      if (messageType !== "PLAY_ORDER_SOUND") {
        return;
      }

      playAlertTone();
      startTitleBlink();
    };

    navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        onServiceWorkerMessage,
      );
    };
  }, [canReceiveAdminAlerts, playAlertTone, startTitleBlink]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeAlertOrderIds.length === 0) {
        stopTitleBlink();
      }

      if (document.hidden && activeAlertOrderIds.length > 0 && alertsEnabled) {
        startTitleBlink();
      }

      // Auto-resume audio when tab becomes visible again (handles the most
      // common "sound paused after refresh / tab switch" scenario).
      if (!document.hidden && alertsEnabled && !audioEnabled) {
        ensureAudioReady()
          .then((isReady) => {
            if (!isReady) {
              playHtmlAudioFallback().catch(() => null);
            }
          })
          .catch(() => null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopTitleBlink();
    };
  }, [
    activeAlertOrderIds.length,
    alertsEnabled,
    audioEnabled,
    ensureAudioReady,
    playHtmlAudioFallback,
    startTitleBlink,
    stopTitleBlink,
  ]);

  useEffect(() => {
    if (!canReceiveAdminAlerts || !token) {
      setActiveAlertOrderIds([]);
      setLastCreatedOrder(null);
      setPushSubscribed(false);
      return undefined;
    }

    dispatch(fetchOrders());

    let eventSource = null;
    let fallbackStarted = false;

    const startSseFallback = () => {
      if (fallbackStarted) {
        return;
      }

      fallbackStarted = true;
      eventSource = new EventSource(
        `${API_URL}/orders/stream?token=${encodeURIComponent(token)}`,
      );

      eventSource.addEventListener("order-created", async (event) => {
        const streamEvent = JSON.parse(event.data);
        await handleCreated(streamEvent);
      });

      eventSource.addEventListener("order-status-updated", (event) => {
        const streamEvent = JSON.parse(event.data);
        handleUpdated(streamEvent);
      });
    };

    const handleCreated = async (streamEvent) => {
      const createdOrder = streamEvent?.payload || null;
      const orderId = createdOrder?._id;

      setLastCreatedOrder(createdOrder);
      dispatch(fetchOrders());

      if (orderId) {
        setActiveAlertOrderIds((currentIds) =>
          currentIds.includes(orderId) ? currentIds : [...currentIds, orderId],
        );
      }

      if (!alertsEnabled) {
        return;
      }

      // Immediate first ring on order placement; repeats are handled separately
      // while any pending order remains unhandled.
      playAlertTone();
      startTitleBlink();

      // In hidden/minimized tabs, rely on system notifications for audible alert.
      if (document.hidden) {
        await showBackgroundOrderNotification({
          title: "New bakery order",
          body: `${createdOrder?.user?.name || "A customer"} placed a new order. Accept it from admin orders.`,
          tag: `bakery-order-alert-${orderId || "pending"}`,
        });
        return;
      }

      const permission = await ensureNotificationsReady();
      if (permission === "granted" && !pushSubscribed) {
        await showBackgroundOrderNotification({
          title: "New bakery order",
          body: `${createdOrder?.user?.name || "A customer"} placed a new order. Accept it from admin orders.`,
          tag: `bakery-order-alert-${orderId || "pending"}`,
        });
      }
    };

    const handleUpdated = (streamEvent) => {
      const updatedOrder = streamEvent?.payload || null;
      const orderId = updatedOrder?._id;

      if (
        orderId &&
        updatedOrder?.status &&
        updatedOrder.status !== "pending"
      ) {
        setActiveAlertOrderIds((currentIds) =>
          currentIds.filter((currentId) => currentId !== orderId),
        );
      }

      dispatch(fetchOrders());
    };

    const socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const fallbackTimeout = window.setTimeout(() => {
      if (!socket.connected) {
        startSseFallback();
      }
    }, 3000);

    const handleSocketConnect = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    const handleSocketError = () => {
      startSseFallback();
    };

    socket.on("connect", handleSocketConnect);
    socket.on("connect_error", handleSocketError);
    socket.on("order-created", handleCreated);
    socket.on("order-status-updated", handleUpdated);

    return () => {
      window.clearTimeout(fallbackTimeout);
      socket.off("connect", handleSocketConnect);
      socket.off("connect_error", handleSocketError);
      socket.off("order-created", handleCreated);
      socket.off("order-status-updated", handleUpdated);
      socket.disconnect();

      if (eventSource) {
        eventSource.close();
      }
    };
  }, [
    alertsEnabled,
    dispatch,
    ensureNotificationsReady,
    canReceiveAdminAlerts,
    playAlertTone,
    pushSubscribed,
    startTitleBlink,
    token,
  ]);

  useEffect(() => {
    if (!canReceiveAdminAlerts) {
      return;
    }

    const pendingIds = (orders || [])
      .filter((order) => order?.status === "pending" && order?._id)
      .map((order) => order._id);

    setActiveAlertOrderIds(pendingIds);
  }, [canReceiveAdminAlerts, orders]);

  useEffect(() => {
    if (
      !canReceiveAdminAlerts ||
      !alertsEnabled ||
      notificationPermission !== "granted"
    ) {
      return undefined;
    }

    subscribeForPushAlerts().catch(() => null);
    return undefined;
  }, [
    alertsEnabled,
    canReceiveAdminAlerts,
    notificationPermission,
    subscribeForPushAlerts,
  ]);

  useEffect(() => {
    if (
      !canReceiveAdminAlerts ||
      !alertsEnabled ||
      activeAlertOrderIds.length === 0
    ) {
      if (alertRepeatIntervalRef.current) {
        window.clearInterval(alertRepeatIntervalRef.current);
        alertRepeatIntervalRef.current = null;
      }
      stopTitleBlink();
      return undefined;
    }

    playAlertTone();
    startTitleBlink();

    if (!alertRepeatIntervalRef.current) {
      alertRepeatIntervalRef.current = window.setInterval(() => {
        playAlertTone();
        startTitleBlink();

        // Browsers may throttle/suspend tab audio in background; keep notifying.
        if (document.hidden) {
          showBackgroundOrderNotification({
            title: "Pending order waiting",
            body: "A pending order still needs acceptance in admin orders.",
            tag: "bakery-order-alert-pending-repeat",
          }).catch(() => null);
        }
      }, ALERT_REPEAT_MS);
    }

    return () => {
      if (alertRepeatIntervalRef.current) {
        window.clearInterval(alertRepeatIntervalRef.current);
        alertRepeatIntervalRef.current = null;
      }
    };
  }, [
    canReceiveAdminAlerts,
    activeAlertOrderIds.length,
    alertsEnabled,
    playAlertTone,
    showBackgroundOrderNotification,
    startTitleBlink,
    stopTitleBlink,
  ]);

  const value = useMemo(
    () => ({
      alertsEnabled,
      audioEnabled,
      notificationPermission,
      pushSubscribed,
      activeAlertOrderIds,
      lastCreatedOrder,
      notificationsSupported: canUseNotifications(),
      audioSupported: canUseAudio(),
      pushSupported: canUseServiceWorker() && canUsePushManager(),
      soundUnlockRequired:
        alertsEnabled && canUseAudio() && !audioEnabled && !soundArmed,
      enableAlerts,
      unlockSound,
      runManualAlertTest,
    }),
    [
      activeAlertOrderIds,
      alertsEnabled,
      audioEnabled,
      enableAlerts,
      lastCreatedOrder,
      notificationPermission,
      pushSubscribed,
      runManualAlertTest,
      soundArmed,
      unlockSound,
    ],
  );

  return (
    <AdminOrderAlertsContext.Provider value={value}>
      {children}
      {canReceiveAdminAlerts &&
        alertsEnabled &&
        canUseAudio() &&
        !audioEnabled &&
        !soundArmed && <FloatingAlertUnlock onUnlock={unlockSound} />}
    </AdminOrderAlertsContext.Provider>
  );
};

export const useAdminOrderAlerts = () => {
  const context = useContext(AdminOrderAlertsContext);

  if (!context) {
    throw new Error(
      "useAdminOrderAlerts must be used within AdminOrderAlertsProvider",
    );
  }

  return context;
};

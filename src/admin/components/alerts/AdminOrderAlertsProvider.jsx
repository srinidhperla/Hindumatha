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
import { fetchOrders } from "../../../features/orders/orderSlice";

const API_URL = import.meta.env.VITE_API_URL;
const ALERT_RING_DURATION_MS = 5500;
const ALERT_GAP_MS = 1000;
const ALERT_REPEAT_MS = ALERT_RING_DURATION_MS + ALERT_GAP_MS;
const ALERTS_ENABLED_STORAGE_KEY = "bakeryAdminAlertsEnabled";
const PUSH_SUBSCRIBED_STORAGE_KEY = "bakeryAdminPushSubscribed";

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

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0)),
  );
};

const FloatingAlertUnlock = ({ onUnlock }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
    <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-[24px] border border-amber-200 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="flex flex-col gap-2 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            🔔 Sound needs one tap to re-arm
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
  const { token, user } = useSelector((state) => state.auth);
  const { orders } = useSelector((state) => state.orders);
  const isAdmin = Boolean(token && user?.role === "admin");
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
  const [pushSubscribed, setPushSubscribed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(PUSH_SUBSCRIBED_STORAGE_KEY) === "true";
  });
  const [activeAlertOrderIds, setActiveAlertOrderIds] = useState([]);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const audioContextRef = useRef(null);
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
    return isReady;
  }, []);

  const playAlertTone = useCallback(async () => {
    if (!alertsEnabled) {
      return;
    }

    try {
      const isReady = await ensureAudioReady();
      if (!isReady) {
        return;
      }

      const audioContext = audioContextRef.current;
      const now = audioContext.currentTime;
      const startTime = now + 0.02;
      const ringDurationSec = ALERT_RING_DURATION_MS / 1000;
      const endTime = startTime + ringDurationSec;

      const compressor = audioContext.createDynamicsCompressor();
      const masterGain = audioContext.createGain();
      const highTone = audioContext.createOscillator();
      const lowTone = audioContext.createOscillator();

      // Phone-call style dual-tone ring (similar to classic call ringtone).
      highTone.type = "sine";
      lowTone.type = "sine";
      highTone.frequency.setValueAtTime(480, startTime);
      lowTone.frequency.setValueAtTime(440, startTime);

      compressor.threshold.setValueAtTime(-18, startTime);
      compressor.knee.setValueAtTime(24, startTime);
      compressor.ratio.setValueAtTime(10, startTime);
      compressor.attack.setValueAtTime(0.002, startTime);
      compressor.release.setValueAtTime(0.14, startTime);

      // Softer phone-like ring with higher perceived loudness.
      const ringGain = 0.82;
      const pulseOnSec = 0.62;
      const pulseOffSec = 0.16;
      let t = startTime;

      masterGain.gain.setValueAtTime(0.0001, startTime);
      while (t < endTime) {
        const pulseEnd = Math.min(t + pulseOnSec, endTime);
        masterGain.gain.exponentialRampToValueAtTime(ringGain, t + 0.03);
        masterGain.gain.exponentialRampToValueAtTime(0.42, pulseEnd - 0.05);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);
        t += pulseOnSec + pulseOffSec;
      }

      highTone.connect(masterGain);
      lowTone.connect(masterGain);
      masterGain.connect(compressor);
      compressor.connect(audioContext.destination);

      highTone.start(startTime);
      lowTone.start(startTime);
      highTone.stop(endTime + 0.02);
      lowTone.stop(endTime + 0.02);
    } catch {
      setAudioEnabled(false);
    }
  }, [alertsEnabled, ensureAudioReady]);

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
    const tokenValue = getStoredToken();
    const response = await fetch(`${API_URL}/site/alerts/push-status`, {
      headers: {
        Authorization: `Bearer ${tokenValue}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch push alert status");
    }

    return response.json();
  }, []);

  const subscribeForPushAlerts = useCallback(async () => {
    if (!canUseServiceWorker() || !canUsePushManager()) {
      return { skipped: true, reason: "push-not-supported" };
    }

    const permission = await ensureNotificationsReady();
    if (permission !== "granted") {
      return { skipped: true, reason: "notification-not-granted" };
    }

    const pushStatus = await fetchPushStatus();
    if (!pushStatus.configured || !pushStatus.publicKey) {
      return { skipped: true, reason: "push-not-configured" };
    }

    const registration =
      await navigator.serviceWorker.register("/admin-alert-sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushStatus.publicKey),
      });
    }

    const tokenValue = getStoredToken();
    const response = await fetch(`${API_URL}/site/alerts/push-subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenValue}`,
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

    return { subscribed: true };
  }, [ensureNotificationsReady, fetchPushStatus]);

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

  useEffect(() => {
    if (!isAdmin || !alertsEnabled || audioEnabled) {
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
    isAdmin,
  ]);

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
        ensureAudioReady().catch(() => null);
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
    startTitleBlink,
    stopTitleBlink,
  ]);

  useEffect(() => {
    if (!isAdmin || !token) {
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

      const permission = await ensureNotificationsReady();

      if (permission === "granted" && !pushSubscribed) {
        new Notification("New bakery order", {
          body: `${createdOrder?.user?.name || "A customer"} placed a new order. Accept it from admin orders.`,
          requireInteraction: true,
          silent: false,
        });
      }

      playAlertTone();
      startTitleBlink();
    };

    const handleUpdated = () => {
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
    isAdmin,
    playAlertTone,
    pushSubscribed,
    startTitleBlink,
    token,
  ]);

  useEffect(() => {
    if (!isAdmin || !alertsEnabled || notificationPermission !== "granted") {
      return undefined;
    }

    subscribeForPushAlerts().catch(() => null);
    return undefined;
  }, [alertsEnabled, isAdmin, notificationPermission, subscribeForPushAlerts]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const pendingIds = new Set(
      (orders || [])
        .filter((order) => order.status === "pending")
        .map((order) => order._id),
    );

    setActiveAlertOrderIds(Array.from(pendingIds));
  }, [isAdmin, orders]);

  useEffect(() => {
    if (!alertsEnabled || activeAlertOrderIds.length === 0) {
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
      }, ALERT_REPEAT_MS);
    }

    return () => {
      if (alertRepeatIntervalRef.current) {
        window.clearInterval(alertRepeatIntervalRef.current);
        alertRepeatIntervalRef.current = null;
      }
    };
  }, [
    activeAlertOrderIds.length,
    alertsEnabled,
    playAlertTone,
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
      soundUnlockRequired: alertsEnabled && canUseAudio() && !audioEnabled,
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
      unlockSound,
    ],
  );

  return (
    <AdminOrderAlertsContext.Provider value={value}>
      {children}
      {isAdmin && alertsEnabled && canUseAudio() && !audioEnabled && (
        <FloatingAlertUnlock onUnlock={unlockSound} />
      )}
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

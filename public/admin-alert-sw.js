self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Bakery admin alert",
    body: "A new order needs attention.",
    url: "/admin/orders",
    tag: "bakery-order-alert",
    requireInteraction: true,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 120, 220, 120, 260],
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  const broadcastToClients = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) =>
      Promise.all(
        clientList.map((client) =>
          client.postMessage({
            type: "PLAY_ORDER_SOUND",
            payload: {
              title: payload.title,
              body: payload.body,
              url: payload.url || "/admin/orders",
              tag: payload.tag || "bakery-order-alert",
            },
          }),
        ),
      ),
    );

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || "/favicon.ico",
        badge: payload.badge || "/favicon.ico",
        tag: payload.tag,
        renotify: true,
        requireInteraction: payload.requireInteraction,
        vibrate: Array.isArray(payload.vibrate)
          ? payload.vibrate
          : [200, 120, 220, 120, 260],
        data: {
          url: payload.url || "/admin/orders",
        },
      }),
      broadcastToClients,
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = client.url || "";
          const samePath =
            clientUrl.includes(targetUrl) ||
            clientUrl.includes("/admin/orders");

          if (samePath && "focus" in client) {
            return client.focus();
          }
        }

        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});

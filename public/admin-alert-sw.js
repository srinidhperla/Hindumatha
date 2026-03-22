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

  event.waitUntil(
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
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    clients
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

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});

// Web Push service worker — deliberately minimal (no offline caching, no
// asset precaching, no next-pwa/workbox): the only job this app needs from a
// service worker right now is receiving push events and handling clicks on
// the resulting notification. Registered on demand from
// src/lib/push/client.ts, only once a learner opts in from Settings.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Not JSON (shouldn't happen — every sender in this app JSON.stringifies
    // the payload, see src/lib/push/send.ts) — fall back to the defaults
    // below rather than dropping the notification entirely.
  }

  const title = data.title || "SentenceStep";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/learn" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/learn";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    }),
  );
});

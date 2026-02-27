self.addEventListener("push", (event) => {
  const fallback = { title: "Zen Nurture", body: "You have a reminder" };
  let data = fallback;

  try {
    data = event.data ? event.data.json() : fallback;
  } catch {
    data = fallback;
  }

  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "zen-nurture",
    renotify: true,
    data: { url: data.url || "/" },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Zen Nurture", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

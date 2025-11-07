
'use strict';

self.addEventListener('push', function (event) {
  if (!event.data) {
    console.warn('Push event but no data');
    return;
  }
  
  const data = event.data.json();
  const title = data.title || "inDizayn";
  const options = {
    body: data.options.body || "Yangi bildirishnoma",
    icon: data.options.icon || "/logo.png",
    badge: data.options.badge || "/logo.png",
    vibrate: data.options.vibrate || [200, 100, 200],
    data: {
      url: data.options.data.url // URL to open on click
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (clientList) {
      // If a window for this origin is already open, focus it.
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

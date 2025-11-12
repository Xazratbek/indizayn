// This file MUST be in the public folder

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }
  
  const data = event.data.json();

  const title = data.title || 'Yangi bildirishnoma';
  const options = {
    body: data.options.body || 'Siz uchun yangi xabar bor.',
    icon: data.options.icon || '/logo.png', // Sayt logotipi
    badge: data.options.badge || '/logo.png', // Android'da ko'rinadigan belgi
    vibrate: data.options.vibrate || [200, 100, 200, 100, 200, 100, 200], // Vibratsiya
    silent: false, // Sound enabled
    requireInteraction: false, // Auto-dismiss after a timeout
    data: {
      url: data.options.data.url, // Bosilganda ochiladigan havola
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList.find(c => c.url === urlToOpen && 'focus' in c);
        if (client) {
          return client.focus();
        }
        if (clientList[0]) {
          return clientList[0].navigate(urlToOpen).then(c => c.focus());
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// public/firebase-messaging-sw.js

// Bu fayl brauzer yopiq bo'lganda ham fon rejimida ishlab,
// push-bildirishnomalarni qabul qilish va ko'rsatish uchun xizmat qiladi.

// Firebase'ning kerakli skriptlarini import qilish (klassik usul)
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Firebase loyihasining konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyDP53vBa2Z1pVOnhvMXy_m_T3WIUu3SszU",
  authDomain: "studio-3441452454-c82e9.firebaseapp.com",
  projectId: "studio-3441452454-c82e9",
  storageBucket: "studio-3441452454-c82e9.appspot.com",
  messagingSenderId: "243140839363",
  appId: "1:243140839363:web:4241bf4ddbcafa95c29f76",
};

// Firebase ilovasini ishga tushirish
firebase.initializeApp(firebaseConfig);

// Messaging xizmatini olish
const messaging = firebase.messaging();

// Fon rejimida kelgan xabarlarni ushlab olish uchun listener
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Fon rejimida xabar qabul qilindi: ', payload);

  // Bildirishnomaning sarlavhasi va matnini tayyorlash
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Sayt logotipi
    badge: '/badge.png', // Kichik ikonkasi (Android uchun)
    sound: '/notification-sound.mp3', // Bildirishnoma tovushi
    vibrate: [200, 100, 200], // Vibratsiya (200ms vibratsiya, 100ms pauza, 200ms vibratsiya)
    data: {
      url: payload.data.url // Bildirishnoma bosilganda ochiladigan manzil
    }
  };

  // Foydalanuvchiga bildirishnomani ko'rsatish
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirishnoma bosilganda nima qilish kerakligi
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Bildirishnoma bosildi.');
  
  event.notification.close(); // Bildirishnomani yopish
  
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function(clientList) {
      // Agar saytning ochiq oynasi bo'lsa, o'shanga o'tish
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Agar ochiq oyna bo'lmasa, yangi oyna ochish
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

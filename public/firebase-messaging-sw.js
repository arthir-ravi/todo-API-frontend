importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCGi304ILinBr_R63XGOfBq6TB-maEySso",
  authDomain: "todo-pushnotification-8984d.firebaseapp.com",
  projectId: "todo-pushnotification-8984d",
  storageBucket: "todo-pushnotification-8984d.firebasestorage.app",
  messagingSenderId: "83999621538",
  appId: "1:83999621538:web:557ce8efed731a6ea5b2fb",
  measurementId: "G-4WHNBCTTKT"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
      '[firebase-messaging-sw.js] Received background message ',
      payload
    );

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });


  
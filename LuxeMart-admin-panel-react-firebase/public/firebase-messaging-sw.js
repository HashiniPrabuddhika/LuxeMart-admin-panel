// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
var firebaseConfig = {
  apiKey: "AIzaSyB6Mxfl9ZrwBEUqHSa557VK8guw9E6eC2c",
  authDomain: "supermarket-61ccf.firebaseapp.com",
  projectId: "supermarket-61ccf",
  storageBucket: "supermarket-61ccf.appspot.com",
  messagingSenderId: "951317926598",
  appId: "1:951317926598:web:5e9544f57a3f05cf26fdc7",
  measurementId: "G-B9K0HLM7D4"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

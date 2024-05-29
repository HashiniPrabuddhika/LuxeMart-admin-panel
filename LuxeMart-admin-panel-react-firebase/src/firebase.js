import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Initialize Firebase
const app = initializeApp(
  {
    apiKey: "AIzaSyB6Mxfl9ZrwBEUqHSa557VK8guw9E6eC2c",
  authDomain: "supermarket-61ccf.firebaseapp.com",
  projectId: "supermarket-61ccf",
  storageBucket: "supermarket-61ccf.appspot.com",
  messagingSenderId: "951317926598",
  appId: "1:951317926598:web:5e9544f57a3f05cf26fdc7",
  measurementId: "G-B9K0HLM7D4"

  }
)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const messaging = getMessaging(app);
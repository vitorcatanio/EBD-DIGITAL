
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Fix: Use process.env for environment variables to resolve TypeScript errors with ImportMeta
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAFtoyF9PGJxbaK8iD26lhfrc91G943jWU",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "ebd-digital-3f1f9.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "ebd-digital-3f1f9",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "ebd-digital-3f1f9.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "765171717602",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:765171717602:web:e9bcd9aa98b7a2492b55bb",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LDJ2BRLQ9Y"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

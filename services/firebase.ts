
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFtoyF9PGJxbaK8iD26lhfrc91G943jWU",
  authDomain: "ebd-digital-3f1f9.firebaseapp.com",
  projectId: "ebd-digital-3f1f9",
  storageBucket: "ebd-digital-3f1f9.firebasestorage.app",
  messagingSenderId: "765171717602",
  appId: "1:765171717602:web:e9bcd9aa98b7a2492b55bb",
  measurementId: "G-LDJ2BRLQ9Y"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

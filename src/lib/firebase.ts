import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA-2MNDeKkveoG1PBWXG9Ns7QuRfevvUwQ",
  authDomain: "arloboudha-cec5d.firebaseapp.com",
  projectId: "arloboudha-cec5d",
  storageBucket: "arloboudha-cec5d.firebasestorage.app",
  messagingSenderId: "409879778724",
  appId: "1:409879778724:web:977096eae7983380229d31"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
export const storage = getStorage(app);

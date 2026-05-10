import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCfcApCmmgfoRxDcFzLgvxRVlyQ0XCn10s",
  authDomain: "boudha-7267c.firebaseapp.com",
  projectId: "boudha-7267c",
  storageBucket: "boudha-7267c.firebasestorage.app",
  messagingSenderId: "143270785164",
  appId: "1:143270785164:web:64883494b7ae2892ef4ba9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
export const storage = getStorage(app);

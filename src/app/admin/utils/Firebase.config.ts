import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyATYQw3MJJLTM3oBcFmakbuuOwGQU3MRRw",
  authDomain: "online-market-63d5f.firebaseapp.com",
  databaseURL: "https://online-market-63d5f-default-rtdb.firebaseio.com",
  projectId: "online-market-63d5f",
  storageBucket: "online-market-63d5f.appspot.com",
  messagingSenderId: "797317872057",
  appId: "1:797317872057:web:3b7c3fd4397397f2301e68",
  measurementId: "G-B9VF4GR9GJ",
};

let app;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    getAnalytics(app);
  }
} else {
  app = getApp();
}

export const db = getFirestore(app);
export const database = getDatabase(app);

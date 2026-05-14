import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as authModule from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOddQKpbTQ6Pc4v0HlpGPpHXm3s_RhC6I",
  authDomain: "syrian-series.firebaseapp.com",
  projectId: "syrian-series",
  storageBucket: "syrian-series.firebasestorage.app",
  messagingSenderId: "1052594174245",
  appId: "1:1052594174245:web:8d2fd5f894f664250342cc",
};

// 1. Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth
// We use a double-cast here to tell TypeScript:
// "Trust me, this function exists inside the auth module."
const { initializeAuth, getReactNativePersistence } = authModule as any;

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// 3. Initialize Firestore
const db = getFirestore(app);

export { auth, db };

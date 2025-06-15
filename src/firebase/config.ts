
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAnJBSCXlh_9eX3o0vmSiT6-w5JqIVqR6o",
  authDomain: "ctjsr-c8be4.firebaseapp.com",
  projectId: "ctjsr-c8be4",
  storageBucket: "ctjsr-c8be4.appspot.com",
  messagingSenderId: "512102174837",
  appId: "1:512102174837:web:4fb31f2d181b2378f6683c",
  measurementId: "G-K7PBZ50R78"
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Export Firebase services
export { auth, db, storage };

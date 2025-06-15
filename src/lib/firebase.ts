import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJPmxJ7FS-qcY9iA_sv8LrcaLWWQo-C5M",
  authDomain: "ybt-online-hub.firebaseapp.com",
  projectId: "ybt-online-hub",
  storageBucket: "ybt-online-hub.appspot.com",
  messagingSenderId: "810217270028",
  appId: "1:810217270028:web:4f1546c68397cf7b8a6d01",
  databaseURL: "https://ybt-online-hub-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app); // Realtime Database
const storage = getStorage(app);

export { auth, db, rtdb, storage, app };

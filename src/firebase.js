import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAe-q6VDV3CzWhW5a8s1FIlgEQhHXDnZGk",
  authDomain: "fintrack-f40b8.firebaseapp.com",
  projectId: "fintrack-f40b8",
  storageBucket: "fintrack-f40b8.appspot.com",
  messagingSenderId: "148169117430",
  appId: "1:148169117430:web:a52efb1d32282b8f6126d7",
  measurementId: "G-EFVWTY3MTH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Correct export syntax
export { app, db, auth, provider, doc, setDoc };

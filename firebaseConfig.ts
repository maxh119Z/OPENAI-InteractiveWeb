// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import {getFirestore} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRPPWo0yAWyN2ZwSUv1UX9FnMnFo_tft4",
  authAIzaSyBRPPWo0yAWyN2ZwSUv1UX9FnMnFo_tft4Domain: "vyxels-ebe71.firebaseapp.com",
  projectId: "vyxels-ebe71",
  storageBucket: "vyxels-ebe71.firebasestorage.app",
  messagingSenderId: "47088410162",
  appId: "1:47088410162:web:bde486ca6e1f8e5c61262b",
  measurementId: "G-FCRZBN52EQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();  
export const auth = getAuth(app);
export const db = getFirestore(app);
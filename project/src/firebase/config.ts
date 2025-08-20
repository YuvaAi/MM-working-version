// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvx5AKugLSPqRlQUek8nVko3nS3eaUUq4",
  authDomain: "marketmate-101.firebaseapp.com",
  projectId: "marketmate-101",
  storageBucket: "marketmate-101.firebasestorage.app",
  messagingSenderId: "896082401769",
  appId: "1:896082401769:web:0d794ba3ccd1f1c6b3d378",
  measurementId: "G-KJX1T0M0CH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default firebaseConfig;
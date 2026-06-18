// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2tMX3F5AFXtQOsB7k0kRiyrfMAQ4250Y",
  authDomain: "bestbaas-lk.firebaseapp.com",
  projectId: "bestbaas-lk",
  storageBucket: "bestbaas-lk.firebasestorage.app",
  messagingSenderId: "691526957027",
  appId: "1:691526957027:web:823e742986643fa7d392d6",
  measurementId: "G-JTQKZW5X48",
  site: "bestbaas"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };

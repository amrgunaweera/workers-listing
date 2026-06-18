import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2tMX3F5AFXtQOsB7k0kRiyrfMAQ4250Y",
  authDomain: "bestbaas-lk.firebaseapp.com",
  projectId: "bestbaas-lk",
  storageBucket: "bestbaas-lk.firebasestorage.app",
  messagingSenderId: "691526957027",
  appId: "1:691526957027:web:823e742986643fa7d392d6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const email = "admin@bestservicelk.com";
  const password = "Admin123!";
  let user;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
    } else {
      console.error("Error creating admin user:", error);
      process.exit(1);
    }
  }

  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "admin",
      createdAt: new Date().toISOString()
    });
    console.log("Admin user created and role assigned successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
  } catch (error) {
    console.error("Error assigning admin role:", error);
    process.exit(1);
  }
}

createAdmin();

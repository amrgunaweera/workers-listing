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

const mockWorkers = [
  {
    id: "worker_1",
    name: "Kamal Perera",
    category: "Carpenter",
    rating: 4.8,
    location: "Colombo",
    avatar: "https://i.pravatar.cc/150?u=kamal",
    bio: "Over 10 years of experience in furniture making and structural carpentry.",
    phone: "0712345678",
    available: true
  },
  {
    id: "worker_2",
    name: "Suresh Silva",
    category: "Mason",
    rating: 4.5,
    location: "Kandy",
    avatar: "https://i.pravatar.cc/150?u=suresh",
    bio: "Specialist in bricklaying, plastering, and concrete work.",
    phone: "0771122334",
    available: true
  },
  {
    id: "worker_3",
    name: "Muthu Kumar",
    category: "Plumber",
    rating: 4.9,
    location: "Jaffna",
    avatar: "https://i.pravatar.cc/150?u=muthu",
    bio: "Expert in pipe repairs, installation of water heaters, and general plumbing.",
    phone: "0759988776",
    available: false
  },
  {
    id: "worker_4",
    name: "Sunil Rathnayake",
    category: "Helper",
    rating: 4.6,
    location: "Negombo",
    avatar: "https://i.pravatar.cc/150?u=sunil",
    bio: "Hardworking helper for construction sites and heavy lifting tasks.",
    phone: "0763344555",
    available: true
  }
];

async function seed() {
  console.log("Seeding mock workers...");
  for (const worker of mockWorkers) {
    await setDoc(doc(db, "workers", worker.id), worker);
    console.log(`Seeded mock worker: ${worker.name}`);
  }

  // Now create the new worker: Carpenter named Nimal
  const nimalEmail = "nimal@bestbaas.com";
  const nimalPassword = "Worker123!";
  let nimalUser;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, nimalEmail, nimalPassword);
    nimalUser = userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      const userCredential = await signInWithEmailAndPassword(auth, nimalEmail, nimalPassword);
      nimalUser = userCredential.user;
    } else {
      console.error("Error creating Nimal's user account:", error);
      process.exit(1);
    }
  }

  try {
    // Add to users collection with role: worker
    await setDoc(doc(db, "users", nimalUser.uid), {
      email: nimalUser.email,
      role: "worker",
      createdAt: new Date().toISOString()
    });

    // Add Nimal as a worker profile
    const nimalWorkerProfile = {
      id: nimalUser.uid,
      name: "Nimal Fernando",
      category: "Carpenter",
      rating: 5.0,
      location: "Colombo",
      avatar: "https://i.pravatar.cc/150?u=nimal_carpenter",
      bio: "Professional carpenter specializing in bespoke furniture, door installations, and general wood repairs.",
      phone: "0711112222",
      available: true,
      userId: nimalUser.uid
    };
    await setDoc(doc(db, "workers", nimalUser.uid), nimalWorkerProfile);

    console.log("Worker Nimal created successfully in Auth and Firestore!");
    console.log("Email:", nimalEmail);
    console.log("Password:", nimalPassword);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Nimal worker profile:", error);
    process.exit(1);
  }
}

seed();

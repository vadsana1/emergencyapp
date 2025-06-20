import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAla8j4eoayqxw061YgU97rB386YvspMPU",
  authDomain: "emerencyapp.firebaseapp.com",
  databaseURL: "https://emerencyapp-default-rtdb.firebaseio.com",
  projectId: "emerencyapp",
  storageBucket: "emerencyapp.appspot.com", // แก้ตรงนี้
  messagingSenderId: "1078800855545",
  appId: "1:1078800855545:web:95ad6a9c7f272cb4598d28",
  measurementId: "G-DXQV4WYHQJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

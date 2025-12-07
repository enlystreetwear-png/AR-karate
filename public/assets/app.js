// Make sure to save this as assets/app.js

// ----------------- FIREBASE CONFIG -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword  // MAKE SURE THIS IS IMPORTED
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyA4OVgeKWvAIklI8hTibj3kT3C9KgBsp2w",
  authDomain: "ar-karate-e580f.firebaseapp.com",
  projectId: "ar-karate-e580f",
  storageBucket: "ar-karate-e580f.firebasestorage.app",
  messagingSenderId: "1057516841712",
  appId: "1:1057516841712:web:53cdd653879cb678df3035",
  measurementId: "G-7K6PYQ1HWB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ----------------- AUTH FUNCTIONS -----------------
export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  return await signOut(auth);
}

export async function getUserRole(uid) {
  const docRef = doc(db, "roles", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data().role;
  return null;
}

export function autoRedirect() {
  auth.onAuthStateChanged(async user => {
    if(user) {
      const role = await getUserRole(user.uid);
      if(role === "admin") {
        window.location.href = "#adminView";
      } else if(role === "teacher") {
        window.location.href = "#teacherView";
      }
    }
  });
}

// ----------------- STUDENT MANAGEMENT -----------------
export async function addStudent(name, belt, id) {
  await setDoc(doc(db, "students", id), { name, belt, id });
}

export async function deleteStudent(id) {
  await deleteDoc(doc(db, "students", id));
}

export async function getAllStudents() {
  const snapshot = await getDocs(collection(db, "students"));
  const students = [];
  snapshot.forEach(doc => {
    students.push(doc.data());
  });
  return students;
}

// ----------------- ATTENDANCE -----------------
export async function markAttendance(studentId) {
  const studentRef = doc(db, "students", studentId);
  const studentSnap = await getDoc(studentRef);

  if(!studentSnap.exists()) return; // student not found

  const studentData = studentSnap.data();
  const today = new Date().toISOString().split("T")[0];

  const attendanceRef = doc(db, "attendance", studentId + "-" + today);
  await setDoc(attendanceRef, {
    studentId: studentData.id,
    name: studentData.name,
    date: today,
    timestamp: serverTimestamp()
  });
}

// ================= ADD THIS FUNCTION =================
// Simple function to ensure roles exist
export async function ensureDefaultUsersExist() {
    console.log("Ensuring default users exist...");
    
    const users = [
        { email: "admin@karate.com", password: "Admin123!", role: "admin" },
        { email: "teacher@karate.com", password: "Teacher123!", role: "teacher" }
    ];
    
    for (const user of users) {
        try {
            // Try to sign in (user exists)
            const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
            console.log(`User ${user.email} exists, checking role...`);
            
            // Check if role exists
            const roleDoc = await getDoc(doc(db, "roles", userCredential.user.uid));
            if (!roleDoc.exists()) {
                console.log(`No role for ${user.email}, creating...`);
                await setDoc(doc(db, "roles", userCredential.user.uid), {
                    role: user.role,
                    email: user.email
                });
                console.log(`Role created for ${user.email}`);
            }
            
            await signOut(auth);
            
        } catch (authError) {
            // User doesn't exist, create them
            if (authError.code === 'auth/user-not-found') {
                console.log(`Creating user ${user.email}...`);
                
                // Create auth user
                const newUserCredential = await createUserWithEmailAndPassword(
                    auth, user.email, user.password
                );
                
                // Create role
                await setDoc(doc(db, "roles", newUserCredential.user.uid), {
                    role: user.role,
                    email: user.email
                });
                
                console.log(`Created ${user.role}: ${user.email}`);
                await signOut(auth);
            } else {
                console.error(`Error with ${user.email}:`, authError);
            }
        }
    }
    
    console.log("Default users ensured!");
}

// Call this function automatically
ensureDefaultUsersExist();

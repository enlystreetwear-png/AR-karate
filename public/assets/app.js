// assets/app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  deleteDoc,
  getDocs,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ----------------- FIREBASE CONFIG -----------------
const firebaseConfig = {
  apiKey: "AIzaSyA4OVgeKWvAIklI8hTibj3kT3C9KgBsp2w",
  authDomain: "ar-karate-e580f.firebaseapp.com",
  projectId: "ar-karate-e580f",
  storageBucket: "ar-karate-e580f.firebasestorage.app",
  messagingSenderId: "1057516841712",
  appId: "1:1057516841712:web:53cdd653879cb678df3035",
  measurementId: "G-7K6PYQ1HWB"
};

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
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const role = await getUserRole(user.uid);
      if (role === "admin") window.location.href = "#adminView";
      else if (role === "teacher") window.location.href = "#teacherView";
    }
  });
}

// ----------------- BASE64 PHOTO HELPERS (NO STORAGE) -----------------

/**
 * Convert File -> Base64 data URL (data:image/...;base64,...)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Your HTML calls: module.uploadStudentPhoto(photoFile, id)
 * This returns base64 string.
 */
export async function uploadStudentPhoto(file, studentId) {
  return await fileToBase64(file);
}

// ----------------- STUDENT MANAGEMENT -----------------
export async function addStudent(name, belt, id, extra = {}) {
  if (!name || !belt || !id) throw new Error("Missing student fields");

  await setDoc(doc(db, "students", id), {
    name,
    belt,
    id,
    ...extra,
    createdAt: serverTimestamp()
  });
}

export async function updateStudent(id, updates = {}) {
  if (!id) throw new Error("Missing student id");
  await updateDoc(doc(db, "students", id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteStudent(id) {
  if (!id) throw new Error("Missing student id");
  await deleteDoc(doc(db, "students", id));
}

export async function getAllStudents() {
  const snapshot = await getDocs(collection(db, "students"));
  const students = [];
  snapshot.forEach((d) => students.push(d.data()));
  return students;
}

// ----------------- ATTENDANCE FUNCTIONS -----------------
export async function markAttendance(studentId) {
  const studentRef = doc(db, "students", studentId);
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) throw new Error("Student not found");

  const studentData = studentSnap.data();
  const today = new Date().toISOString().split("T")[0];
  const attendanceId = `${studentId}-${today}`;

  const existingSnap = await getDoc(doc(db, "attendance", attendanceId));
  if (existingSnap.exists()) throw new Error("Attendance already marked today");

  await setDoc(doc(db, "attendance", attendanceId), {
    studentId: studentData.id,
    name: studentData.name,
    belt: studentData.belt,
    date: today,
    timestamp: serverTimestamp()
  });

  return { success: true, studentName: studentData.name };
}

export async function getTodaysAttendance(date) {
  const day = date || new Date().toISOString().split("T")[0];
  const attendanceRef = collection(db, "attendance");
  const q = query(attendanceRef, where("date", "==", day));
  return await getDocs(q);
}

export async function deleteAttendance(attendanceId) {
  await deleteDoc(doc(db, "attendance", attendanceId));
  return { success: true };
}

// ----------------- USER SETUP -----------------
export async function setupUsersSimple() {
  try {
    await signOut(auth);

    // admin
    try {
      const adminCred = await createUserWithEmailAndPassword(
        auth,
        "admin@karate.com",
        "Admin123!"
      );
      await setDoc(doc(db, "roles", adminCred.user.uid), {
        role: "admin",
        email: "admin@karate.com",
        createdAt: new Date().toISOString()
      });
      await signOut(auth);
    } catch (e) {
      if (e.code !== "auth/email-already-in-use") throw e;
    }

    // teacher
    try {
      const teacherCred = await createUserWithEmailAndPassword(
        auth,
        "teacher@karate.com",
        "Teacher123!"
      );
      await setDoc(doc(db, "roles", teacherCred.user.uid), {
        role: "teacher",
        email: "teacher@karate.com",
        createdAt: new Date().toISOString()
      });
      await signOut(auth);
    } catch (e) {
      if (e.code !== "auth/email-already-in-use") throw e;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function testLogin() {
  try {
    await signInWithEmailAndPassword(auth, "admin@karate.com", "Admin123!");
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "teacher@karate.com", "Teacher123!");
    await signOut(auth);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

console.log("Firebase app initialized (no storage, base64 photos)");

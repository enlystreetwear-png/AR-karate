// Make sure to save this as assets/app.js

// ----------------- FIREBASE CONFIG -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  deleteDoc,
  getDocs,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
  await setDoc(doc(db, "students", id), { 
    name, 
    belt, 
    id,
    createdAt: serverTimestamp()
  });
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

// ----------------- ATTENDANCE FUNCTIONS -----------------
export async function markAttendance(studentId) {
  try {
    console.log("Marking attendance for student:", studentId);
    
    // Check if student exists
    const studentRef = doc(db, "students", studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      throw new Error("Student not found");
    }

    const studentData = studentSnap.data();
    const today = new Date().toISOString().split("T")[0];
    const attendanceId = `${studentId}-${today}`;

    // Check if already marked today
    const existingAttendanceRef = doc(db, "attendance", attendanceId);
    const existingSnap = await getDoc(existingAttendanceRef);
    
    if (existingSnap.exists()) {
      throw new Error("Attendance already marked today");
    }

    // Mark attendance
    const attendanceRef = doc(db, "attendance", attendanceId);
    await setDoc(attendanceRef, {
      studentId: studentData.id,
      name: studentData.name,
      belt: studentData.belt,
      date: today,
      timestamp: serverTimestamp()
    });
    
    console.log("Attendance marked successfully for:", studentData.name);
    return { success: true, studentName: studentData.name };
    
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
}

// Get today's attendance
export async function getTodaysAttendance(date) {
  try {
    const today = date || new Date().toISOString().split("T")[0];
    
    // Query attendance for today
    const attendanceRef = collection(db, "attendance");
    const q = query(attendanceRef, where("date", "==", today));
    const snapshot = await getDocs(q);
    
    return snapshot;
  } catch (error) {
    console.error("Error getting today's attendance:", error);
    throw error;
  }
}

// Get attendance report for admin
export async function getAttendanceReport(startDate, endDate) {
  try {
    const attendanceRef = collection(db, "attendance");
    const q = query(
      attendanceRef, 
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    
    const snapshot = await getDocs(q);
    const attendance = [];
    snapshot.forEach(doc => {
      attendance.push(doc.data());
    });
    
    return attendance;
  } catch (error) {
    console.error("Error getting attendance report:", error);
    throw error;
  }
}

// ----------------- USER SETUP FUNCTIONS -----------------
export async function setupUsersSimple() {
  console.log("Starting SIMPLE setup...");
  
  try {
    await signOut(auth);
    
    // Create admin
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
    } catch (adminError) {
      if (adminError.code !== 'auth/email-already-in-use') {
        throw adminError;
      }
    }
    
    // Create teacher
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
    } catch (teacherError) {
      if (teacherError.code !== 'auth/email-already-in-use') {
        throw teacherError;
      }
    }
    
    return { success: true, message: "Setup complete" };
    
  } catch (error) {
    console.error("Setup error:", error);
    return { success: false, error: error.message };
  }
}

export async function testLogin() {
  console.log("Testing login...");
  try {
    // Test admin login
    const adminCred = await signInWithEmailAndPassword(
      auth, 
      "admin@karate.com", 
      "Admin123!"
    );
    
    const adminRoleDoc = await getDoc(doc(db, "roles", adminCred.user.uid));
    console.log("Admin role exists:", adminRoleDoc.exists());
    
    await signOut(auth);
    
    // Test teacher login
    const teacherCred = await signInWithEmailAndPassword(
      auth, 
      "teacher@karate.com", 
      "Teacher123!"
    );
    
    const teacherRoleDoc = await getDoc(doc(db, "roles", teacherCred.user.uid));
    console.log("Teacher role exists:", teacherRoleDoc.exists());
    
    await signOut(auth);
    
    return { success: true, message: "Test login successful" };
    
  } catch (error) {
    console.error("Test login failed:", error);
    return { success: false, error: error.message };
  }
}

// Auto setup on load
console.log("Firebase app initialized");

// Add to your existing app.js file
export async function deleteAttendance(attendanceId) {
  try {
    console.log("Deleting attendance record:", attendanceId);
    await deleteDoc(doc(db, "attendance", attendanceId));
    console.log("Attendance record deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting attendance:", error);
    throw error;
  }
}

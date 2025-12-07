// SIMPLE VERSION - assets/app.js
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
  serverTimestamp
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

// 1. FIRST, let's create a SIMPLE setup function
export async function setupUsersSimple() {
    console.log("Starting SIMPLE setup...");
    
    try {
        // Sign out any existing user first
        await signOut(auth);
        console.log("Signed out any existing user");
        
        // Create admin user
        console.log("Creating admin user...");
        try {
            const adminCred = await createUserWithEmailAndPassword(
                auth, 
                "admin@karate.com", 
                "Admin123!"
            );
            console.log("Admin created:", adminCred.user.uid);
            
            // Create admin role
            await setDoc(doc(db, "roles", adminCred.user.uid), {
                role: "admin",
                email: "admin@karate.com",
                createdAt: new Date().toISOString()
            });
            console.log("Admin role created");
            
            // Sign out admin
            await signOut(auth);
        } catch (adminError) {
            if (adminError.code === 'auth/email-already-in-use') {
                console.log("Admin already exists");
            } else {
                console.error("Admin creation error:", adminError);
            }
        }
        
        // Create teacher user
        console.log("Creating teacher user...");
        try {
            const teacherCred = await createUserWithEmailAndPassword(
                auth, 
                "teacher@karate.com", 
                "Teacher123!"
            );
            console.log("Teacher created:", teacherCred.user.uid);
            
            // Create teacher role
            await setDoc(doc(db, "roles", teacherCred.user.uid), {
                role: "teacher",
                email: "teacher@karate.com",
                createdAt: new Date().toISOString()
            });
            console.log("Teacher role created");
            
            // Sign out teacher
            await signOut(auth);
        } catch (teacherError) {
            if (teacherError.code === 'auth/email-already-in-use') {
                console.log("Teacher already exists");
            } else {
                console.error("Teacher creation error:", teacherError);
            }
        }
        
        console.log("SIMPLE setup complete!");
        return { success: true, message: "Setup complete" };
        
    } catch (error) {
        console.error("Setup error:", error);
        return { success: false, error: error.message };
    }
}

// 2. Test login function
export async function testLogin() {
    console.log("Testing login...");
    try {
        // Test admin login
        const adminCred = await signInWithEmailAndPassword(
            auth, 
            "admin@karate.com", 
            "Admin123!"
        );
        console.log("Admin login successful:", adminCred.user.uid);
        
        // Get admin role
        const adminRoleDoc = await getDoc(doc(db, "roles", adminCred.user.uid));
        console.log("Admin role exists:", adminRoleDoc.exists());
        if (adminRoleDoc.exists()) {
            console.log("Admin role:", adminRoleDoc.data().role);
        }
        
        await signOut(auth);
        
        // Test teacher login
        const teacherCred = await signInWithEmailAndPassword(
            auth, 
            "teacher@karate.com", 
            "Teacher123!"
        );
        console.log("Teacher login successful:", teacherCred.user.uid);
        
        // Get teacher role
        const teacherRoleDoc = await getDoc(doc(db, "roles", teacherCred.user.uid));
        console.log("Teacher role exists:", teacherRoleDoc.exists());
        if (teacherRoleDoc.exists()) {
            console.log("Teacher role:", teacherRoleDoc.data().role);
        }
        
        await signOut(auth);
        
        return { success: true, message: "Test login successful" };
        
    } catch (error) {
        console.error("Test login failed:", error);
        return { success: false, error: error.message };
    }
}

// 3. Original functions (keep these)
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

export async function markAttendance(studentId) {
  const studentRef = doc(db, "students", studentId);
  const studentSnap = await getDoc(studentRef);

  if(!studentSnap.exists()) return;

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

// 4. Call simple setup on load
console.log("Firebase app initialized");
setupUsersSimple().then(result => {
    console.log("Auto-setup result:", result);
});

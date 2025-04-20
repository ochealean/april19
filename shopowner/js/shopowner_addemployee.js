import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    sendEmailVerification,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAuPALylh11cTArigeGJZmLwrFwoAsNPSI",
    authDomain: "opportunity-9d3bf.firebaseapp.com",
    databaseURL: "https://opportunity-9d3bf-default-rtdb.firebaseio.com",
    projectId: "opportunity-9d3bf",
    storageBucket: "opportunity-9d3bf.firebasestorage.app",
    messagingSenderId: "57906230058",
    appId: "1:57906230058:web:2d7cd9cc68354722536453",
    measurementId: "G-QC2JSR1FJW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Store original auth state
let originalAuthState = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === "o396DkvUQIZDpmZr0ZLLgPwtq7u1") {
        originalAuthState = user;
        console.log("Shop owner authenticated:", user.uid);
    }
});

// Employee creation function
async function createEmployeeAccount(employeeData) {
    const tempAuth = getAuth(); // Create a new auth instance
    
    try {
        // 1. Create employee account
        const userCredential = await createUserWithEmailAndPassword(
            tempAuth, 
            employeeData.email, 
            employeeData.password
        );
        
        // 2. Send verification email
        await sendEmailVerification(userCredential.user);
        
        // 3. Add employee to database
        await set(ref(db, `AR_shoe_users/employees/${userCredential.user.uid}`), {
            ...employeeData,
            shopId: "o396DkvUQIZDpmZr0ZLLgPwtq7u1",
            dateAdded: new Date().toISOString(),
            status: 'active'
        });
        
        // 4. Re-authenticate original shop owner
        if (originalAuthState && originalAuthState.email) {
            await signInWithEmailAndPassword(
                auth, 
                originalAuthState.email, 
                localStorage.getItem('shopOwnerPassword')
            );
        }
        
        return { success: true, password: employeeData.password };
    } catch (error) {
        // Re-authenticate original owner if error occurs
        if (originalAuthState && originalAuthState.email) {
            await signInWithEmailAndPassword(
                auth, 
                originalAuthState.email, 
                localStorage.getItem('shopOwnerPassword')
            );
        }
        throw error;
    }
}

// Form submission handler
document.getElementById('addEmployeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const employeeData = {
        name: document.getElementById('employeeName').value.trim(),
        email: document.getElementById('employeeEmail').value.trim(),
        role: document.getElementById('employeeRole').value,
        phone: document.getElementById('employeePhone').value.trim(),
        password: generateRandomPassword()
    };
    
    try {
        // Store shop owner's password temporarily (insecure for production)
        if (auth.currentUser) {
            localStorage.setItem('shopOwnerPassword', prompt("Please confirm your password"));
        }
        
        const result = await createEmployeeAccount(employeeData);
        
        alert(`Employee added successfully!\nTemporary password: ${result.password}`);
        e.target.reset();
    } catch (error) {
        console.error("Error:", error);
        alert(`Error: ${error.message}`);
    }
});

// Helper functions
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
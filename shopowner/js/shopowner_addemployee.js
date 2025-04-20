import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    sendEmailVerification,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAuPALylh11cTArigeGJZmLwrFwoAsNPSI",
    authDomain: "opportunity-9d3bf.firebaseapp.com",
    databaseURL: "https://opportunity-9d3bf-default-rtdb.firebaseio.com",
    projectId: "opportunity-9d3bf",
    storageBucket: "opportunity-9d3bf.appspot.com",
    messagingSenderId: "57906230058",
    appId: "1:57906230058:web:2d7cd9cc68354722536453",
    measurementId: "G-QC2JSR1FJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Store shop owner info
let shopOwner = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        shopOwner = {
            uid: user.uid,
            email: user.email
        };
        console.log("Authenticated as shop owner:", shopOwner.uid);
    } else {
        console.log("No user signed in");
    }
});

function createSingleAssignmentVariable() {
    let valueSet = false;
    let value;
  
    return {
      setValue(newValue) {
        if (!newValue) {
          throw new Error("Value cannot be null or undefined");
        }
        if (valueSet) {
          throw new Error("The value can only be set once!");
        }
        value = newValue;
        valueSet = true;
      },
      getValue() {
        if (!valueSet) {
          throw new Error("Value has not been set yet!");
        }
        return value;
      },
    };
}
  
const myVar = createSingleAssignmentVariable();

// Function to create employee
async function createEmployeeAccount(employeeData) {
    if (!shopOwner || !shopOwner.uid) {
        throw new Error("Shop owner not authenticated. Please sign in first.");
    }

    try {
        // 1. Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, employeeData.email, employeeData.password);

        // 2. Send verification email
        await sendEmailVerification(userCredential.user);

        // 3. Save employee data in Realtime DB
        await set(ref(db, `AR_shoe_users/employees/${userCredential.user.uid}`), {
            ...employeeData,
            shopId: shopOwner.uid,
            dateAdded: new Date().toISOString(),
            status: 'active'
        });

        console.log("email" + shopOwner.email);
        console.log("UID set:", myVar.getValue().email);
        // 4. Re-sign in original shop owner
        const storedPassword = localStorage.getItem('shopOwnerPassword');
        if (shopOwner.email && storedPassword) {
            await signInWithEmailAndPassword(auth, myVar.getValue().email, storedPassword);
            console.log("Re-authenticated as shop owner.");
        }

        return { success: true, password: employeeData.password };
    } catch (error) {
        console.error("Error during employee creation:", error);

        // Try to re-authenticate the shop owner if something went wrong
        const storedPassword = localStorage.getItem('shopOwnerPassword');
        if (shopOwner && shopOwner.email && storedPassword) {
            try {
                await signInWithEmailAndPassword(auth, shopOwner.email, storedPassword);
            } catch (reauthError) {
                console.error("Re-authentication failed:", reauthError);
            }
        }

        throw error;
    }
}

// Handle form submit
document.getElementById('addEmployeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!shopOwner) {
        alert("Please sign in as a shop owner first.");
        return;
    }

    const employeeData = {
        name: document.getElementById('employeeName').value.trim(),
        email: document.getElementById('employeeEmail').value.trim(),
        role: document.getElementById('employeeRole').value,
        phone: document.getElementById('employeePhone').value.trim(),
        password: generateRandomPassword()
    };

    try {
        // Prompt and store shop owner's password securely (⚠️ dev only)
        if (auth.currentUser) {
            const confirmedPassword = prompt("Please confirm your password to continue:");
            if (!confirmedPassword) {
                alert("Password confirmation is required");
                return;
            }
            localStorage.setItem('shopOwnerPassword', confirmedPassword);
        }

        const result = await createEmployeeAccount(employeeData);
        alert(`Employee created successfully!\nTemporary password: ${result.password}`);
        e.target.reset();
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

// Password generator
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Set the shopOwner.uid only after it's available
onAuthStateChanged(auth, (user) => {
    if (user) {
        try {
            myVar.setValue(user);
            console.log("UID set:", myVar.getValue());
        } catch (error) {
            console.error("Error setting UID:", error);
        }
    }
});
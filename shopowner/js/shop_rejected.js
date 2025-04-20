import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js"; // Added get import
import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // Initialize database

// Function to load shop data
async function loadShopData() {
    const user = auth.currentUser ;
    if (user) {
        const shopRef = ref(db, `AR_shoe_users/shop/${user.uid}`);
        const snapshot = await get(shopRef);
        if (snapshot.exists()) {
            const shopData = snapshot.val();
            populateShopForm(shopData);
        } else {
            console.error("No shop data found.");
        }
    } else {
        console.error("User  not authenticated.");
    }
}

// Function to populate the shop registration form
function populateShopForm(shopData) {
    // Assuming you have input fields in shop_registration.html with these IDs
    document.getElementById('shop-name').value = shopData.name || '';
    document.getElementById('shop-email').value = shopData.email || '';
    document.getElementById('shop-description').value = shopData.description || '';
    // Add more fields as necessary
}

// Event listener for the reapply button
document.getElementById('reapplyBtn').addEventListener('click', async () => {
    await loadShopData();
    window.location.href = "/shopowner/html/shop_registration.html"; // Redirect to registration page
});

// Event listener for the logout button
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert("You have been logged out successfully.");
        window.location.href = "/user_login.html"; // Redirect to login page
    } catch (error) {
        console.error("Error logging out:", error);
        alert("An error occurred while logging out. Please try again.");
    }
});

// Call loadShopData when the script loads
loadShopData();
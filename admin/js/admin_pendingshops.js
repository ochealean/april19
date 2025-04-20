import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// Initialize Firebase
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
const db = getDatabase(app);

// --- Action confirmation dialog ---
let currentAction = null; // Stores 'approve' or 'reject'
let currentRow = null;    // Stores the table row being acted upon
let currentShopId = null; // Stores the shop ID
const dialog = document.getElementById("confirmationDialog");
const overlay = document.getElementById("overlay");

// Confirm action handler
document.getElementById("confirmAction")?.addEventListener("click", function () {
        if (!currentAction || !currentShopId) return;

        const rejectionInput = document.getElementById("rejectionReason");
        let reason = null;

        if (currentAction === "reject") {
            reason = rejectionInput.value.trim();
            if (!reason) {
                showNotification("Please provide a reason for rejection", "error");
                // Add visual feedback
                rejectionInput.style.border = "2px solid red";
                rejectionInput.focus();
                // Remove the red border after 2 seconds
                setTimeout(() => {
                    rejectionInput.style.border = "";
                }, 2000);
                return;
            }
        }

        const shopRef = ref(db, `AR_shoe_users/shop/${currentShopId}`);
        const updateData = {
            status: currentAction === "approve" ? "approved" : "rejected",
            dateProcessed: new Date().toISOString(),  // Update existing dateProcessed
            ...(currentAction === "approve" && { dateApproved: new Date().toISOString() }),
            ...(currentAction === "reject" && { dateRejected: new Date().toISOString() }),
            ...(reason && { rejectionReason: reason })
        };

        update(shopRef, updateData)
            .then(() => {
                showNotification(`Shop ${currentAction}ed successfully!`, "success");
                currentRow?.remove();
                checkEmptyTable();
            })
            .catch((error) => {
                showNotification(`Failed to ${currentAction} shop: ${error.message}`, "error");
            })
            .finally(() => {
                hideDialog();
            });

        emailsend_4: {
            if (currentAction === "reject") {
                emailjs.init('gBZ5mCvVmgjo7wn0W');

                if (!email) {
                    alert('Please enter a recipient email');
                    showNotification('Please enter a recipient email', error);
                    return;
                }

                const templateParams = {
                    email: email,
                    from_name: 'Your App Name',
                    message: rejectionInput.value,
                    reply_to: 'your-default-reply@example.com'
                };

                emailjs.send('service_8i28mes', 'template_btslatu', templateParams)
                .then(function (response) {
                    showNotification('Email sent successfully to ' + email, 'success');
                }, function(error) {
                    showNotification('Failed to send email: ' + error.text, 'error');
                });
            }
        }
    });

// Cancel action handler
document.getElementById("cancelAction")?.addEventListener("click", hideDialog);

// Update the hideDialog function to clear the reason input
function hideDialog() {
    document.getElementById("confirmationDialog")?.classList.remove("show");
    document.getElementById("overlay")?.classList.remove("show");
    document.getElementById("rejectionReason").value = ''; // Clear the reason input
    currentAction = null;
    currentRow = null;
    currentShopId = null;
}

function checkEmptyTable() {
    const tbody = document.querySelector('tbody');
    if (tbody && tbody.querySelectorAll('tr').length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No pending shops remaining</td></tr>';
    }
}

// Update the showConfirmationDialog function
function showConfirmationDialog(e, actionType) {
    e.preventDefault();
    currentShopId = e.currentTarget.getAttribute('data-id');
    currentAction = actionType;
    currentRow = e.currentTarget.closest("tr");

    const shopRef = ref(db, `AR_shoe_users/shop/${currentShopId}`);
    
    onValue(shopRef, (snapshot) => {
        if (snapshot.exists()) {
            const shop = snapshot.val();
            updateDialogContent(shop, actionType);
            showDialog();
        } else {
            showNotification("Shop data not found", "error");
        }
    }, { onlyOnce: true });
}

// Update the updateDialogContent function
function updateDialogContent(shop, actionType) {
    const dialogMessage = document.getElementById("dialogMessage");
    const confirmBtn = document.getElementById("confirmAction");
    const confirmIcon = confirmBtn.querySelector('i');
    const reasonContainer = document.getElementById("rejectionReasonContainer");
    const reasonInput = document.getElementById("rejectionReason");

    const username = shop.username || 'N/A';
    const shopName = shop.shopName || 'Unknown Shop';

    dialogMessage.textContent = `Are you sure you want to ${actionType} "${shopName}" (${username})?`;
    
    // Show/hide reason input based on action type
    if (actionType === 'reject') {
        reasonContainer.style.display = 'block';
        reasonInput.value = ''; // Clear previous input
        reasonInput.required = true; // Make it required if you want
    } else {
        reasonContainer.style.display = 'none';
        reasonInput.required = false;
    }

    if (actionType === 'approve') {
        confirmIcon.className = 'fas fa-check';
        confirmBtn.className = 'approve-btn';
    } else {
        confirmIcon.className = 'fas fa-ban';
        confirmBtn.className = 'reject-btn';
    }
}

function showDialog() {
    dialog?.classList.add("show");
    overlay?.classList.add("show");
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('Notification element not found');
        return;
    }
    
    // Reset and set content
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Trigger show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Reset after animation completes
        setTimeout(() => {
            notification.className = 'notification';
        }, 400);
    }, 3000);
}

function createShopRow(shopId, shop, status) {
    const row = document.createElement('tr');
    row.className = 'animate-fade';
    row.setAttribute('data-id', shopId);

    // Basic row content - customize as needed
    row.innerHTML = `
        <td title="${shopId}">${shopId.substring(0, 6)}...</td>
        <td>${shop.shopName || 'N/A'}</td>
        <td>${shop.ownerName || 'N/A'}</td>
        <td>${shop.email || 'N/A'}</td>
        <td><a href="#" class="view-link" data-id="${shopId}"><i class="fas fa-eye"></i> View</a></td>        
        <td>${shop.dateApproved ? formatDisplayDate(shop.dateProcessed) : 'Pending'}</td>
        ${status === 'rejected' ? `<td></td>` : ''}
        <td>
            ${status === 'pending' ? 
                `<button class="approve-btn" data-id="${shopId}"><i class="fas fa-check"></i> Approve</button>
                 <button class="reject-btn" data-id="${shopId}"><i class="fas fa-ban"></i> Reject</button>` :
                status === 'approved' ?
                `<button class="reject-btn" data-id="${shopId}"><i class="fas fa-ban"></i> Reject</button>` :
                `<button class="approve-btn" data-id="${shopId}"><i class="fas fa-check"></i> Approve</button>`}
        </td>
    `;

    // Add event listeners
    row.querySelector('.view-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showShopModal(e);
    });
    row.querySelector('.approve-btn')?.addEventListener('click', (e) => showConfirmationDialog(e, 'approve'));
    row.querySelector('.reject-btn')?.addEventListener('click', (e) => showConfirmationDialog(e, 'reject'));

    return row;
}

// Show shop details modal
function showShopModal(e) {
    e.preventDefault();

    // Get the closest view-link element (in case user clicked the icon)
    const viewLink = e.target.closest('.view-link');
    if (!viewLink) return;

    currentShopId = viewLink.getAttribute('data-id');  // Get ID from the link
    const shopRef = ref(db, `AR_shoe_users/shop/${currentShopId}`);

    onValue(shopRef, (snapshot) => {
        if (snapshot.exists()) {
            const shop = snapshot.val();
            // Add deep fallbacks
            const safeShop = {
                ...shop,
                uploads: shop.uploads || {
                    frontSideID: { url: '' },
                    backSideID: { url: '' },
                    licensePreview: { url: '' },
                    permitDocument: { url: '' }
                },
                shopCategory: shop.shopCategory || 'N/A',
                shopAddress: shop.shopAddress || 'N/A',
                ownerPhone: shop.ownerPhone || '',
                shopCity: shop.shopCity || '',
                shopState: shop.shopState || '',
                shopCountry: shop.shopCountry || '',
                shopZip: shop.shopZip || ''
            };
            updateShopModalContent(safeShop);
            document.getElementById('shopDetailsModal').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        } else {
            showNotification("Shop data not found", "error");
        }
    }, { onlyOnce: true });
}

// Update modal content
function updateShopModalContent(shop) {
    const modalContent = document.getElementById('modalShopContent');
    const getDocUrl = (doc) => shop.uploads[doc]?.url || 'no-document.png';

    modalContent.innerHTML = `
        <div class="modal-section">
            <h3>Basic Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Shop ID: </span>
                    <span class="info-value">${currentShopId}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Shop Name: </span>
                    <span class="info-value">${shop.shopName || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category: </span>
                    <span class="info-value">${shop.shopCategory || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Description: </span>
                    <span class="info-value">${shop.shopDescription || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>Owner Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name: </span>
                    <span class="info-value">${shop.ownerName || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email: </span>
                    <span class="info-value">${shop.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Phone: </span>
                    <span class="info-value">${shop.ownerPhone ? '+63 ' + shop.ownerPhone : 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>Location Details</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Address: </span>
                    <span class="info-value">${[
                        shop.shopAddress,
                        shop.shopCity,
                        shop.shopState,
                        shop.shopCountry
                    ].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">ZIP Code: </span>
                    <span class="info-value">${shop.shopZip || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>Business Documents</h3>
            <div class="document-grid">
                ${renderDocumentItem(getDocUrl('frontSideID'), 'Front ID')}
                ${renderDocumentItem(getDocUrl('backSideID'), 'Back ID')}
                ${renderDocumentItem(getDocUrl('licensePreview'), 'Business License')}
                ${renderDocumentItem(getDocUrl('permitDocument'), 'Permit')}
            </div>
        </div>

        <div class="modal-section">
            <h3>Timestamps</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Registration Date: </span>
                    <span class="info-value">${formatDisplayDate(shop.dateProcessed) || 'N/A'}</span>
                </div>
                <div class="info-item">
                    ${shop.status === 'approved' ? `
                        <span class="info-label">Approval Date: </span>
                        <span class="info-value">${formatDisplayDate(shop.dateApproved)}</span>
                    ` : ''}
                    
                    ${shop.status === 'rejected' ? `
                        <span class="info-label">Rejection Date: </span>
                        <span class="info-value">${formatDisplayDate(shop.dateRejected)}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// format ng date and time
function formatDisplayDate(isoString) {
    if (!isoString) return 'N/A';
    
    const date = new Date(isoString);
    if (isNaN(date)) return 'Invalid Date';

    // Format time (1:19 AM)
    const timeString = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Format date (April 19, 2025)
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();

    return `${timeString} ${month} ${day}, ${year}`;
}

// Add helper function
function renderDocumentItem(url, title) {
    return `
    <div class="document-item">
        <div class="document-title">${title}</div>
        <a href="${url}" target="_blank" class="document-preview">
            <img src="${url}" alt="${title}" 
                 onerror="this.onerror=null;this.src='no-document.png'">
        </a>
    </div>`;
}

document.getElementById('closeShopModal')?.addEventListener('click', () => {
    document.getElementById('shopDetailsModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
});

document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('shopDetailsModal').classList.remove('show');
});

// -----------------------------------------add from macmac code---------------------------------------------------
let currentPage = 1;
    const rowsPerPage = 10; // Show 10 rows per page
    const tableBody = document.querySelector("#pending-shops tbody");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const paginationContainer = document.querySelector(".pagination"); // Container for page number buttons

    function updateTableDisplay() {
        if (!tableBody) return; // Guard clause
        const rows = tableBody.querySelectorAll("tr");
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;

        rows.forEach((row, index) => {
            // Hide row by default
            row.classList.remove("show");
            row.style.display = 'none'; // Use style.display for hiding/showing

            // Show row if it's within the current page range
            if (index >= startIndex && index < endIndex) {
                row.classList.add("show");
                row.style.display = ''; // Reset to default display (table-row)
            }
        });
    }

    // --- Update pagination button states (Prev/Next and Active page) ---
    function updatePaginationButtons() {
        if (!tableBody) return; // Guard clause
        const rows = tableBody.querySelectorAll("tr");
        const pageCount = Math.ceil(rows.length / rowsPerPage);
        const pageButtons = paginationContainer.querySelectorAll(".page-btn");

        // Update active state for number buttons
        pageButtons.forEach(btn => {
            btn.classList.remove("active");
            if (parseInt(btn.textContent) === currentPage) {
                btn.classList.add("active");
            }
        });

        // Update Previous/Next button disabled states
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === pageCount || pageCount === 0; // Also disable if no pages
    }
    function createPageButton(pageNumber) {
        const pageBtn = document.createElement("button");
        pageBtn.className = "pagination-btn page-btn";
        pageBtn.textContent = pageNumber;

        if (pageNumber === currentPage) {
            pageBtn.classList.add("active");
        }

        pageBtn.addEventListener("click", () => {
            currentPage = pageNumber;
            setupPagination(); // Re-setup to update active states and potentially shown numbers
        });

        // Insert the button before the 'Next' button
        paginationContainer.insertBefore(pageBtn, nextBtn);
    }

    //------------------------------------------dito matatapos code ni mac------------------------------------------

// Add this to your admin_pendingshops.js file

// Search functionality
const searchInput = document.getElementById('shopSearch');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearch');

// Store the original shops data
let originalShops = [];
let filteredShops = [];

// Modified loadShops function to store data
function loadShops(status, tableBodyId) {
    const shopsRef = ref(db, 'AR_shoe_users/shop');
    const tbody = document.getElementById(tableBodyId);

    if (!tbody) return;

    onValue(shopsRef, (snapshot) => {
        tbody.innerHTML = '';
        originalShops = [];

        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="7">No shops found</td></tr>`;
            return;
        }

        let hasShops = false;
        snapshot.forEach((childSnapshot) => {
            const shop = childSnapshot.val();
            if (shop.status === status) {
                hasShops = true;
                const shopWithId = { ...shop, id: childSnapshot.key };
                originalShops.push(shopWithId);
                const row = createShopRow(childSnapshot.key, shop, status);
                tbody.appendChild(row);
            }
        });

        if (!hasShops) {
            tbody.innerHTML = `<tr><td colspan="7">No ${status} shops found</td></tr>`;
        }

        // Initialize filteredShops with all shops
        filteredShops = [...originalShops];
        
        // Setup pagination after loading data
        setupPagination();
    });
}

// Search function - UPDATED to use correct table ID
function performSearch(searchTerm) {
    const tbody = document.getElementById('pendingShopsTableBody'); // Changed to pendingShopsTableBody
    if (!tbody) return;

    if (!searchTerm.trim()) {
        // If search is empty, show all shops
        filteredShops = [...originalShops];
    } else {
        // Filter shops based on search term
        filteredShops = originalShops.filter(shop => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (shop.id && shop.id.toLowerCase().includes(searchLower)) ||
                (shop.shopName && shop.shopName.toLowerCase().includes(searchLower)) ||
                (shop.ownerName && shop.ownerName.toLowerCase().includes(searchLower)) ||
                (shop.email && shop.email.toLowerCase().includes(searchLower))
            );
        });
    }

    // Clear current table
    tbody.innerHTML = '';

    // Display filtered results
    if (filteredShops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No matching shops found</td></tr>';
    } else {
        filteredShops.forEach(shop => {
            const row = createShopRow(shop.id, shop, 'pending'); // Changed status to 'approved'
            tbody.appendChild(row);
        });
    }

    // Reset to first page after search
    currentPage = 1;
    setupPagination();
}

// Event listeners for search
function setupSearchListeners() {
    searchBtn?.addEventListener('click', () => {
        performSearch(searchInput.value.trim());
    });

    clearSearchBtn?.addEventListener('click', () => {
        searchInput.value = '';
        performSearch('');
        showNotification("Search filters cleared", "success");
    });

    searchInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
        }
    });
}

// Update your setupPagination function to work with filteredShops
function setupPagination() {
    const rows = document.querySelectorAll("#pendingShopsTableBody tr"); // Updated selector
    const pageCount = Math.ceil(rows.length / rowsPerPage);

    // Clear existing page number buttons (excluding prev/next)
    const existingPageButtons = paginationContainer.querySelectorAll(".page-btn");
    existingPageButtons.forEach(btn => btn.remove());

    // Add page number buttons
    const maxPageButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtonsToShow / 2));
    let endPage = Math.min(pageCount, startPage + maxPageButtonsToShow - 1);

    // Adjust startPage if endPage hits the limit early
    startPage = Math.max(1, endPage - maxPageButtonsToShow + 1);

    // Add 'First' button if needed
    if (startPage > 1) {
        createPageButton(1);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.insertBefore(ellipsis, nextBtn);
        }
    }

    // Add page number buttons in the calculated range
    for (let i = startPage; i <= endPage; i++) {
        createPageButton(i);
    }

    // Add 'Last' button if needed
    if (endPage < pageCount) {
        if (endPage < pageCount - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.insertBefore(ellipsis, nextBtn);
        }
        createPageButton(pageCount);
    }

    updateTableDisplay();
    updatePaginationButtons();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadShops('pending', 'pendingShopsTableBody');
    setupSearchListeners(); // Add this line to initialize search listeners
});



//  ------------------------- CODE NI MACMAC ------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    // Menu toggle functionality
    const menuBtn = document.querySelector(".menu-btn");
    const navLinks = document.querySelector(".nav-links");

    menuBtn?.addEventListener("click", function () {
        navLinks.classList.toggle("active");
        menuBtn.innerHTML = navLinks.classList.contains("active") ?
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // --- Pagination variables ---
    /*
    let currentPage = 1;
    const rowsPerPage = 10; // Show 10 rows per page
    const tableBody = document.querySelector("#pending-shops tbody");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const paginationContainer = document.querySelector(".pagination"); // Container for page number buttons
    */

    // --- Initialize pagination ---
    function setupPagination() {
        // Ensure tableBody exists before proceeding
        if (!tableBody) {
            console.error("Table body not found for pagination setup.");
            return;
        }
        const rows = tableBody.querySelectorAll("tr");
        const pageCount = Math.ceil(rows.length / rowsPerPage);

        // Clear existing page number buttons (excluding prev/next)
        const existingPageButtons = paginationContainer.querySelectorAll(".page-btn");
        existingPageButtons.forEach(btn => btn.remove());

        // Add page number buttons
        // Show limited page numbers (e.g., first, last, current +/- 2) for many pages
        const maxPageButtonsToShow = 5; // Adjust as needed
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtonsToShow / 2));
        let endPage = Math.min(pageCount, startPage + maxPageButtonsToShow - 1);

        // Adjust startPage if endPage hits the limit early
        startPage = Math.max(1, endPage - maxPageButtonsToShow + 1);

        // Add 'First' button if needed
        if (startPage > 1) {
            createPageButton(1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.insertBefore(ellipsis, nextBtn);
            }
        }

        // Add page number buttons in the calculated range
        for (let i = startPage; i <= endPage; i++) {
            createPageButton(i);
        }

        // Add 'Last' button if needed
        if (endPage < pageCount) {
            if (endPage < pageCount - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.insertBefore(ellipsis, nextBtn);
            }
            createPageButton(pageCount);
        }


        updateTableDisplay(); // Show the correct rows for the current page
        updatePaginationButtons(); // Enable/disable prev/next and highlight active page
    }

    // Helper function to create a page number button
    /*
    function createPageButton(pageNumber) {
        const pageBtn = document.createElement("button");
        pageBtn.className = "pagination-btn page-btn";
        pageBtn.textContent = pageNumber;

        if (pageNumber === currentPage) {
            pageBtn.classList.add("active");
        }

        pageBtn.addEventListener("click", () => {
            currentPage = pageNumber;
            setupPagination(); // Re-setup to update active states and potentially shown numbers
        });

        // Insert the button before the 'Next' button
        paginationContainer.insertBefore(pageBtn, nextBtn);
    }
*/

    // --- Update table display for current page ---
    /*
    function updateTableDisplay() {
        if (!tableBody) return; // Guard clause
        const rows = tableBody.querySelectorAll("tr");
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;

        rows.forEach((row, index) => {
            // Hide row by default
            row.classList.remove("show");
            row.style.display = 'none'; // Use style.display for hiding/showing

            // Show row if it's within the current page range
            if (index >= startIndex && index < endIndex) {
                row.classList.add("show");
                row.style.display = ''; // Reset to default display (table-row)
            }
        });
    }

    // --- Update pagination button states (Prev/Next and Active page) ---
    function updatePaginationButtons() {
        if (!tableBody) return; // Guard clause
        const rows = tableBody.querySelectorAll("tr");
        const pageCount = Math.ceil(rows.length / rowsPerPage);
        const pageButtons = paginationContainer.querySelectorAll(".page-btn");

        // Update active state for number buttons
        pageButtons.forEach(btn => {
            btn.classList.remove("active");
            if (parseInt(btn.textContent) === currentPage) {
                btn.classList.add("active");
            }
        });

        // Update Previous/Next button disabled states
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === pageCount || pageCount === 0; // Also disable if no pages
    }
        */

    // --- Navigation button handlers ---
    prevBtn?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            setupPagination(); // Re-setup to update everything
        }
    });

    nextBtn?.addEventListener("click", () => {
        if (!tableBody) return; // Guard clause
        const rows = tableBody.querySelectorAll("tr");
        const pageCount = Math.ceil(rows.length / rowsPerPage);

        if (currentPage < pageCount) {
            currentPage++;
            setupPagination(); // Re-setup to update everything
        }
    });

    // --- Action confirmation dialog ---
    let currentAction = null; // Stores 'approve' or 'reject'
    let currentRow = null;    // Stores the table row being acted upon
    const dialog = document.getElementById("confirmationDialog");
    const overlay = document.getElementById("overlay");

    function confirmAction(button, actionType) {
        currentRow = button.closest("tr");
        if (!currentRow) return;
        
        currentAction = actionType;

        const shopName = currentRow.cells[1]?.textContent || '[Unknown Shop]';
        const dialog = document.getElementById("confirmationDialog");
        const dialogMessage = document.getElementById("dialogMessage");
        const overlay = document.getElementById("overlay");

        if (!dialog || !dialogMessage || !overlay) return;

        dialogMessage.textContent = `Are you sure you want to ${actionType} "${shopName}"?`;
        
        dialog.classList.add("show");
        overlay.classList.add("show");
    }

    tableBody?.addEventListener('click', function(event) {
        const target = event.target.closest('button');
        if (!target) return;
        
        if (target.classList.contains('reject-btn') && target.id !== 'confirmAction') {
            confirmAction(target, 'reject');
        }
    });


// Confirm action handler
    document.getElementById("confirmAction")?.addEventListener("click", function () {
        if (!currentAction || !currentShopId) return;

        const rejectionInput = document.getElementById("rejectionReason");
        let reason = null;

        if (currentAction === "reject") {
            reason = rejectionInput.value.trim();
            if (!reason) {
                showNotification("Please provide a reason for rejection.", "error");

                // Add visual feedback to the textarea
                rejectionInput.style.border = "2px solid red";
                rejectionInput.focus();

                // Remove the red border after 2 seconds
                setTimeout(() => {
                    rejectionInput.style.border = "";
                }, 2000);

                return;
            }
        }

        const shopRef = ref(db, `AR_shoe_users/shop/${currentShopId}`);
        const updateData = {
            status: currentAction === "approve" ? "approved" : "rejected",
            dateProcessed: new Date().toISOString(),  // Update existing dateProcessed
            ...(currentAction === "approve" && { dateApproved: new Date().toISOString() }),
            ...(currentAction === "reject" && { dateRejected: new Date().toISOString() }),
            ...(reason && { rejectionReason: reason })
        };

        update(shopRef, updateData)
            .then(() => {
                showNotification(`Shop ${currentAction}ed successfully!`, "success");
                currentRow?.remove();
                checkEmptyTable();
            })
            .catch((error) => {
                showNotification(`Failed to ${currentAction} shop: ${error.message}`, "error");
            })
            .finally(() => {
                hideDialog();
            });

        emailsend_4: {
            if (currentAction === "reject") {
                emailjs.init('gBZ5mCvVmgjo7wn0W');

                if (!email) {
                    alert('Please enter a recipient email');
                    return;
                }

                const templateParams = {
                    email: email,
                    from_name: 'Your App Name',
                    message: rejectionInput.value,
                    reply_to: 'your-default-reply@example.com'
                };

                emailjs.send('service_8i28mes', 'template_btslatu', templateParams)
                    .then(function (response) {
                        console.log('Email sent!', response.status, response.text);
                        alert('Email sent successfully to ' + email);
                    }, function (error) {
                        console.error('Failed to send', error);
                        alert('Failed to send email: ' + error.text);
                    });
            }
        }
    });

    document.getElementById("cancelAction")?.addEventListener("click", function () {
        const dialog = document.getElementById("confirmationDialog");
        const overlay = document.getElementById("overlay");

        // Hide dialog
        dialog?.classList.remove("show");
        overlay?.classList.remove("show");

        // Reset state
        currentAction = null;
        currentRow = null;
    });

    // --- Shop approval/rejection functions ---
    function approveShop(row) {
        const shopId = row.getAttribute("data-id");
        const shopName = row.cells[1]?.textContent || '[Unknown Shop]';

        console.log(`Approving shop ID: ${shopId}, Name: ${shopName}`); // Log action

        // In a real app, you would send an API request here
        // Example: fetch(`/api/shops/${shopId}/approve`, { method: 'POST' }) ...

        // Simulate success after a short delay
        setTimeout(() => {
            row.remove(); // Remove the row from the table
            showNotification(`"${shopName}" has been approved successfully!`, "success");
            // Recalculate pagination as a row was removed
            // Adjust current page if it becomes empty
            if (tableBody && tableBody.querySelectorAll("tr:not([style*='display: none'])").length === 0 && currentPage > 1) {
                currentPage--;
            }
            setupPagination();
        }, 300); // Simulate network delay
    }

    

  

    // --- Initialize everything on load ---
    setupPagination();

}); // End of DOMContentLoaded listener

// Logout functionality
const logoutLink = document.querySelector('a[href="/admin/html/admin_login.html"]');
const logoutDialog = document.getElementById('logoutDialog');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

// Prevent default logout link behavior
logoutLink?.addEventListener('click', function (e) {
    e.preventDefault();

    // Show logout confirmation dialog
    logoutDialog.classList.add('show');
    document.getElementById('overlay').classList.add('show');
});

// Cancel logout
cancelLogout?.addEventListener('click', function () {
    logoutDialog.classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
});

// Confirm logout
confirmLogout?.addEventListener('click', function () {
   
    window.location.href = '/admin/html/admin_login.html';
});

// Close dialog when clicking overlay
document.getElementById('overlay')?.addEventListener('click', function () {
    logoutDialog.classList.remove('show');
    this.classList.remove('show');
});



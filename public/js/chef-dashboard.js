// --- STATE ---
let incomingRequests = [];
let myMenu = []; 
let chefProfile = null;
const user = JSON.parse(localStorage.getItem('user'));
let isOnline = false;

// --- DOM ELEMENTS ---
const requestsContainer = document.getElementById('requestsContainer');
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');
const sidebarMenuList = document.getElementById('sidebarMenuList');
const menuModal = document.getElementById('menuModal');
const liveIndicator = document.getElementById('liveIndicator');

// --- INITIAL RENDER ---
document.addEventListener('DOMContentLoaded', () => {
    if(!user || user.role !== 'chef') {
        window.location.href = 'login.html';
        return;
    }
    // 1. First load profile
    initDashboard();
});

async function initDashboard() {
    await fetchMyProfile();
    // 2. If profile loaded, fetch requests
    if (chefProfile) {
        fetchIncomingRequests();
        // Set online status based on DB if available
        if (chefProfile.isOnline) {
            isOnline = true;
            updateOnlineUI();
        }
    }
}

// --- API: GET PROFILE ---
async function fetchMyProfile() {
    try {
        const res = await fetch(`/api/chefs/user/${user._id}`);
        if(res.ok) {
            chefProfile = await res.json();
            myMenu = chefProfile.menu || [];
            renderSidebarMenu();
        } else {
            console.error("Profile not found");
        }
    } catch (e) {
        console.error("Error loading profile", e);
    }
}

// --- API: FETCH REQUESTS ---
async function fetchIncomingRequests() {
    if (!chefProfile) return;

    try {
        // Assuming your backend route is /api/bookings/chef/:chefId
        // We filter for 'pending' requests typically
        const res = await fetch(`/api/bookings/chef/${chefProfile._id}`);
        
        if (res.ok) {
            const allBookings = await res.json();
            // Filter only pending requests for the "Live Job Board"
            incomingRequests = allBookings.filter(b => b.status === 'pending');
            renderRequests();
        }
    } catch (e) {
        console.error("Error fetching requests", e);
    }
}

// --- API: UPDATE REQUEST STATUS ---
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            // Remove from local list and re-render
            incomingRequests = incomingRequests.filter(b => b._id !== bookingId);
            renderRequests();
            alert(`Order ${newStatus}!`);
        } else {
            alert("Failed to update order");
        }
    } catch (e) {
        console.error(e);
        alert("Server Error");
    }
}

// --- API: SAVE MENU ---
async function saveMenuToBackend() {
    if (!chefProfile) return;

    try {
        const res = await fetch(`/api/chefs/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: user._id,
                menu: myMenu 
            })
        });

        if(res.ok) {
            renderSidebarMenu();
            closeMenuModal();
        } else {
            alert("Failed to save menu to server.");
        }
    } catch (e) {
        console.error(e);
        alert("Server Error while saving menu");
    }
}

// --- MENU LOGIC ---
function renderSidebarMenu() {
    if (!sidebarMenuList) return;
    sidebarMenuList.innerHTML = myMenu.map((item, index) => `
        <li>
            <span>${item.name}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="price-badge">₹${item.price}</span>
                <i class="fas fa-trash" style="color:#ef4444; cursor:pointer; font-size:0.8rem;" onclick="deleteDish(${index})"></i>
            </div>
        </li>
    `).join('');
}

window.openMenuModal = function() {
    menuModal.classList.remove('hidden');
}

window.closeMenuModal = function() {
    menuModal.classList.add('hidden');
}

window.addDish = async function() {
    const nameInput = document.getElementById('newDishName');
    const priceInput = document.getElementById('newDishPrice');
    const btn = document.querySelector('#menuModal .btn-primary');
    
    if(nameInput.value && priceInput.value) {
        // 1. Add to local state
        myMenu.push({
            name: nameInput.value,
            price: parseInt(priceInput.value)
        });

        // 2. Save to Backend
        btn.innerText = "Saving...";
        await saveMenuToBackend();
        
        // 3. Reset UI
        btn.innerText = "Add to Menu";
        nameInput.value = '';
        priceInput.value = '';
    } else {
        alert("Please fill in both fields");
    }
}

window.deleteDish = async function(index) {
    if(confirm("Delete this dish?")) {
        myMenu.splice(index, 1);
        await saveMenuToBackend();
    }
}

// --- ONLINE TOGGLE ---
window.toggleOnline = function() {
    isOnline = !isOnline;
    updateOnlineUI();
    // Optional: Save online status to backend here if needed
}

function updateOnlineUI() {
    if (isOnline) {
        statusPill.classList.remove('offline');
        statusPill.classList.add('online');
        statusText.innerText = "You are Online";
        if(liveIndicator) liveIndicator.classList.remove('hidden');
        renderRequests();
    } else {
        statusPill.classList.remove('online');
        statusPill.classList.add('offline');
        statusText.innerText = "Go Online";
        if(liveIndicator) liveIndicator.classList.add('hidden');
        
        requestsContainer.innerHTML = `
            <div class="empty-state-box">
                <div class="empty-icon"><i class="fas fa-power-off"></i></div>
                <h3>You are currently Offline</h3>
                <p>Go online to start receiving cooking requests nearby.</p>
                <button class="btn-primary" style="margin-top:15px; width:auto; padding:10px 20px;" onclick="toggleOnline()">Go Online Now</button>
            </div>`;
    }
}

function renderRequests() {
    if (!isOnline) return;

    if (incomingRequests.length === 0) {
        requestsContainer.innerHTML = '<div class="empty-state-box"><p>No pending requests at the moment.</p></div>';
        return;
    }

    requestsContainer.innerHTML = incomingRequests.map(req => {
        // Handle different data structures (in case backend returns 'user' object or just 'customerName')
        const customerName = req.user ? req.user.name : (req.customerName || "Unknown Customer");
        const location = req.location || "Location not specified";
        const total = req.totalPrice || req.total || 0;
        
        // Format items string
        let itemsSummary = "";
        if (req.dishes && req.dishes.length > 0) {
            itemsSummary = req.dishes.join(", ");
        } else {
            itemsSummary = "Chef's Choice / Custom Menu";
        }

        return `
        <div class="request-card" id="req-${req._id}">
            <div class="req-header">
                <div class="customer-info">
                    <h4>${customerName}</h4>
                    <div class="req-meta"><i class="fas fa-map-marker-alt"></i> ${location}</div>
                    <div class="req-meta" style="margin-top:5px; font-size:0.8rem;">
                        <i class="far fa-calendar"></i> ${req.date} | <i class="far fa-clock"></i> ${req.hours} hrs
                    </div>
                </div>
                <div style="background:#334155; padding:5px 10px; border-radius:6px; height:fit-content; font-size:0.8rem;">NEW</div>
            </div>
            
            <div class="req-items">
                <strong>Request:</strong> ${itemsSummary}
            </div>
            <div class="req-total">₹${total}</div>

            <div class="req-actions">
                <button class="btn-accept" onclick="acceptRequest('${req._id}')">Accept Order</button>
                <button class="btn-reject" onclick="rejectRequest('${req._id}')">Reject</button>
            </div>
        </div>
    `}).join('');
}

window.acceptRequest = function(id) {
    updateBookingStatus(id, 'accepted');
}

window.rejectRequest = function(id) {
    updateBookingStatus(id, 'rejected');
}
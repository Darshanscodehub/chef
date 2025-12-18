// --- STATE ---
let incomingRequests = [];
let myMenu = []; 
let chefProfile = null;
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
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
    // Check if user is logged in
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Add Logout Listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
        });
    }

    // 1. First load profile
    initDashboard();
});

async function initDashboard() {
    await fetchMyProfile();
    // 2. If profile loaded, fetch requests
    if (chefProfile) {
        fetchIncomingRequests();
        // Set online status based on DB (assuming isOnline is part of profile schema, otherwise default false)
        if (chefProfile.isOnline) {
            isOnline = true;
            updateOnlineUI();
        }
    } else {
        console.log("Chef profile not yet created.");
        // Optionally redirect to onboarding if profile is missing
        // window.location.href = 'chef-onboarding.html';
    }
}

// --- API: GET PROFILE ---
async function fetchMyProfile() {
    try {
        // Fetches profile for the currently logged-in user (requires auth token)
        const res = await fetch('/api/chef/me', {
            method: 'GET',
            headers: {
                'x-auth-token': token
            }
        });

        if (res.ok) {
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
    try {
        const res = await fetch('/api/bookings/chef', {
            method: 'GET',
            headers: {
                'x-auth-token': token
            }
        });
        
        if (res.ok) {
            const allBookings = await res.json();
            // Filter only 'pending' requests for the live board
            incomingRequests = allBookings.filter(b => b.status === 'pending');
            renderRequests();
        } else {
            console.error("Failed to fetch bookings");
        }
    } catch (e) {
        console.error("Error fetching requests", e);
    }
}

// --- API: UPDATE REQUEST STATUS ---
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            // Remove from local list (since it is no longer pending) and re-render
            incomingRequests = incomingRequests.filter(b => b._id !== bookingId);
            renderRequests();
            alert(`Order ${newStatus}!`);
        } else {
            const data = await res.json();
            alert(data.msg || "Failed to update order");
        }
    } catch (e) {
        console.error(e);
        alert("Server Error");
    }
}

// --- API: SAVE MENU ---
async function saveMenuToBackend() {
    try {
        // We use the profile update endpoint to save the entire menu array
        // Ensure this route matches your chefController.createOrUpdateProfile logic (usually POST /api/chef)
        const res = await fetch('/api/chef', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ 
                menu: myMenu 
            })
        });

        if (res.ok) {
            // Update local profile with the response to ensure synchronization
            const updatedProfile = await res.json();
            myMenu = updatedProfile.menu; 
            renderSidebarMenu();
            closeMenuModal();
            alert("Menu saved successfully!");
        } else {
            const data = await res.json();
            alert(data.msg || "Failed to save menu to server.");
        }
    } catch (e) {
        console.error(e);
        alert("Server Error while saving menu");
    }
}

// --- MENU LOGIC ---
function renderSidebarMenu() {
    if (!sidebarMenuList) return;

    if (myMenu.length === 0) {
        sidebarMenuList.innerHTML = '<li style="color: #64748b; font-style: italic;">No dishes added yet.</li>';
        return;
    }

    sidebarMenuList.innerHTML = myMenu.map((item, index) => `
        <li>
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:600;">${item.name}</span>
                ${item.description ? `<span style="font-size:0.8em; color:#64748b;">${item.description}</span>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="price-badge">₹${item.price}</span>
                <i class="fas fa-trash" style="color:#ef4444; cursor:pointer; font-size:0.9rem;" onclick="deleteDish(${index})"></i>
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
    // Check if description input exists, otherwise default to empty
    const descInput = document.getElementById('newDishDesc'); 
    
    if (nameInput.value && priceInput.value) {
        const btn = document.querySelector('#menuModal .btn-primary');
        const originalText = btn.innerText;
        btn.innerText = "Saving...";

        // 1. Add to local state
        const newDish = {
            name: nameInput.value,
            price: parseInt(priceInput.value),
            description: descInput ? descInput.value : ""
        };
        myMenu.push(newDish);

        // 2. Save to Backend
        await saveMenuToBackend();
        
        // 3. Reset UI
        btn.innerText = originalText;
        nameInput.value = '';
        priceInput.value = '';
        if (descInput) descInput.value = '';
    } else {
        alert("Please fill in at least the Name and Price fields.");
    }
}

window.deleteDish = async function(index) {
    if (confirm("Delete this dish?")) {
        myMenu.splice(index, 1);
        await saveMenuToBackend();
    }
}

// --- ONLINE TOGGLE ---
window.toggleOnline = function() {
    isOnline = !isOnline;
    updateOnlineUI();
    // Optional: You could save this status to the backend here so it persists
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
        // Handle data whether user info is populated or not
        const customerName = req.user ? req.user.name : "Customer";
        // Convert date string to readable format
        const dateStr = new Date(req.date).toLocaleDateString();

        return `
        <div class="request-card" id="req-${req._id}">
            <div class="req-header">
                <div class="customer-info">
                    <h4>${customerName}</h4>
                    <div class="req-meta"><i class="fas fa-map-marker-alt"></i> Location (See Map)</div>
                    <div class="req-meta" style="margin-top:5px; font-size:0.8rem;">
                        <i class="far fa-calendar"></i> ${dateStr} | <i class="far fa-clock"></i> ${req.time}
                    </div>
                </div>
                <div style="background:#334155; color:#fff; padding:5px 10px; border-radius:6px; height:fit-content; font-size:0.8rem;">NEW</div>
            </div>
            
            <div class="req-items">
                <strong>Guests:</strong> ${req.guests}<br>
                <strong>Requests:</strong> ${req.specialRequests || 'None'}
            </div>
            
            <!-- Removed fixed total calculation since we don't have per-request dishes list yet, usually total is calculated on backend or stored in booking -->
            
            <div class="req-actions">
                <button class="btn-accept" onclick="acceptRequest('${req._id}')">Accept Order</button>
                <button class="btn-reject" onclick="rejectRequest('${req._id}')">Reject</button>
            </div>
        </div>
    `}).join('');
}

window.acceptRequest = function(id) {
    if(confirm("Are you sure you want to accept this booking?")) {
        updateBookingStatus(id, 'confirmed');
    }
}

window.rejectRequest = function(id) {
    if(confirm("Are you sure you want to reject this booking?")) {
        updateBookingStatus(id, 'rejected');
    }
}
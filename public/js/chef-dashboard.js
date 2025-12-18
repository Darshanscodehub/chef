// --- STATE ---
let incomingRequests = [];
let myMenu = []; 
let chefProfile = null;
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token'); // Important: Get token for requests
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
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    initDashboard();
});

async function initDashboard() {
    await fetchMyProfile();
    if (chefProfile) {
        fetchIncomingRequests();
        // If profile has isOnline status, use it
        if (chefProfile.isOnline) {
            isOnline = true;
            updateOnlineUI();
        }
    } else {
        // If user is chef but has no profile, maybe redirect to onboarding
        console.log("No chef profile found.");
    }
}

// --- API: GET PROFILE ---
async function fetchMyProfile() {
    try {
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
        // Correct endpoint for logged-in chef
        const res = await fetch('/api/bookings/chef', {
            method: 'GET',
            headers: {
                'x-auth-token': token
            }
        });
        
        if (res.ok) {
            const allBookings = await res.json();
            // Filter bookings that are pending
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
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            // Remove locally and re-render
            incomingRequests = incomingRequests.filter(b => b._id !== bookingId);
            renderRequests();
            alert(`Order ${newStatus}!`);
            // Refresh bookings to be safe
            fetchIncomingRequests();
        } else {
            const data = await res.json();
            alert(data.msg || "Failed to update order");
        }
    } catch (e) {
        console.error(e);
        alert("Server Error");
    }
}

// --- API: ADD DISH ---
window.addDish = async function() {
    const nameInput = document.getElementById('newDishName');
    const priceInput = document.getElementById('newDishPrice');
    const btn = document.querySelector('#menuModal .btn-primary');
    
    if (nameInput.value && priceInput.value) {
        const originalText = btn.innerText;
        btn.innerText = "Saving...";

        const newDish = {
            name: nameInput.value,
            price: parseInt(priceInput.value),
            description: "Delicious homemade dish" // Default description if input missing
        };

        try {
            const res = await fetch('/api/chef/menu', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                },
                body: JSON.stringify(newDish)
            });

            if (res.ok) {
                // The backend returns the updated menu array
                const updatedMenu = await res.json();
                myMenu = updatedMenu; 
                renderSidebarMenu();
                closeMenuModal();
                nameInput.value = '';
                priceInput.value = '';
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to add dish.");
            }
        } catch (e) {
            console.error(e);
            alert("Error adding dish");
        }
        
        btn.innerText = originalText;
    } else {
        alert("Please fill in name and price");
    }
}

window.deleteDish = async function(index) {
    if(confirm("Delete this dish?")) {
        // For now, we update the whole profile menu without this item
        // A better approach in backend would be a DELETE endpoint for specific dish ID
        myMenu.splice(index, 1);
        
        // Save the *entire* updated menu
        try {
            const res = await fetch('/api/chef', {
                method: 'POST', // Using update profile route
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ menu: myMenu })
            });
            
            if(res.ok) {
                renderSidebarMenu();
            }
        } catch(e) {
            console.error(e);
        }
    }
}

// --- MENU UI ---
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

window.openMenuModal = function() { menuModal.classList.remove('hidden'); }
window.closeMenuModal = function() { menuModal.classList.add('hidden'); }

// --- ONLINE TOGGLE ---
window.toggleOnline = function() {
    isOnline = !isOnline;
    updateOnlineUI();
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
        const customerName = req.user && req.user.name ? req.user.name : "Customer";
        const dateStr = new Date(req.date).toLocaleDateString();

        return `
        <div class="request-card" id="req-${req._id}">
            <div class="req-header">
                <div class="customer-info">
                    <h4>${customerName}</h4>
                    <div class="req-meta"><i class="fas fa-map-marker-alt"></i> View Location</div>
                    <div class="req-meta" style="margin-top:5px; font-size:0.8rem;">
                        <i class="far fa-calendar"></i> ${dateStr} | <i class="far fa-clock"></i> ${req.time}
                    </div>
                </div>
                <div style="background:#334155; padding:5px 10px; border-radius:6px; height:fit-content; font-size:0.8rem;">NEW</div>
            </div>
            
            <div class="req-items">
                <strong>Guests:</strong> ${req.guests}<br>
                <strong>Requests:</strong> ${req.specialRequests || 'None'}
            </div>
            <!-- <div class="req-total">₹${req.totalPrice || '0'}</div> -->

            <div class="req-actions">
                <button class="btn-accept" onclick="acceptRequest('${req._id}')">Accept Order</button>
                <button class="btn-reject" onclick="rejectRequest('${req._id}')">Reject</button>
            </div>
        </div>
    `}).join('');
}

window.acceptRequest = function(id) {
    if(confirm("Accept this booking?")) {
        updateBookingStatus(id, 'confirmed');
    }
}

window.rejectRequest = function(id) {
    if(confirm("Reject this booking?")) {
        updateBookingStatus(id, 'rejected');
    }
}
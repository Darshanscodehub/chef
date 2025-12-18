// --- STATE ---
let myBookings = [];
let activeTab = 'upcoming';
const user = JSON.parse(localStorage.getItem('user'));

// --- DOM ELEMENTS ---
const container = document.getElementById('bookingsList');
const chatDrawer = document.getElementById('chatDrawer');
const chatOverlay = document.getElementById('chatOverlay');
const chatMessages = document.getElementById('chatMessages');

// --- INITIAL RENDER ---
document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    fetchBookings();
});

// --- API CALL ---
async function fetchBookings() {
    try {
        const res = await fetch(`/api/bookings/user/${user._id}`);
        if (!res.ok) throw new Error("Failed to fetch bookings");
        
        const data = await res.json();
        myBookings = data;
        renderBookings();
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="color:#aaa; text-align:center;">Failed to load bookings.</p>';
    }
}

// --- TABS ---
window.switchTab = function(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderBookings();
}

// --- RENDER BOOKINGS ---
function renderBookings() {
    container.innerHTML = '';

    const filtered = myBookings.filter(b => {
        if (activeTab === 'upcoming') return b.status !== 'completed' && b.status !== 'rejected';
        return b.status === 'completed' || b.status === 'rejected';
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#aaa; padding:40px;">No ${activeTab} bookings found.</div>`;
        return;
    }

    filtered.forEach(booking => {
        // Format Date
        const dateObj = new Date(booking.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
        const chefName = booking.chef ? booking.chef.name : "Unknown Chef";

        const card = document.createElement('div');
        card.className = 'booking-card';
        card.innerHTML = `
            <div class="booking-info">
                <div class="booking-date">
                    <span class="b-day">${day}</span>
                    <span class="b-month">${month}</span>
                </div>
                <div class="booking-details">
                    <h3>${chefName}</h3>
                    <div class="meta-row">
                        <span><i class="far fa-clock"></i> ${booking.hours} hrs</span>
                        <span><i class="fas fa-user-friends"></i> ${booking.guests} Guests</span>
                        <span style="color:var(--brand-gold); margin-left:10px;">₹${booking.totalPrice}</span>
                    </div>
                </div>
            </div>
            <div class="booking-status">
                <span class="status-badge ${booking.status}">${booking.status}</span>
                <button class="btn-chat" onclick="openChat('${chefName}')"><i class="far fa-comments"></i> Chat</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- CHAT LOGIC (UI Only) ---
window.openChat = function(chefName) {
    document.getElementById('chatChefName').innerText = chefName;
    document.getElementById('chatAvatar').innerText = chefName.charAt(0);
    chatDrawer.classList.add('open');
    chatOverlay.classList.remove('hidden');
}

window.closeChat = function() {
    chatDrawer.classList.remove('open');
    chatOverlay.classList.add('hidden');
}

window.sendMessage = function(e) {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    if (input.value.trim()) {
        const div = document.createElement('div');
        div.className = 'message sent';
        div.innerText = input.value;
        chatMessages.appendChild(div);
        input.value = '';
    }
}
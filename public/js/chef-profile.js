// --- STATE ---
let HOURLY_RATE = 500; 
const INGREDIENT_RATE = 300; 
let grandTotal = 0;
let targetChefUserId = null; 

// --- DOM ELEMENTS ---
const chefNameEl = document.querySelector('.name-row h1');
const bioEl = document.querySelector('.bio');
const hoursInput = document.getElementById('hoursInput');
const hoursCount = document.getElementById('hoursCount');
const hourLabel = document.getElementById('hourLabel');
const guestInput = document.getElementById('guestInput');
const guestCount = document.getElementById('guestCount');
const ingredientCheck = document.getElementById('ingredientCheck');
const ingRow = document.getElementById('ingRow');
const ingCostDisplay = document.getElementById('ingCost');
const feeDisplay = document.getElementById('feeDisplay');
const totalCostDisplay = document.getElementById('totalCost');
const bookingForm = document.getElementById('bookingForm');
// NEW: Select the container for checkboxes
const dishSelector = document.querySelector('.dish-selector');

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', async () => {
    const chefProfileId = localStorage.getItem('selectedChefId');
    if (!chefProfileId) {
        alert("No chef selected");
        window.location.href = 'dashboard.html';
        return;
    }
    
    await loadChefData(chefProfileId);
    updateCost();
});

async function loadChefData(id) {
    try {
        const res = await fetch(`/api/chefs/${id}`);
        if (!res.ok) throw new Error("Chef not found");
        
        const chef = await res.json();
        
        // 1. Text & Rates
        if (chef.user) {
            chefNameEl.innerText = chef.user.name;
            targetChefUserId = chef.user._id; 
        }
        if (chef.bio) bioEl.innerText = chef.bio;
        HOURLY_RATE = chef.hourlyRate;
        document.querySelector('.price-lg').innerHTML = `₹${HOURLY_RATE}<small>/hr</small>`;
        
        // 2. Render Menu Display (Main Content)
        renderMenuDisplay(chef.menu);

        // 3. Render Booking Checkboxes (Sidebar)
        renderBookingCheckboxes(chef.menu);

    } catch (error) {
        console.error(error);
    }
}

function renderMenuDisplay(menuItems) {
    if (!menuItems || menuItems.length === 0) return;
    const menuSection = document.querySelector('.menu-list-section');
    menuSection.innerHTML = `<h2><i class="fas fa-utensils"></i> Chef's Specialties</h2><div class="menu-category"></div>`;
    const container = menuSection.querySelector('.menu-category');

    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <div class="dish-info">
                <h4>${item.name}</h4>
                <p>₹${item.price}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderBookingCheckboxes(menuItems) {
    // Clear existing hardcoded items
    dishSelector.innerHTML = '';

    if (!menuItems || menuItems.length === 0) {
        dishSelector.innerHTML = '<p style="color:#aaa; font-size:0.8rem;">No specific dishes listed.</p>';
        return;
    }

    menuItems.forEach(item => {
        const label = document.createElement('label');
        label.className = 'dish-checkbox';
        // We put the name in the value so we can send it to the backend
        label.innerHTML = `<input type="checkbox" value="${item.name}"> ${item.name}`;
        dishSelector.appendChild(label);
    });
}

// --- CALCULATION & SUBMIT LOGIC ---
function updateCost() {
    const hours = parseInt(hoursInput.value);
    const guests = parseInt(guestInput.value);
    const includeIngredients = ingredientCheck.checked;
    
    hoursCount.innerText = hours;
    hourLabel.innerText = hours;
    guestCount.innerText = guests;
    
    const chefFee = HOURLY_RATE * hours;
    feeDisplay.innerText = `₹${chefFee}`;

    let ingredientTotal = 0;
    if (includeIngredients) {
        ingredientTotal = guests * INGREDIENT_RATE;
        ingRow.style.display = 'flex';
        ingCostDisplay.innerText = `+ ₹${ingredientTotal}`;
    } else {
        ingRow.style.display = 'none';
    }
    
    grandTotal = chefFee + ingredientTotal;
    totalCostDisplay.innerText = `₹${grandTotal}`;
}

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert("Please log in.");
        window.location.href = 'login.html';
        return;
    }

    // Collect selected dishes names
    const selectedDishes = [];
    document.querySelectorAll('.dish-checkbox input:checked').forEach(checkbox => {
        selectedDishes.push(checkbox.value);
    });

    const btn = bookingForm.querySelector('button');
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user._id, 
                chefId: targetChefUserId,
                date: bookingForm.querySelector('input[type="date"]').value,
                hours: parseInt(hoursInput.value),
                guests: parseInt(guestInput.value),
                totalPrice: grandTotal,
                includeIngredients: ingredientCheck.checked,
                dishes: selectedDishes
            })
        });

        if (res.ok) {
            alert("Booking Request Sent!");
            window.location.href = 'bookings.html';
        } else {
            alert("Booking failed.");
        }
    } catch (error) {
        console.error(error);
        alert("Server error.");
    } finally {
        btn.innerText = "Request Booking";
        btn.disabled = false;
    }
});
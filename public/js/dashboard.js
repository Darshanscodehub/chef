const chefsGrid = document.getElementById('chefsGrid');
const chefCount = document.getElementById('chef-count');
const searchInput = document.getElementById('searchInput');
let allChefs = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Loaded. Fetching chefs...");
    fetchChefs();
});

async function fetchChefs() {
    try {
        const res = await fetch('/api/chefs/public');
        console.log("API Response Status:", res.status);
        
        const data = await res.json();
        console.log("Chefs Data:", data);

        allChefs = data;
        renderChefs(allChefs);
    } catch (error) {
        console.error("Fetch Error:", error);
        chefsGrid.innerHTML = '<p style="color:red">Error loading chefs. Check console.</p>';
    }
}

function renderChefs(data) {
    chefsGrid.innerHTML = '';
    chefCount.innerText = data.length;

    if (data.length === 0) {
        chefsGrid.innerHTML = '<p style="color:#aaa; font-size:1.2rem;">No verified chefs found. <br><small>Ask admin to approve pending chefs.</small></p>';
        return;
    }

    data.forEach(chef => {
        // Fallback for missing user data
        const name = chef.user ? chef.user.name : "Unknown Chef"; 
        const image = "https://ui-avatars.com/api/?name=" + name.replace(" ", "+");
        const cuisine = (chef.specialties && chef.specialties.length > 0) ? chef.specialties[0] : "Multi-Cuisine";
        const price = chef.hourlyRate || 500;

        const card = document.createElement('div');
        card.className = 'chef-card';
        card.innerHTML = `
            <img src="${image}" alt="${name}" class="card-image">
            <div class="card-content">
                <div class="card-header">
                    <h3>${name}</h3>
                    <span class="rating"><i class="fas fa-star"></i> 4.8</span>
                </div>
                <span class="cuisine-tag">${cuisine}</span>
                <div class="card-footer">
                    <span class="price">₹${price}<span style="font-size:0.8rem; font-weight:400; color:#aaa;">/hr</span></span>
                    <!-- Note: We use chef._id (ChefProfile ID) here -->
                    <button class="btn-sm" onclick="goToProfile('${chef._id}')">View Profile</button>
                </div>
            </div>
        `;
        chefsGrid.appendChild(card);
    });
}

window.goToProfile = function(id) {
    localStorage.setItem('selectedChefId', id);
    window.location.href = 'chef-profile.html';
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allChefs.filter(chef => {
        const name = chef.user ? chef.user.name.toLowerCase() : "";
        return name.includes(term);
    });
    renderChefs(filtered);
});
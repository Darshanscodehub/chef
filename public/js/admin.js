// --- STATE ---
let pendingChefs = [];
let currentReviewId = null;

// --- DOM ELEMENTS ---
const verificationList = document.getElementById('verificationList');
const modal = document.getElementById('docModal');
const badgeCount = document.querySelector('.badge-count');

// --- INITIAL RENDER ---
document.addEventListener('DOMContentLoaded', () => {
    // Set Date
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateEl = document.getElementById('currentDate');
    if(dateEl) dateEl.innerText = new Date().toLocaleDateString('en-US', options);
    
    // FETCH REAL DATA
    console.log("Fetching pending chefs...");
    fetchPendingChefs();
});

// --- API CALLS ---
async function fetchPendingChefs() {
    try {
        const res = await fetch('/api/admin/pending');
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        console.log("Chefs Data Received:", data);
        pendingChefs = data;
        renderTable();
        updateStats();
    } catch (error) {
        console.error("Error fetching chefs:", error);
        verificationList.innerHTML = '<div style="padding:20px; color:red; text-align:center;">Error loading data. Is server running?</div>';
    }
}

function renderTable() {
    if(!pendingChefs || pendingChefs.length === 0) {
        verificationList.innerHTML = '<div style="padding:20px; text-align:center; color:#777;">No pending verifications.</div>';
        return;
    }

    verificationList.innerHTML = pendingChefs.map(chef => {
        const name = chef.user ? chef.user.name : "Unknown User";
        const avatar = "https://ui-avatars.com/api/?name=" + name.replace(" ", "+");
        const date = new Date().toLocaleDateString();

        // Note: We use chef._id (MongoDB ID) for the click handler
        return `
        <div class="table-row" id="row-${chef._id}">
            <div class="chef-cell">
                <img src="${avatar}" class="mini-avatar">
                <span>${name}</span>
            </div>
            <div>${date}</div> 
            <div><span class="doc-link" onclick="openVerifyModal('${chef._id}')" style="cursor:pointer; color:#e67e22; text-decoration:underline;">View ID Proof</span></div>
            <div><span class="status-pill pending">Pending</span></div>
            <div><button class="btn-action" onclick="openVerifyModal('${chef._id}')">Review</button></div>
        </div>
        `;
    }).join('');
}

function updateStats() {
    if(badgeCount) badgeCount.innerText = pendingChefs.length;
}

// --- MODAL LOGIC ---
window.openVerifyModal = function(id) {
    console.log("Opening modal for ID:", id);
    currentReviewId = id;
    const chef = pendingChefs.find(c => c._id === id);
    
    if (!chef) {
        console.error("Chef not found in local state");
        return;
    }
    
    // 1. Populate Name & Avatar
    const name = chef.user ? chef.user.name : "Unknown";
    document.getElementById('modalName').innerText = name;
    document.getElementById('modalAvatar').src = "https://ui-avatars.com/api/?name=" + name.replace(" ", "+");
    
    // 2. Handle Document Image
    const docImgBox = document.querySelector('.doc-img-box img');
    
    if (chef.documents && chef.documents.length > 0 && chef.documents[0].filePath) {
        // Fix Windows path (replace backslash with forward slash)
        let rawPath = chef.documents[0].filePath.replace(/\\/g, "/");
        
        // Ensure it doesn't start with 'public/' if saved that way, though usually it's just 'uploads/'
        // We prepend '/' to make it absolute relative to the domain root
        // Example: 'uploads/image.jpg' -> '/uploads/image.jpg'
        const cleanPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
        
        console.log("Loading Image Path:", cleanPath);
        docImgBox.src = cleanPath; 
    } else {
        console.warn("No document path found for chef");
        docImgBox.src = "https://placehold.co/600x400/000000/FFF?text=No+Document+Found";
    }
    
    // 3. Show Modal
    if(modal) {
        modal.classList.remove('hidden');
        // Force display in case CSS class is missing
        modal.style.display = 'flex';
    } else {
        console.error("Modal element not found in DOM");
    }
}

window.closeModal = function() {
    if(modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Force hide
    }
    currentReviewId = null;
}

// --- ACTIONS ---
window.approveChef = async function() {
    if (!currentReviewId) return;
    
    const btn = document.querySelector('.btn-approve');
    const originalText = btn.innerText;
    btn.innerText = "Approving...";
    
    try {
        const res = await fetch(`/api/admin/approve/${currentReviewId}`, { method: 'PUT' });
        
        if (res.ok) {
            pendingChefs = pendingChefs.filter(c => c._id !== currentReviewId);
            renderTable();
            updateStats();
            closeModal();
            alert("Chef Approved Successfully!");
        } else {
            alert("Failed to approve chef.");
        }
    } catch (error) {
        console.error(error);
        alert("Server Error");
    } finally {
        btn.innerText = originalText;
    }
}

window.rejectChef = async function() {
    if (!currentReviewId) return;
    
    if(confirm("Are you sure you want to reject this application?")) {
        try {
            const res = await fetch(`/api/admin/reject/${currentReviewId}`, { method: 'DELETE' });
            if (res.ok) {
                pendingChefs = pendingChefs.filter(c => c._id !== currentReviewId);
                renderTable();
                updateStats();
                closeModal();
            }
        } catch (error) {
            console.error(error);
        }
    }
}
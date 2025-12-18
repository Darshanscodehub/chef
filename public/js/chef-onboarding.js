// --- STATE MANAGEMENT ---
let selectedFile = null;
let menuItems = [];
const user = JSON.parse(localStorage.getItem('user'));

// --- DOM ELEMENTS ---
const stepCount = document.getElementById('stepCount');
const progressBar = document.getElementById('progressBar');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');

// --- NAVIGATION LOGIC ---
window.nextStep = function(step) {
    // Validation for Step 1
    if (step === 2 && !selectedFile) {
        alert("Please upload your ID proof first.");
        return;
    }

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => el.classList.add('hidden'));
    
    // Show target step
    document.getElementById(`step${step}`).classList.remove('hidden');
    
    // Update Progress
    const progress = step === 1 ? '33%' : step === 2 ? '66%' : '100%';
    progressBar.style.width = progress;
    stepCount.innerText = step;
}

// --- FILE UPLOAD LOGIC ---
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#FF512F';
    dropZone.style.background = 'rgba(255, 81, 47, 0.1)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'rgba(255,255,255,0.2)';
    dropZone.style.background = 'transparent';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255,255,255,0.2)';
    dropZone.style.background = 'transparent';
    
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFiles(fileInput.files[0]);
    }
});

function handleFiles(file) {
    selectedFile = file; // Store file for submission
    
    dropZone.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><p>Processing...</p>';
    
    setTimeout(() => {
        dropZone.classList.add('hidden');
        filePreview.classList.remove('hidden');
        fileName.innerText = file.name;
    }, 1000);
}

// --- MENU LOGIC (STEP 3) ---
const addDishBtn = document.querySelector('.btn-icon-add');
const dishContainer = document.querySelector('.added-dishes');

// Input Selectors (Using placeholders to identify them)
const dishNameInput = document.querySelector('input[placeholder*="Dish Name"]');
const dishPriceInput = document.querySelector('input[placeholder*="Price"]');

addDishBtn.addEventListener('click', () => {
    const name = dishNameInput.value;
    const price = dishPriceInput.value;

    if (name && price) {
        // Add to State
        menuItems.push({ name, price });

        // Update UI
        const tag = document.createElement('div');
        tag.className = 'dish-tag';
        tag.innerHTML = `${name} (₹${price}) <i class="fas fa-times" onclick="removeDish('${name}', this)"></i>`;
        dishContainer.appendChild(tag);

        // Clear Inputs
        dishNameInput.value = '';
        dishPriceInput.value = '';
    }
});

window.removeDish = function(name, el) {
    menuItems = menuItems.filter(item => item.name !== name);
    el.parentElement.remove();
}

// --- SUBMIT APPLICATION (API CALL) ---
window.finishOnboarding = async function() {
    // 1. Collect Data from Step 2 Inputs
    const hourlyRate = document.querySelector('input[placeholder*="500"]').value;
    const experienceYears = document.querySelector('input[placeholder*="5"]').value;
    const bio = document.querySelector('textarea').value;

    // Validation
    if(!hourlyRate || !experienceYears || menuItems.length === 0) {
        alert("Please fill all details and add at least one dish.");
        return;
    }

    const btn = document.querySelector('#step3 .btn-glow');
    const originalText = btn.innerText;
    btn.innerText = "Submitting...";
    btn.disabled = true;

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('userId', user._id); // Assuming user object has _id
    formData.append('bio', bio);
    formData.append('experienceYears', experienceYears);
    formData.append('hourlyRate', hourlyRate);
    formData.append('menu', JSON.stringify(menuItems)); // Send array as string
    formData.append('idProof', selectedFile); // The actual file

    try {
        const res = await fetch('/api/chefs/onboarding', {
            method: 'PUT',
            body: formData // No Content-Type header needed (browser sets it for FormData)
        });

        if (res.ok) {
            // 3. Show Success Screen
            document.querySelectorAll('.form-step').forEach(el => el.classList.add('hidden'));
            document.getElementById('successStep').classList.remove('hidden');
            progressBar.style.width = '100%';
            progressBar.style.background = '#2ecc71';
            stepCount.innerText = "Done";
        } else {
            const data = await res.json();
            alert(data.message || "Submission failed");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert("Server Error");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}
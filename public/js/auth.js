const API_URL = '/api/auth';

// --- DOM ELEMENTS ---
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// --- LOGIN LOGIC ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Get Values (Using querySelector since inputs might not have IDs)
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;
        const btn = loginForm.querySelector('button');

        // 2. UI Feedback
        const originalText = btn.innerText;
        btn.innerText = 'Logging in...';
        btn.disabled = true;

        try {
            // 3. Call Backend
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // 4. Success: Save User & Token
                localStorage.setItem('user', JSON.stringify(data));
                
                // 5. Redirect based on Role
                if (data.role === 'chef') {
                    window.location.href = 'chef-dashboard.html';
                } else if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Error from server (e.g., Wrong password)
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error(error);
            alert('Server error. Please try again later.');
        } finally {
            // Reset Button
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

// --- SIGNUP LOGIC ---
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Get Values
        const name = signupForm.querySelector('input[type="text"]').value;
        const email = signupForm.querySelector('input[type="email"]').value;
        const password = signupForm.querySelector('input[type="password"]').value;
        const role = document.getElementById('roleInput').value; // Hidden input
        const btn = signupForm.querySelector('button');

        // 2. UI Feedback
        const originalText = btn.innerText;
        btn.innerText = 'Creating Account...';
        btn.disabled = true;

        try {
            // 3. Call Backend
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                // 4. Success: Save User & Token
                localStorage.setItem('user', JSON.stringify(data));

                // 5. Redirect
                if (role === 'chef') {
                    // New Chefs go to Onboarding first
                    window.location.href = 'chef-onboarding.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                alert(data.message || 'Signup failed');
            }
        } catch (error) {
            console.error(error);
            alert('Server error. Please try again later.');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

// --- LOGOUT LOGIC (Helper) ---
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// --- CHECK AUTH (Protect Dashboard Pages) ---
// If we are on a dashboard page, check if user is logged in
if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('bookings')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
    } else {
        // Update Navbar Name if element exists
        const nameDisplay = document.querySelector('.user-name strong');
        if (nameDisplay) nameDisplay.innerText = user.name;
        
        const avatarDisplay = document.querySelector('.avatar');
        if (avatarDisplay) avatarDisplay.innerText = user.name.charAt(0).toUpperCase();
    }
}
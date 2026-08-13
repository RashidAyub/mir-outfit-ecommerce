// Authentication Controller Module
// Handles login, signup, logout, role-based routing, and session state
import { getActiveUser, setActiveUser } from './firebase.js';
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    // Detect which page we are on
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) initLoginForm();
    if (signupForm) initSignupForm();

    // Update profile icon across all pages
    updateProfileIcon();
});

// Login Form Handler
function initLoginForm() {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error-msg');

    // Redirect if already logged in
    const activeUser = getActiveUser();
    if (activeUser) {
        redirectByRole(activeUser.role);
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMsg);

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showError(errorMsg, 'Please fill in all fields.');
            return;
        }

        try {
            // Look up user in local database
            const users = JSON.parse(localStorage.getItem('mir_users')) || [];
            const user = users.find(u => u.email.toLowerCase() === email);

            if (!user) {
                showError(errorMsg, 'No account found with this email. Please sign up first.');
                return;
            }

            // Check password (stored in localStorage for mock; in production Firebase handles this)
            if (user.password && user.password !== password) {
                showError(errorMsg, 'Incorrect password. Please try again.');
                return;
            }

            // Admin demo shortcut: admin@miroutfit.com / admin123
            if (email === 'admin@miroutfit.com' && password === 'admin123') {
                // Ensure admin record exists
                const adminUser = users.find(u => u.email === 'admin@miroutfit.com');
                if (adminUser) {
                    setActiveUser(adminUser);
                    showToast(`Welcome back, ${adminUser.name}!`, 'success');
                    redirectByRole(adminUser.role);
                    return;
                }
            }

            // Set session
            setActiveUser(user);
            showToast(`Welcome back, ${user.name}!`, 'success');
            redirectByRole(user.role);

        } catch (err) {
            console.error('Login error:', err);
            showError(errorMsg, 'An error occurred during login. Please try again.');
        }
    });
}

// Signup Form Handler
function initSignupForm() {
    const form = document.getElementById('signup-form');
    const errorMsg = document.getElementById('signup-error-msg');

    // Redirect if already logged in
    const activeUser = getActiveUser();
    if (activeUser) {
        redirectByRole(activeUser.role);
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMsg);

        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Validations
        if (!name || !email || !password || !confirmPassword) {
            showError(errorMsg, 'Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            showError(errorMsg, 'Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            showError(errorMsg, 'Passwords do not match. Please re-enter.');
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem('mir_users')) || [];

            // Check for duplicate email
            const exists = users.find(u => u.email.toLowerCase() === email);
            if (exists) {
                showError(errorMsg, 'An account with this email already exists. Please log in instead.');
                return;
            }

            // Create new user document
            const newUser = {
                id: 'user-' + Date.now(),
                name,
                email,
                password, // In production, Firebase Auth handles password hashing
                role: 'customer',
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('mir_users', JSON.stringify(users));

            // Auto-login after signup
            setActiveUser(newUser);
            showToast(`Welcome to MIR OUTFIT, ${name}!`, 'success');

            // Redirect to homepage
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);

        } catch (err) {
            console.error('Signup error:', err);
            showError(errorMsg, 'An error occurred during registration. Please try again.');
        }
    });
}

// Role-based redirect
function redirectByRole(role) {
    setTimeout(() => {
        if (role === 'admin') {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'index.html';
        }
    }, 500);
}

// Update profile icon in navbar to show user initial or logout option
function updateProfileIcon() {
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) return;

    const user = getActiveUser();
    if (user) {
        // Replace the profile link with a dropdown-style element
        const initial = user.name.charAt(0).toUpperCase();
        profileBtn.innerHTML = `
            <span style="width:28px; height:28px; border-radius:50%; background-color:var(--primary); color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;">${initial}</span>
        `;
        profileBtn.href = '#';
        profileBtn.title = `${user.name} (${user.role})`;

        // Toggle simple dropdown on click
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Check if dropdown exists
            let dropdown = document.getElementById('user-dropdown');
            if (dropdown) {
                dropdown.remove();
                return;
            }

            dropdown = document.createElement('div');
            dropdown.id = 'user-dropdown';
            dropdown.style.cssText = `
                position: absolute; top: 100%; right: 0; min-width: 200px;
                background: #ffffff; border: 1px solid var(--border-color);
                border-radius: var(--radius-sm); box-shadow: var(--shadow-md);
                padding: 16px; z-index: 1100; text-align: left;
            `;
            dropdown.innerHTML = `
                <p style="font-weight:600; font-size:0.95rem; margin-bottom:4px;">${user.name}</p>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;">${user.email}</p>
                ${user.role === 'admin' ? '<a href="admin/index.html" style="display:block; padding:8px 0; font-size:0.9rem; font-weight:500; color:var(--text-primary); border-top:1px solid var(--border-color);">Admin Dashboard</a>' : ''}
                <button id="logout-btn" style="display:block; width:100%; padding:10px; margin-top:8px; background:var(--primary); color:#fff; border:none; border-radius:var(--radius-sm); font-family:inherit; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; cursor:pointer;">Logout</button>
            `;

            profileBtn.style.position = 'relative';
            profileBtn.appendChild(dropdown);

            // Logout handler
            dropdown.querySelector('#logout-btn').addEventListener('click', () => {
                setActiveUser(null);
                showToast('You have been logged out.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 500);
            });

            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', function handler(ev) {
                    if (!profileBtn.contains(ev.target)) {
                        const dd = document.getElementById('user-dropdown');
                        if (dd) dd.remove();
                        document.removeEventListener('click', handler);
                    }
                });
            }, 10);
        });
    }
}

// Helper: Show error
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// Helper: Hide error
function hideError(element) {
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

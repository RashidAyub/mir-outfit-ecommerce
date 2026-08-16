// Authentication Controller Module
// Handles login, signup, logout, role-based routing, and session state
import { waitForAuth, setActiveUser, isFirebaseAvailable, auth, db } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Detect which page we are on
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) await initLoginForm();
    if (signupForm) await initSignupForm();

    // Update profile icon across all pages
    updateProfileIcon();
});

// Login Form Handler
async function initLoginForm() {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error-msg');

    // Wait for Firebase auth to be fully ready before checking session
    const activeUser = await waitForAuth();
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

        // Disable submit button to prevent double-submit
        const submitBtn = document.getElementById('login-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }

        try {
            if (isFirebaseAvailable) {
                // Firebase Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
                
                let sessionUser = {
                    id: userCredential.user.uid,
                    email: userCredential.user.email,
                    name: userCredential.user.email.split('@')[0],
                    role: "customer"
                };

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    sessionUser.name = data.name || sessionUser.name;
                    sessionUser.role = data.role || "customer";
                }

                setActiveUser(sessionUser);
                showToast(`Welcome back, ${sessionUser.name}!`, 'success');
                redirectByRole(sessionUser.role);
                return;
            }

            // Local Storage Fallback
            const users = JSON.parse(localStorage.getItem('mir_users')) || [];
            const user = users.find(u => u.email.toLowerCase() === email);

            if (!user) {
                showError(errorMsg, 'No account found with this email. Please sign up first.');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
                return;
            }

            if (user.password && user.password !== password) {
                showError(errorMsg, 'Incorrect password. Please try again.');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
                return;
            }

            setActiveUser(user);
            showToast(`Welcome back, ${user.name}!`, 'success');
            redirectByRole(user.role);

        } catch (err) {
            console.error('Login error:', err);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
            // Translate common Firebase errors
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                showError(errorMsg, 'Invalid email or password.');
            } else if (err.code === 'auth/too-many-requests') {
                showError(errorMsg, 'Too many failed attempts. Try again later.');
            } else if (err.code === 'auth/invalid-email') {
                showError(errorMsg, 'Please enter a valid email address.');
            } else {
                showError(errorMsg, 'An error occurred during login. Please try again.');
            }
        }
    });
}

// Signup Form Handler
async function initSignupForm() {
    const form = document.getElementById('signup-form');
    const errorMsg = document.getElementById('signup-error-msg');

    // Wait for Firebase auth to be fully ready before checking session
    const activeUser = await waitForAuth();
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

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
        }

        try {
            if (isFirebaseAvailable) {
                // Firebase Signup
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const uid = userCredential.user.uid;
                
                const newUserInfo = {
                    name,
                    email,
                    role: 'customer',
                    createdAt: new Date().toISOString()
                };

                // Create user document in Firestore
                await setDoc(doc(db, "users", uid), newUserInfo);

                const sessionUser = {
                    id: uid,
                    ...newUserInfo
                };

                setActiveUser(sessionUser);
                showToast(`Welcome to MIR OUTFIT, ${name}!`, 'success');

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
                return;
            }

            // Local Storage Fallback
            const users = JSON.parse(localStorage.getItem('mir_users')) || [];
            const exists = users.find(u => u.email.toLowerCase() === email);
            
            if (exists) {
                showError(errorMsg, 'An account with this email already exists. Please log in instead.');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; }
                return;
            }

            const newUser = {
                id: 'user-' + Date.now(),
                name,
                email,
                password, 
                role: 'customer',
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('mir_users', JSON.stringify(users));

            setActiveUser(newUser);
            showToast(`Welcome to MIR OUTFIT, ${name}!`, 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);

        } catch (err) {
            console.error('Signup error:', err);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; }
            if (err.code === 'auth/email-already-in-use') {
                showError(errorMsg, 'An account with this email already exists.');
            } else if (err.code === 'auth/weak-password') {
                showError(errorMsg, 'Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-email') {
                showError(errorMsg, 'Please enter a valid email address.');
            } else {
                showError(errorMsg, 'An error occurred during registration. Please try again.');
            }
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
export async function updateProfileIcon() {
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) return;

    // Use sessionStorage directly (don't re-wait) so this is fast on all pages
    const user = JSON.parse(sessionStorage.getItem('mir_logged_user')) || null;
    
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
            dropdown.querySelector('#logout-btn').addEventListener('click', async () => {
                if (isFirebaseAvailable) {
                    try {
                        await signOut(auth);
                    } catch (err) {
                        console.error('Firebase signout error:', err);
                    }
                }
                
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

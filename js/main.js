// Main UI Controller for MIR OUTFIT

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initMobileNav();
    initStickyHeader();
    initSearchOverlay();
});

// Unique Loader Fade Out
function initLoader() {
    const loader = document.getElementById('mir-loader');
    if (loader) {
        // Guarantee the loading screen shows for at least 800ms to allow animations to run smoothly
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.remove();
            }, 500); // Match CSS transition duration
        }, 850);
    }
}

// Mobile Hamburger Navigation Menu Drawer
function initMobileNav() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle hamburger icon between menu and close
            if (navLinks.classList.contains('active')) {
                toggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            } else {
                toggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            }
        });
    }
}

// Header scroll threshold effects
function initStickyHeader() {
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Overlay Search Dialog Toggler
function initSearchOverlay() {
    const searchBtn = document.getElementById('search-btn');
    const closeBtn = document.getElementById('search-close');
    const overlay = document.getElementById('search-overlay');
    const input = overlay ? overlay.querySelector('input') : null;

    if (searchBtn && overlay && closeBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            overlay.classList.add('active');
            if (input) {
                setTimeout(() => input.focus(), 300);
            }
        });

        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });

        // Trigger search on Enter key
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim() !== '') {
                    window.location.href = `shop.html?search=${encodeURIComponent(input.value.trim())}`;
                }
            });
        }
    }
}

// Elegant Toast Alert Notification System
export function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon definition based on alert type
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
        icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto delete toast alert
    setTimeout(() => {
        toast.classList.add('toast-closing');
        toast.addEventListener('animationend', () => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }, 3000);
}

// Admin Dashboard Controller
import { waitForAuth, setActiveUser, getDbOrders, getDbProducts, addDbProduct, updateDbProduct, deleteDbProduct, updateDbOrderStatus, getDbCustomers, seedFirestoreProducts, isFirebaseAvailable, auth } from '../js/firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check - Wait for Firebase auth to be fully ready, then verify admin role
    const user = await waitForAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = '../login.html';
        return;
    }

    // Initialize Topbar User Info
    initTopbar(user);

    // Sidebar Mobile Toggle
    initSidebar();

    // Initialize Seed Button independently
    initSeedProductsButton();

    // Load Dashboard Data (if on index.html)
    if (document.getElementById('stat-revenue')) {
        await loadDashboardMetrics();
    }

    // Load Products Data (if on products.html)
    if (document.body.dataset.page === 'products') {
        await initProductsPage();
    }

    // Load Orders Data (if on orders.html)
    if (document.body.dataset.page === 'orders') {
        await initOrdersPage();
    }
});

function initSeedProductsButton() {
    const seedBtn = document.getElementById('btn-seed-products');

    if (!seedBtn) {
        console.warn('Seed products button not found');
        return;
    }

    seedBtn.addEventListener('click', async () => {
        try {
            seedBtn.disabled = true;
            seedBtn.textContent = 'Seeding...';

            const result = await seedFirestoreProducts();

            alert(result.message);

            if (result.success) {
                await loadDashboardMetrics();
            }
        } catch (error) {
            console.error('Seed products error:', error);
            alert('Failed to seed products: ' + error.message);
        } finally {
            seedBtn.disabled = false;
            seedBtn.textContent = 'Seed Default Products to Firestore';
        }
    });
}

function initTopbar(user) {
    // Set date
    const dateElement = document.getElementById('admin-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Set Avatar initial
    const avatarElement = document.getElementById('admin-initial');
    if (avatarElement && user.name) {
        avatarElement.textContent = user.name.charAt(0).toUpperCase();
        avatarElement.title = user.name;
    }

    // Logout handler — properly signs out from Firebase Auth AND clears session
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (isFirebaseAvailable) {
                try {
                    await signOut(auth);
                } catch (err) {
                    console.error('Firebase admin signout error:', err);
                }
            }
            setActiveUser(null);
            window.location.href = '../login.html';
        });
    }
}

function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

async function loadDashboardMetrics() {
    try {
        const orders = await getDbOrders() || [];
        const products = await getDbProducts() || [];
        // Get customer count from Firestore (not localStorage)
        const customerCount = await getDbCustomers();

        // 1. Calculate Metrics
        const totalRevenue = orders.reduce((sum, order) => {
            return order.status !== 'Cancelled' ? sum + (order.total || 0) : sum;
        }, 0);
        
        const activeProducts = products.length;
        const totalOrders = orders.length;

        // Update DOM
        document.getElementById('stat-revenue').textContent = `₨ ${totalRevenue.toLocaleString()}`;
        document.getElementById('stat-orders').textContent = totalOrders;
        document.getElementById('stat-products').textContent = activeProducts;
        document.getElementById('stat-customers').textContent = customerCount;

        // 2. Render Charts
        renderRevenueChart(orders);
        renderOrderChart(orders);

        // 3. Render Recent Orders Table
        renderRecentOrders(orders);

    } catch (err) {
        console.error("Error loading dashboard metrics:", err);
    }
}

function renderRevenueChart(orders) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const baseRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0) / 7 || 15000;
    const data = labels.map(() => baseRevenue * (0.5 + Math.random()));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (₨)',
                data: data,
                borderColor: '#111111',
                backgroundColor: 'rgba(17, 17, 17, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#b89f74',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0efec', drawBorder: false },
                    ticks: { callback: value => '₨ ' + value }
                },
                x: {
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });
}

function renderOrderChart(orders) {
    const ctx = document.getElementById('orderChart');
    if (!ctx) return;

    const counts = { Pending: 0, Processing: 0, Delivered: 0, Cancelled: 0 };
    orders.forEach(o => {
        if (counts[o.status] !== undefined) counts[o.status]++;
        else counts.Pending++;
    });

    if (orders.length === 0) {
        counts.Pending = 3;
        counts.Processing = 5;
        counts.Delivered = 12;
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Processing', 'Delivered', 'Cancelled'],
            datasets: [{
                data: [counts.Pending, counts.Processing, counts.Delivered, counts.Cancelled],
                backgroundColor: [
                    '#f59e0b',
                    '#3b82f6',
                    '#22c55e',
                    '#ef4444'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
                }
            }
        }
    });
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-body');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="admin-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <p>No recent orders found.</p>
                </td>
            </tr>`;
        return;
    }

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    tbody.innerHTML = recentOrders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        // FIXED: Use order.customer.name instead of order.shippingInfo.firstName/lastName
        const name = (order.customer && order.customer.name) ? order.customer.name : 'Guest';
        const total = order.total ? order.total.toLocaleString() : '0';
        
        let statusBadge = 'badge-pending';
        if (order.status === 'Processing') statusBadge = 'badge-processing';
        else if (order.status === 'Delivered') statusBadge = 'badge-delivered';
        else if (order.status === 'Cancelled') statusBadge = 'badge-cancelled';

        return `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${date}</td>
                <td>${name}</td>
                <td><strong>₨ ${total}</strong></td>
                <td><span class="badge ${statusBadge}">${order.status}</span></td>
            </tr>
        `;
    }).join('');
}

// -----------------------------------------------------------------------------
// Products Page Logic
// -----------------------------------------------------------------------------
async function initProductsPage() {
    await renderAdminProducts();

    const btnAdd = document.getElementById('btn-add-product');
    const modal = document.getElementById('product-modal');
    const btnCancel = document.getElementById('btn-cancel-product');
    const form = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');

    if (!btnAdd || !modal || !btnCancel || !form) return;

    // Open Modal for New Product
    btnAdd.addEventListener('click', () => {
        form.reset();
        document.getElementById('prod-id').value = '';
        modalTitle.textContent = 'Add New Product';
        modal.classList.add('active');
    });

    // Close Modal
    btnCancel.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Form Submit (Create / Update)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Parse sizes and colors from comma-separated input
        const sizesRaw = (document.getElementById('prod-sizes').value || '').trim();
        const colorsRaw = (document.getElementById('prod-colors').value || '').trim();
        const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : ['One Size'];
        const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim()).filter(Boolean) : [];

        // FIXED: Save as 'title' to match data model used everywhere else
        const productData = {
            title: document.getElementById('prod-title').value.trim(),
            price: parseInt(document.getElementById('prod-price').value),
            category: document.getElementById('prod-category').value,
            collection: document.getElementById('prod-collection').value,
            image: document.getElementById('prod-image').value.trim(),
            description: document.getElementById('prod-desc').value.trim(),
            sizes,
            colors
        };

        const existingId = document.getElementById('prod-id').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

        try {
            if (existingId) {
                await updateDbProduct(existingId, productData);
            } else {
                await addDbProduct(productData);
            }
            
            modal.classList.remove('active');
            await renderAdminProducts();
        } catch (err) {
            console.error("Error saving product:", err);
            alert("Failed to save product: " + err.message);
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Product'; }
        }
    });

    // Event Delegation for Edit/Delete buttons
    document.getElementById('admin-product-grid').addEventListener('click', async (e) => {
        const btnEdit = e.target.closest('.btn-edit');
        const btnDelete = e.target.closest('.btn-delete');

        if (btnEdit) {
            const id = btnEdit.dataset.id;
            const products = await getDbProducts();
            const prod = products.find(p => p.id === id);
            if (prod) {
                document.getElementById('prod-id').value = prod.id;
                // FIXED: Use prod.title (not prod.name)
                document.getElementById('prod-title').value = prod.title || '';
                document.getElementById('prod-price').value = prod.price;
                document.getElementById('prod-category').value = prod.category || '';
                document.getElementById('prod-collection').value = prod.collection || 'summer';
                document.getElementById('prod-image').value = prod.image || '';
                document.getElementById('prod-desc').value = prod.description || '';
                document.getElementById('prod-sizes').value = (prod.sizes || []).join(', ');
                document.getElementById('prod-colors').value = (prod.colors || []).join(', ');
                modalTitle.textContent = 'Edit Product';
                modal.classList.add('active');
            }
        }

        if (btnDelete) {
            const id = btnDelete.dataset.id;
            if (confirm("Are you sure you want to delete this product?")) {
                try {
                    await deleteDbProduct(id);
                    await renderAdminProducts();
                } catch (err) {
                    console.error("Error deleting product:", err);
                    alert("Failed to delete product.");
                }
            }
        }
    });
}

async function renderAdminProducts() {
    const grid = document.getElementById('admin-product-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="admin-empty" style="grid-column: 1 / -1;">Loading products...</div>';

    try {
        const products = await getDbProducts() || [];
        
        if (products.length === 0) {
            grid.innerHTML = '<div class="admin-empty" style="grid-column: 1 / -1;">No products found in the catalog. Use the "Add New Product" button or seed defaults from the Dashboard.</div>';
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="admin-product-card">
                <img src="${p.image}" alt="${p.title || p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="card-body">
                    <h4>${p.title || p.name || 'Unnamed Product'}</h4>
                    <div class="price">₨ ${(p.price || 0).toLocaleString()}</div>
                    <div style="font-size:0.8rem; color:#666; margin-top:4px;">Category: ${p.category || '-'} &nbsp;|&nbsp; ${p.collection || '-'}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-admin btn-admin-outline btn-admin-sm btn-edit" data-id="${p.id}" style="flex:1;">Edit</button>
                    <button class="btn-admin btn-admin-danger btn-admin-sm btn-delete" data-id="${p.id}" style="flex:1;">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error rendering products:", err);
        grid.innerHTML = '<div class="admin-empty" style="grid-column: 1 / -1;">Error loading products.</div>';
    }
}

// -----------------------------------------------------------------------------
// Orders Page Logic
// -----------------------------------------------------------------------------
async function initOrdersPage() {
    await renderAllOrders();

    const filterSelect = document.getElementById('order-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            renderAllOrders(e.target.value);
        });
    }

    const modal = document.getElementById('order-modal');
    const form = document.getElementById('order-form');
    const btnCancel = document.getElementById('btn-cancel-order');

    if (!modal || !form || !btnCancel) return;

    // Close Modal
    btnCancel.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Form Submit (Update Status)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('order-id-input').value;
        const status = document.getElementById('order-status-input').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Updating...'; }

        try {
            await updateDbOrderStatus(id, status);
            modal.classList.remove('active');
            
            const filterValue = document.getElementById('order-filter') ? document.getElementById('order-filter').value : 'all';
            await renderAllOrders(filterValue);
        } catch (err) {
            console.error("Error updating order:", err);
            alert("Failed to update order status.");
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Update Status'; }
        }
    });

    // Event Delegation for Update Status buttons
    document.getElementById('all-orders-body').addEventListener('click', async (e) => {
        const btnUpdate = e.target.closest('.btn-update-status');
        if (btnUpdate) {
            const id = btnUpdate.dataset.id;
            const currentStatus = btnUpdate.dataset.status;
            
            document.getElementById('order-id-input').value = id;
            document.getElementById('modal-order-id').textContent = id;
            document.getElementById('order-status-input').value = currentStatus;
            
            modal.classList.add('active');
        }
    });
}

async function renderAllOrders(filterStatus = 'all') {
    const tbody = document.getElementById('all-orders-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">Loading orders...</td></tr>';

    try {
        let orders = await getDbOrders() || [];
        
        if (filterStatus !== 'all') {
            orders = orders.filter(o => o.status === filterStatus);
        }

        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="admin-empty">
                        <p>No orders found matching this filter.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            // FIXED: Use order.customer (not order.shippingInfo)
            let custInfo = '<em>Guest</em>';
            if (order.customer) {
                custInfo = `<strong>${order.customer.name || 'N/A'}</strong><br>
                    <span style="font-size:0.75rem; color:#666;">${order.customer.email || ''}</span><br>
                    <span style="font-size:0.75rem; color:#666;">${order.customer.phone || ''}</span>`;
            }

            // FIXED: Use i.title (not i.name)
            const itemsStr = order.items ? order.items.map(i => `${i.quantity}x ${i.title || i.name || 'Item'}`).join(',<br>') : 'N/A';
            const total = order.total ? order.total.toLocaleString() : '0';
            
            let statusBadge = 'badge-pending';
            if (order.status === 'Processing') statusBadge = 'badge-processing';
            else if (order.status === 'Shipped') statusBadge = 'badge-processing';
            else if (order.status === 'Delivered') statusBadge = 'badge-delivered';
            else if (order.status === 'Cancelled') statusBadge = 'badge-cancelled';

            return `
                <tr>
                    <td><strong>${order.id}</strong></td>
                    <td>${date}</td>
                    <td>${custInfo}</td>
                    <td style="font-size:0.75rem;">${itemsStr}</td>
                    <td><strong>₨ ${total}</strong></td>
                    <td><span class="badge ${statusBadge}">${order.status}</span></td>
                    <td>
                        <button class="btn-admin btn-admin-outline btn-admin-sm btn-update-status" data-id="${order.id}" data-status="${order.status}">
                            Update Status
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Error rendering orders:", err);
        tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">Error loading orders.</td></tr>';
    }
}

// Checkout Page Controller
import { getCartItems, getCartSubtotal, clearCart } from './cart.js';
import { addDbOrder, getActiveUser } from './firebase.js';
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    const items = getCartItems();
    if (items.length === 0) {
        showToast("Your cart is empty. Redirecting to shop...", "error");
        setTimeout(() => {
            window.location.href = 'shop.html';
        }, 1500);
        return;
    }

    renderSummaryList();
    initCheckoutForm();
});

// Render the right-side summary list
function renderSummaryList() {
    const list = document.getElementById('checkout-items-summary-list');
    const items = getCartItems();

    if (list) {
        list.innerHTML = items.map(item => `
            <div class="checkout-item-mini">
                <div class="checkout-item-mini-info">
                    <img class="checkout-item-mini-img" src="${item.image}" alt="${item.title}">
                    <div class="checkout-item-mini-details">
                        <h5>${item.title}</h5>
                        <p>Size: ${item.selectedSize} &nbsp;|&nbsp; Color: ${item.selectedColor} &nbsp;|&nbsp; Qty: ${item.quantity}</p>
                    </div>
                </div>
                <div class="checkout-item-mini-price">
                    ₨ ${(item.price * item.quantity).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    const subtotal = getCartSubtotal();
    const shipping = subtotal >= 5000 ? 0 : 250;
    const total = subtotal + shipping;

    document.getElementById('checkout-subtotal-val').textContent = `₨ ${subtotal.toLocaleString()}`;
    document.getElementById('checkout-shipping-val').textContent = shipping === 0 ? "FREE" : `₨ ${shipping.toLocaleString()}`;
    document.getElementById('checkout-total-val').textContent = `₨ ${total.toLocaleString()}`;
}

// Form submit event binder
function initCheckoutForm() {
    const form = document.getElementById('checkout-shipping-form');
    if (!form) return;

    // Autocomplete values if logged in user exists
    const activeUser = getActiveUser();
    if (activeUser) {
        const nameInput = document.getElementById('checkout-name');
        const emailInput = document.getElementById('checkout-email');
        if (nameInput) nameInput.value = activeUser.name || '';
        if (emailInput) emailInput.value = activeUser.email || '';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather details
        const name = document.getElementById('checkout-name').value.trim();
        const email = document.getElementById('checkout-email').value.trim();
        const phone = document.getElementById('checkout-phone').value.trim();
        const address = document.getElementById('checkout-address').value.trim();
        const city = document.getElementById('checkout-city').value.trim();
        const notes = document.getElementById('checkout-notes').value.trim();

        const cartItems = getCartItems();
        const subtotal = getCartSubtotal();
        const shipping = subtotal >= 5000 ? 0 : 250;
        const total = subtotal + shipping;

        // Build items schema matches requirements
        const orderItems = cartItems.map(item => ({
            productId: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor
        }));

        const orderData = {
            userId: activeUser ? activeUser.id : "guest-anonymous",
            customer: {
                name,
                email,
                phone,
                address,
                city,
                notes
            },
            items: orderItems,
            subtotal,
            shipping,
            total,
            status: "Pending" // Initial state matches orders collection
        };

        try {
            // Save order in Firestore / localStorage fallback
            const savedOrder = await addDbOrder(orderData);
            
            // Clear current cart items
            clearCart();
            
            // Redirect to success page passing the order code ID
            window.location.href = `order-success.html?id=${savedOrder.id}`;
        } catch (err) {
            console.error("Order processing failed: ", err);
            showToast("Failed to place your order. Please try again.", "error");
        }
    });
}

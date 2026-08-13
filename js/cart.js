// Shopping Cart State Manager
import { showToast } from './main.js';

let cart = JSON.parse(localStorage.getItem('mir_cart')) || [];

// Update navbar shopping bag badge numbers
export function updateCartBadge() {
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
        const count = getCartCount();
        badge.textContent = count;
        if (count > 0) {
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Add item to shopping bag
export function addToCart(product, quantity = 1, size = 'M', color = null) {
    // Basic validations
    if (!product) return;
    
    // Check if duplicate line item already in cart (same ID, size, and color)
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.selectedSize === size && 
        (!color || item.selectedColor === color)
    );

    if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            collection: product.collection,
            category: product.category,
            selectedSize: size,
            selectedColor: color || (product.colors ? product.colors[0] : 'Standard'),
            quantity: quantity
        });
    }

    saveCart();
    showToast(`Added ${product.title} (${size}) to your cart!`, 'success');
}

// Save cart to local storage and sync badge UI
export function saveCart() {
    localStorage.setItem('mir_cart', JSON.stringify(cart));
    updateCartBadge();
    
    // Dispatch custom event to let other pages know the cart updated
    window.dispatchEvent(new Event('cartUpdated'));
}

// Get raw cart list
export function getCartItems() {
    return cart;
}

// Get sum of quantities
export function getCartCount() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Calculate subtotal
export function getCartSubtotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Remove item from cart
export function removeFromCart(id, size, color) {
    cart = cart.filter(item => 
        !(item.id === id && item.selectedSize === size && item.selectedColor === color)
    );
    saveCart();
    showToast("Item removed from cart.", "success");
}

// Change quantity
export function updateCartQuantity(id, size, color, quantity) {
    const item = cart.find(item => 
        item.id === id && 
        item.selectedSize === size && 
        item.selectedColor === color
    );
    
    if (item) {
        item.quantity = Math.max(1, parseInt(quantity));
        saveCart();
    }
}

// Empty the shopping bag
export function clearCart() {
    cart = [];
    saveCart();
}

// Automatically sync badges on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});

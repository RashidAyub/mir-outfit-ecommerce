// Product Details Page Controller
import { getDbProducts } from './firebase.js';
import { addToCart } from './cart.js';
import { showToast } from './main.js';

// Selected States
let currentProduct = null;
let selectedSize = '';
let selectedColor = '';
let quantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
    const productId = parseProductId();
    if (!productId) {
        showErrorState();
        return;
    }
    
    await loadProductDetails(productId);
    initQuantityControls();
});

// Extract ID from url search param
function parseProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Fetch and load product info
async function loadProductDetails(id) {
    try {
        const products = await getDbProducts();
        currentProduct = products.find(p => p.id === id);
        
        if (!currentProduct) {
            showErrorState();
            return;
        }

        populateUI();
    } catch (err) {
        console.error("Error loading product: ", err);
        showErrorState();
    }
}

// Render dynamic elements to the product details screen
function populateUI() {
    const skeleton = document.getElementById('product-detail-skeleton');
    const layout = document.getElementById('product-detail-layout');
    
    if (!skeleton || !layout) return;

    // Set text contents
    document.getElementById('breadcrumb-current').textContent = currentProduct.title;
    document.getElementById('detail-title').textContent = currentProduct.title;
    document.getElementById('detail-price').textContent = `₨ ${currentProduct.price.toLocaleString()}`;
    document.getElementById('detail-desc').textContent = currentProduct.description;
    
    // Set breadcrumbs category path
    const breadcrumbBox = document.getElementById('detail-breadcrumbs');
    breadcrumbBox.innerHTML = `
        <a href="index.html">Home</a> &nbsp;/&nbsp; 
        <a href="shop.html">Shop</a> &nbsp;/&nbsp; 
        <a href="shop.html?category=${currentProduct.category}">${currentProduct.category}</a> &nbsp;/&nbsp; 
        <span>${currentProduct.title}</span>
    `;

    // Set image
    const mainImg = document.getElementById('detail-main-img');
    if (mainImg) {
        mainImg.src = currentProduct.image;
        mainImg.alt = currentProduct.title;
    }

    // Set badges
    const tagsBox = document.getElementById('detail-tags-container');
    if (tagsBox) {
        tagsBox.innerHTML = `
            <span class="badge ${currentProduct.collection === 'summer' ? 'badge-summer' : 'badge-winter'}">${currentProduct.collection} Collection</span>
            <span class="badge" style="background-color:#eaeaea; color:#333;">${currentProduct.category}</span>
        `;
    }

    // Populate Size Buttons
    const sizeList = document.getElementById('detail-size-list');
    if (sizeList && currentProduct.sizes) {
        // Set default active size
        selectedSize = currentProduct.sizes[0];
        
        sizeList.innerHTML = currentProduct.sizes.map(size => `
            <button type="button" class="size-option-btn ${size === selectedSize ? 'active' : ''}" data-size="${size}">${size}</button>
        `).join('');

        // Add size switch event listners
        sizeList.querySelectorAll('.size-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sizeList.querySelectorAll('.size-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = btn.getAttribute('data-size');
            });
        });
    }

    // Populate Color Buttons
    const colorGroup = document.getElementById('detail-color-group');
    const colorList = document.getElementById('detail-color-list');
    if (currentProduct.colors && currentProduct.colors.length > 0) {
        selectedColor = currentProduct.colors[0];
        if (colorGroup && colorList) {
            colorGroup.style.display = 'block';
            colorList.innerHTML = currentProduct.colors.map(color => `
                <button type="button" class="color-option-btn ${color === selectedColor ? 'active' : ''}" data-color="${color}">${color}</button>
            `).join('');

            // Add color switch event listeners
            colorList.querySelectorAll('.color-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    colorList.querySelectorAll('.color-option-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedColor = btn.getAttribute('data-color');
                });
            });
        }
    } else {
        // Hide color swatches panel if empty
        if (colorGroup) colorGroup.style.display = 'none';
        selectedColor = 'Standard';
    }

    // Star reviews rendering
    const ratingBox = document.getElementById('detail-rating');
    if (ratingBox) {
        const ratingVal = currentProduct.rating || 4.5;
        const reviewsCount = currentProduct.reviews || 18;
        ratingBox.innerHTML = `
            ${'★'.repeat(Math.round(ratingVal))}${'☆'.repeat(5 - Math.round(ratingVal))}
            <span>(${reviewsCount} Reviews)</span>
        `;
    }

    // Bind Button actions
    const addCartBtn = document.getElementById('detail-add-cart-btn');
    if (addCartBtn) {
        addCartBtn.addEventListener('click', () => {
            addToCart(currentProduct, quantity, selectedSize, selectedColor);
        });
    }

    const buyNowBtn = document.getElementById('detail-buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            addToCart(currentProduct, quantity, selectedSize, selectedColor);
            // Redirect immediately to checkout page
            window.location.href = 'checkout.html';
        });
    }

    // Switch panels visibility
    skeleton.style.display = 'none';
    layout.style.display = 'grid';
}

// Plus Minus Quantity adjusters
function initQuantityControls() {
    const minusBtn = document.getElementById('qty-minus-btn');
    const plusBtn = document.getElementById('qty-plus-btn');
    const qtyInput = document.getElementById('qty-input');

    if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                qtyInput.value = quantity;
            }
        });

        plusBtn.addEventListener('click', () => {
            quantity++;
            qtyInput.value = quantity;
        });
    }
}

// Hide product panel and show Error notice page
function showErrorState() {
    const skeleton = document.getElementById('product-detail-skeleton');
    const layout = document.getElementById('product-detail-layout');
    const errorState = document.getElementById('product-error-state');

    if (skeleton) skeleton.style.display = 'none';
    if (layout) layout.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
}

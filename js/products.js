// Products Catalog Manager (Shop Page Controller)
import { getDbProducts } from './firebase.js';
import { showToast } from './main.js';
import { addToCart } from './cart.js';

// Items limit per page
const ITEMS_PER_PAGE = 12;

// Catalog States
let products = [];
let filteredProducts = [];
let currentPage = 1;
let activeFilters = {
    categories: [], // Empty means "All"
    collections: [],
    maxPrice: 10000,
    search: ""
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    initFilters();
    parseUrlParams();
    applyFilters();
});

// Load products from DB
async function loadProducts() {
    try {
        products = await getDbProducts();
        filteredProducts = [...products];
    } catch (err) {
        console.error("Error loading products: ", err);
        showToast("Error loading catalog. Please try again.", "error");
    }
}

// Parse initial filters from URL params (e.g. collection, category, search)
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Search keyword query
    const searchQuery = params.get('search');
    if (searchQuery) {
        activeFilters.search = searchQuery.toLowerCase().trim();
        // Sync search input drawer if visible
        const overlayInput = document.getElementById('overlay-search-input');
        if (overlayInput) overlayInput.value = searchQuery;
    }

    // Collection filtering
    const collectionParam = params.get('collection');
    if (collectionParam) {
        const collVal = collectionParam.toLowerCase().trim();
        if (collVal === 'summer' || collVal === 'winter') {
            activeFilters.collections = [collVal];
            
            // Check matching input checkboxes
            const checkboxes = document.querySelectorAll('.coll-checkbox');
            checkboxes.forEach(cb => {
                if (cb.value === collVal) cb.checked = true;
            });
        }
    }

    // Category filtering
    const categoryParam = params.get('category');
    if (categoryParam) {
        let catVal = decodeURIComponent(categoryParam).toLowerCase().trim();
        if (catVal === 'polo-shirts') catVal = 'polo shirts';
        const validCategories = ['t-shirts', 'shirts', 'polo shirts', 'jeans', 'hoodies', 'jackets', 'shorts', 'accessories'];
        if (validCategories.includes(catVal)) {
            activeFilters.categories = [catVal];
            
            // Adjust checkboxes: uncheck "All", check current category
            const allCheckbox = document.getElementById('cat-all');
            if (allCheckbox) allCheckbox.checked = false;

            const checkboxes = document.querySelectorAll('.cat-checkbox');
            checkboxes.forEach(cb => {
                if (cb.value.toLowerCase() === catVal) cb.checked = true;
            });
        }
    }
}

// Bind click event listeners to filter sidebar elements
function initFilters() {
    // 1. Categories checklist
    const allCheckbox = document.getElementById('cat-all');
    const catCheckboxes = document.querySelectorAll('.cat-checkbox');

    if (allCheckbox) {
        allCheckbox.addEventListener('change', () => {
            if (allCheckbox.checked) {
                // Uncheck all other options
                catCheckboxes.forEach(cb => cb.checked = false);
                activeFilters.categories = [];
            }
            applyFilters();
        });
    }

    catCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) {
                // If checking an option, uncheck "All Categories"
                if (allCheckbox) allCheckbox.checked = false;
            }
            
            // Build current list
            const checkedCategories = [];
            catCheckboxes.forEach(c => {
                if (c.checked) checkedCategories.push(c.value);
            });
            
            // If nothing checked, revert back to checking "All"
            if (checkedCategories.length === 0 && allCheckbox) {
                allCheckbox.checked = true;
                activeFilters.categories = [];
            } else {
                activeFilters.categories = checkedCategories;
            }
            applyFilters();
        });
    });

    // 2. Collection checklist
    const collCheckboxes = document.querySelectorAll('.coll-checkbox');
    collCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checkedColl = [];
            collCheckboxes.forEach(c => {
                if (c.checked) checkedColl.push(c.value);
            });
            activeFilters.collections = checkedColl;
            applyFilters();
        });
    });

    // 3. Price Range Slider
    const rangeSlider = document.getElementById('price-range');
    const maxPriceLabel = document.getElementById('price-max-label');
    if (rangeSlider && maxPriceLabel) {
        rangeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            maxPriceLabel.textContent = `₨ ${val.toLocaleString()}`;
            activeFilters.maxPrice = val;
            applyFilters();
        });
    }

    // 4. Clear/Reset Filters button
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Uncheck filters
            if (allCheckbox) allCheckbox.checked = true;
            catCheckboxes.forEach(cb => cb.checked = false);
            collCheckboxes.forEach(cb => cb.checked = false);
            
            if (rangeSlider) {
                rangeSlider.value = 10000;
                maxPriceLabel.textContent = `₨ 10,000`;
            }
            
            activeFilters = {
                categories: [],
                collections: [],
                maxPrice: 10000,
                search: ""
            };
            
            applyFilters();
            // Clear URL params
            window.history.pushState({}, document.title, window.location.pathname);
        });
    }

    // 5. Sorting dropdown selector
    const sortSelect = document.getElementById('sort-selector');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            applySorting(sortSelect.value);
        });
    }

    // 6. Mobile filters sidebar toggles
    const mobileBtn = document.getElementById('mobile-filter-btn');
    const sidebar = document.getElementById('shop-sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            if (sidebar.classList.contains('active')) {
                mobileBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <span>Close</span>
                `;
            } else {
                mobileBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                    <span>Filters</span>
                `;
            }
        });
    }
}

// Process filters matching criteria
function applyFilters() {
    filteredProducts = products.filter(p => {
        // Search text check
        const matchSearch = (p.title || '').toLowerCase().includes(activeFilters.search) || 
                            (p.category || '').toLowerCase().includes(activeFilters.search) ||
                            (p.description || '').toLowerCase().includes(activeFilters.search);
        
        // Category check
        const prodCat = (p.category || '').toLowerCase().trim();
        const matchCategory = activeFilters.categories.length === 0 || 
                              activeFilters.categories.some(cat => {
                                  return prodCat === cat || prodCat === cat.replace('-', ' ') || prodCat.replace('-', ' ') === cat;
                              });
        
        // Collection check
        const prodColl = (p.collection || '').toLowerCase().trim();
        const matchCollection = activeFilters.collections.length === 0 || 
                                activeFilters.collections.includes(prodColl);
        
        // Price limit check
        const matchPrice = (p.price || 0) <= activeFilters.maxPrice;

        return matchSearch && matchCategory && matchCollection && matchPrice;
    });

    // Reset pagination to first page
    currentPage = 1;
    
    // Sort and render
    const sortSelect = document.getElementById('sort-selector');
    applySorting(sortSelect ? sortSelect.value : 'featured', false);
    renderGrid();
}

// Sorting logic
function applySorting(order, shouldRender = true) {
    if (order === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (order === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (order === 'name-az') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (order === 'name-za') {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    } else {
        // Featured default: resets back to initial DB order
        filteredProducts = products.filter(p => filteredProducts.includes(p));
    }
    
    if (shouldRender) renderGrid();
}

// Render dynamic catalog list items
function renderGrid() {
    const grid = document.getElementById('shop-products-grid');
    const emptyState = document.getElementById('shop-empty-state');
    const countLabel = document.getElementById('catalog-count-label');
    const headingTitle = document.getElementById('catalog-heading-title');
    
    if (!grid) return;

    // Heading modifications based on collection
    if (activeFilters.collections.length === 1) {
        headingTitle.textContent = `${activeFilters.collections[0]} collection`;
    } else {
        headingTitle.textContent = "All Products";
    }

    if (filteredProducts.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (countLabel) countLabel.textContent = "Showing 0 products";
        renderPagination(0);
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    // Paginate items slice
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    if (countLabel) {
        countLabel.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredProducts.length} results`;
    }

    grid.innerHTML = pageProducts.map(p => {
        // Static mockup stars based on random reviews for premium appearance
        const ratingVal = p.rating || 4.5;
        const reviewsCount = p.reviews || 22;
        return `
            <div class="product-card" data-id="${p.id}">
                <div class="product-card-badge">
                    <span class="badge ${p.collection === 'summer' ? 'badge-summer' : 'badge-winter'}">${p.collection}</span>
                </div>
                <div class="product-card-img-wrapper">
                    <img class="product-card-img" src="${p.image}" alt="${p.title}">
                </div>
                <div class="product-card-content">
                    <div>
                        <span class="product-card-meta">${p.category}</span>
                        <h3 class="product-card-title">${p.title}</h3>
                        <div class="product-card-rating">
                            ${'★'.repeat(Math.round(ratingVal))}${'☆'.repeat(5 - Math.round(ratingVal))}
                            <span>(${reviewsCount})</span>
                        </div>
                    </div>
                    <div class="product-card-footer">
                        <span class="product-card-price">₨ ${p.price.toLocaleString()}</span>
                        <div class="product-card-actions">
                            <a href="product.html?id=${p.id}" class="product-card-btn view-btn" title="View Details">
                                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </a>
                            <button class="product-card-btn add-to-cart-btn" data-id="${p.id}" title="Add to Cart">
                                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Bind Add to Cart action hooks
    const cartButtons = grid.querySelectorAll('.add-to-cart-btn');
    cartButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const targetProduct = products.find(p => p.id === id);
            if (targetProduct) {
                // Pass standard selections
                const defaultSize = targetProduct.sizes && targetProduct.sizes.length > 0 ? targetProduct.sizes[0] : 'One Size';
                const defaultColor = targetProduct.colors && targetProduct.colors.length > 0 ? targetProduct.colors[0] : null;
                addToCart(targetProduct, 1, defaultSize, defaultColor);
            }
        });
    });

    renderPagination(filteredProducts.length);
}

// Build page buttons indicators
function renderPagination(totalItems) {
    const pagesContainer = document.getElementById('pagination-controls');
    if (!pagesContainer) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
        pagesContainer.innerHTML = '';
        return;
    }

    let buttonsHtml = '';
    
    // Back arrow
    buttonsHtml += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>
            &larr;
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        buttonsHtml += `
            <button class="pagination-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    // Next arrow
    buttonsHtml += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>
            &rarr;
        </button>
    `;

    pagesContainer.innerHTML = buttonsHtml;

    // Listeners for page change
    pagesContainer.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.getAttribute('data-page'));
            renderGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    const prevBtn = document.getElementById('prev-page');
    if (prevBtn && currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            currentPage--;
            renderGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const nextBtn = document.getElementById('next-page');
    if (nextBtn && currentPage < totalPages) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            renderGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

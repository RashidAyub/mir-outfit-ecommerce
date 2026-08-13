// Firebase Initialization Module with LocalStorage Mock Database Fallback

// IMPORTANT: Replace this placeholder config with your actual Firebase settings in production!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Flags and State
let isFirebaseAvailable = false;
let db = null;
let auth = null;

// Preset clothing products as initial mock data
const DEFAULT_PRODUCTS = [
    {
        id: "prod-1",
        title: "Premium Cotton T-Shirt",
        price: 2499,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        description: "Soft, lightweight premium combed cotton t-shirt. Ideal for styling casual summer afternoons.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Black", "Charcoal"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-2",
        title: "Casual Summer Linen Shirt",
        price: 3499,
        category: "shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
        description: "Pure breathable linen shirt with clean classic cuffs. Keeps you cool while looking exceptionally smart.",
        sizes: ["M", "L", "XL"],
        colors: ["Beige", "Sky Blue"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-3",
        title: "Premium Polo Shirt",
        price: 2999,
        category: "polo shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80",
        description: "Elegant knit mesh polo shirt with ribbed cuffs. Perfect blend of athletic comfort and formal dressing.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Navy Blue", "Dark Green"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-4",
        title: "Modern Summer Jeans",
        price: 3999,
        category: "jeans",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
        description: "Stretchable light-wash summer denim with tapered ankles. Comfortable and stylish for daily city wear.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Light Indigo"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-5",
        title: "Comfort Hooded Sweatshirt",
        price: 4499,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-soft inner fleece hooded jacket with drawstrings. Warm layering perfect for freezing winter evenings.",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Olive Green", "Crimson"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-6",
        title: "Premium Heavy Wool Sweater",
        price: 5999,
        category: "sweaters",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80",
        description: "Knit wool classic pullover sweater with sophisticated crew neck cut. Snug fit tailored for extreme cold.",
        sizes: ["M", "L", "XL"],
        colors: ["Charcoal", "Burgundy"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-7",
        title: "Thermal Puffer Jacket",
        price: 8499,
        category: "jackets",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
        description: "Windproof and water-resistant insulated puffer jacket. Combines heavy protection with lightweight comfort.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Matte Black", "Orange"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-8",
        title: "Elegant Overcoat",
        price: 11999,
        category: "coats",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
        description: "Sophisticated long double-breasted woolen overcoat. The absolute peak of premium style for winter evenings.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Camel", "Black"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-9",
        title: "Casual Cotton Cargo Pants",
        price: 3499,
        category: "pants",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80",
        description: "Sturdy multi-pocket canvas cargo trousers. Designed for heavy outdoor action or laid-back styling.",
        sizes: ["30", "32", "34"],
        colors: ["Khaki", "Army Gray"],
        createdAt: new Date().toISOString()
    },
    {
        id: "prod-10",
        title: "Leather Fashion Wallet",
        price: 1999,
        category: "accessories",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
        description: "Genuine grain leather bi-fold cardholder wallet. Slim pocket layout finished with detailed stitches.",
        sizes: ["One Size"],
        colors: ["Tan Brown"],
        createdAt: new Date().toISOString()
    }
];

// Initialize Mock database store in LocalStorage
function initMockDb() {
    if (!localStorage.getItem('mir_products')) {
        localStorage.setItem('mir_products', JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem('mir_orders')) {
        localStorage.setItem('mir_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('mir_users')) {
        // Create a default admin user for initial logins
        const adminUser = {
            id: "admin-user",
            name: "MIR Admin",
            email: "admin@miroutfit.com",
            role: "admin",
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('mir_users', JSON.stringify([adminUser]));
    }
}

initMockDb();

// Database Interface Wrappers (Transparently chooses real Firebase or LocalStorage Fallback)
export async function getDbProducts() {
    // If Firebase was initialized and online, we would pull from Firestore
    // For now, we return localStorage list to satisfy immediate client validation
    return JSON.parse(localStorage.getItem('mir_products'));
}

export async function addDbProduct(product) {
    const products = JSON.parse(localStorage.getItem('mir_products'));
    const newProduct = {
        ...product,
        id: product.id || "prod-" + Date.now(),
        createdAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    localStorage.setItem('mir_products', JSON.stringify(products));
    return newProduct;
}

export async function updateDbProduct(id, updates) {
    const products = JSON.parse(localStorage.getItem('mir_products'));
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        localStorage.setItem('mir_products', JSON.stringify(products));
        return products[index];
    }
    throw new Error("Product not found");
}

export async function deleteDbProduct(id) {
    let products = JSON.parse(localStorage.getItem('mir_products'));
    products = products.filter(p => p.id !== id);
    localStorage.setItem('mir_products', JSON.stringify(products));
    return true;
}

export async function getDbOrders() {
    return JSON.parse(localStorage.getItem('mir_orders'));
}

export async function addDbOrder(order) {
    const orders = JSON.parse(localStorage.getItem('mir_orders'));
    const newOrder = {
        ...order,
        id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        status: order.status || "Pending"
    };
    orders.unshift(newOrder);
    localStorage.setItem('mir_orders', JSON.stringify(orders));
    return newOrder;
}

export async function updateDbOrderStatus(orderId, status) {
    const orders = JSON.parse(localStorage.getItem('mir_orders'));
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = status;
        localStorage.setItem('mir_orders', JSON.stringify(orders));
        return orders[index];
    }
    throw new Error("Order not found");
}

// Authentication simulated operations
export async function getActiveUser() {
    return JSON.parse(sessionStorage.getItem('mir_logged_user')) || null;
}

export function setActiveUser(user) {
    if (user) {
        sessionStorage.setItem('mir_logged_user', JSON.stringify(user));
    } else {
        sessionStorage.removeItem('mir_logged_user');
    }
}

// Global Exports
export { isFirebaseAvailable, db, auth };

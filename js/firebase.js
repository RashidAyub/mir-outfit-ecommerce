// Firebase Initialization Module with LocalStorage Mock Database Fallback

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBh8um3QVKhsGgD5ZZCosikClBXRLiu4ec",
  authDomain: "clothing-e-commerce-webs-f10eb.firebaseapp.com",
  projectId: "clothing-e-commerce-webs-f10eb",
  storageBucket: "clothing-e-commerce-webs-f10eb.firebasestorage.app",
  messagingSenderId: "429218913814",
  appId: "1:429218913814:web:00f6c273ef23c8d4531f37",
  measurementId: "G-KKY9SNBRJD"
};

// Flags and State
let isFirebaseAvailable = false;
let app = null;
let db = null;
let auth = null;

// ─── Auth Ready Promise ─────────────────────────────────────────────────────
// Resolves with the Firebase user object (or null) once onAuthStateChanged
// fires for the first time. This avoids the 50ms race-condition hack.
let _authReadyResolve;
const authReadyPromise = new Promise(resolve => {
    _authReadyResolve = resolve;
});

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseAvailable = true;
    console.log("Firebase successfully initialized.");
} catch (error) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", error);
    isFirebaseAvailable = false;
    // Resolve immediately with null so waitForAuth() never blocks when Firebase is down
    _authReadyResolve(null);
}

// Preset clothing products as initial mock data (48 Products: 8 categories x 6 items)
const DEFAULT_PRODUCTS = [
    // ─── 1. T-SHIRTS (6 Products) ──────────────────────────────────────────────
    {
        id: "prod-1",
        title: "Premium Cotton Crew T-Shirt",
        price: 2499,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        description: "Soft, lightweight premium combed cotton t-shirt. Ideal for styling casual summer afternoons with effortless comfort.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Black", "Charcoal"],
        rating: 4.8,
        reviews: 42,
        stock: 35,
        createdAt: "2026-01-10T10:00:00.000Z"
    },
    {
        id: "prod-2",
        title: "Classic Heavyweight Oversized Tee",
        price: 2899,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80",
        description: "240 GSM heavy cotton drop-shoulder boxy tee. Built with thick ribbed collar for a distinct modern streetwear silhouette.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Sage Green", "Jet Black", "Off White"],
        rating: 4.7,
        reviews: 28,
        stock: 24,
        createdAt: "2026-01-11T10:00:00.000Z"
    },
    {
        id: "prod-3",
        title: "Vintage Acid Wash Graphic T-Shirt",
        price: 3199,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
        description: "Distressed mineral-washed cotton graphic tee with vintage typography. Pre-shrunk for an authentic worn-in aesthetic.",
        sizes: ["M", "L", "XL"],
        colors: ["Washed Grey", "Faded Slate"],
        rating: 4.9,
        reviews: 35,
        stock: 18,
        createdAt: "2026-01-12T10:00:00.000Z"
    },
    {
        id: "prod-4",
        title: "Minimalist Supima Cotton Tee",
        price: 2799,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-fine American Supima cotton with a silk-like touch. Features clean hidden stitching and tailored drape.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Off White", "Olive", "Navy"],
        rating: 4.6,
        reviews: 19,
        stock: 40,
        createdAt: "2026-01-13T10:00:00.000Z"
    },
    {
        id: "prod-5",
        title: "Striped Nautical Summer T-Shirt",
        price: 2699,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=600&q=80",
        description: "Classic Breton horizontal stripe tee with contrast collar. Made from breathable yarn-dyed jersey cotton.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Navy/White", "Black/White"],
        rating: 4.8,
        reviews: 23,
        stock: 30,
        createdAt: "2026-01-14T10:00:00.000Z"
    },
    {
        id: "prod-6",
        title: "Athletic Performance Dry-Fit Tee",
        price: 2299,
        category: "t-shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80",
        description: "Moisture-wicking active blend with 4-way mechanical stretch. Keeps you dry and agile during high-heat activities.",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Carbon Grey", "Royal Blue", "Pitch Black"],
        rating: 4.5,
        reviews: 17,
        stock: 50,
        createdAt: "2026-01-15T10:00:00.000Z"
    },

    // ─── 2. SHIRTS (6 Products) ────────────────────────────────────────────────
    {
        id: "prod-7",
        title: "Casual Summer Linen Shirt",
        price: 3499,
        category: "shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
        description: "Pure breathable linen shirt with clean classic cuffs. Keeps you cool while looking exceptionally smart.",
        sizes: ["M", "L", "XL"],
        colors: ["Beige", "Sky Blue", "White"],
        rating: 4.8,
        reviews: 31,
        stock: 22,
        createdAt: "2026-01-16T10:00:00.000Z"
    },
    {
        id: "prod-8",
        title: "Classic Oxford Button-Down Shirt",
        price: 3899,
        category: "shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
        description: "Durable Oxford basketweave cotton shirt with a structured button-down collar and chest pocket.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Pure White", "Pastel Blue"],
        rating: 4.9,
        reviews: 45,
        stock: 28,
        createdAt: "2026-01-17T10:00:00.000Z"
    },
    {
        id: "prod-9",
        title: "Relaxed Cuban Collar Resort Shirt",
        price: 3299,
        category: "shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
        description: "Breezy open camp-collar shirt with tropical-inspired minimalist botanical print and relaxed straight hem.",
        sizes: ["M", "L", "XL"],
        colors: ["Olive Print", "Terracotta"],
        rating: 4.7,
        reviews: 20,
        stock: 19,
        createdAt: "2026-01-18T10:00:00.000Z"
    },
    {
        id: "prod-10",
        title: "Textured Mandarin Collar Shirt",
        price: 3699,
        category: "shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80",
        description: "Band collar cotton shirt featuring subtle slub texture for a polished eastern-fusion formal styling.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Ivory White", "Khaki", "Charcoal"],
        rating: 4.6,
        reviews: 14,
        stock: 26,
        createdAt: "2026-01-19T10:00:00.000Z"
    },
    {
        id: "prod-11",
        title: "Brushed Flannel Plaid Winter Shirt",
        price: 4199,
        category: "shirts",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
        description: "Heavy brushed twill cotton flannel shirt designed for cold evening layering over basic tees.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Red Plaid", "Forest Green", "Buffalo Check"],
        rating: 4.9,
        reviews: 38,
        stock: 21,
        createdAt: "2026-01-20T10:00:00.000Z"
    },
    {
        id: "prod-12",
        title: "Slim Fit Formal Cotton Shirt",
        price: 3999,
        category: "shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1620012253295-c15c429fccf8?auto=format&fit=crop&w=600&q=80",
        description: "Crisp satin-finish formal shirt tailored for business wear and corporate smart elegance.",
        sizes: ["38", "40", "42", "44"],
        colors: ["Crisp White", "Midnight Black"],
        rating: 4.8,
        reviews: 29,
        stock: 33,
        createdAt: "2026-01-21T10:00:00.000Z"
    },

    // ─── 3. POLO SHIRTS (6 Products) ───────────────────────────────────────────
    {
        id: "prod-13",
        title: "Signature Pique Cotton Polo",
        price: 2999,
        category: "polo shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80",
        description: "Elegant honeycomb pique knit polo shirt with mother-of-pearl buttons and ribbed sleeve trim.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Navy Blue", "Dark Green", "Burgundy"],
        rating: 4.8,
        reviews: 39,
        stock: 30,
        createdAt: "2026-01-22T10:00:00.000Z"
    },
    {
        id: "prod-14",
        title: "Classic Tipped Collar Polo Shirt",
        price: 3299,
        category: "polo shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1625910513413-5626222b406b?auto=format&fit=crop&w=600&q=80",
        description: "Sporty twin-tipped collar and cuffs with an embroidered subtle brand chest monogram.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Burgundy", "Pearl White", "Jet Black"],
        rating: 4.7,
        reviews: 24,
        stock: 25,
        createdAt: "2026-01-23T10:00:00.000Z"
    },
    {
        id: "prod-15",
        title: "Luxury Knit Jacquard Polo",
        price: 3699,
        category: "polo shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80",
        description: "Retro 70s-inspired jacquard textured knit polo without placket buttons for seamless casual luxury.",
        sizes: ["M", "L", "XL"],
        colors: ["Mocha Brown", "Deep Navy"],
        rating: 4.9,
        reviews: 18,
        stock: 17,
        createdAt: "2026-01-24T10:00:00.000Z"
    },
    {
        id: "prod-16",
        title: "Sport Mesh Breathable Golf Polo",
        price: 2799,
        category: "polo shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=600&q=80",
        description: "Lightweight performance poly-spandex mesh polo with UV protection and quick-dry micro-vents.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Sky Grey", "Teal", "White"],
        rating: 4.6,
        reviews: 22,
        stock: 35,
        createdAt: "2026-01-25T10:00:00.000Z"
    },
    {
        id: "prod-17",
        title: "Zip-Collar Modern Smart Polo",
        price: 3499,
        category: "polo shirts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=600&q=80",
        description: "Sleek metallic quarter-zip neck detail on a tailored mercerized Egyptian cotton polo shirt.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Charcoal Grey", "Jet Black"],
        rating: 4.8,
        reviews: 27,
        stock: 20,
        createdAt: "2026-01-26T10:00:00.000Z"
    },
    {
        id: "prod-18",
        title: "Long Sleeve Knitted Winter Polo",
        price: 4299,
        category: "polo shirts",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=600&q=80",
        description: "Fine-gauge merino wool long sleeve polo sweater. Keeps you warm under blazers or coats.",
        sizes: ["M", "L", "XL"],
        colors: ["Walnut", "Dark Olive", "Black"],
        rating: 4.9,
        reviews: 32,
        stock: 19,
        createdAt: "2026-01-27T10:00:00.000Z"
    },

    // ─── 4. JEANS (6 Products) ─────────────────────────────────────────────────
    {
        id: "prod-19",
        title: "Modern Slim Tapered Summer Jeans",
        price: 3999,
        category: "jeans",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
        description: "Stretchable light-wash summer denim with tapered ankles. Comfortable and stylish for daily city wear.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Light Indigo"],
        rating: 4.7,
        reviews: 48,
        stock: 30,
        createdAt: "2026-01-28T10:00:00.000Z"
    },
    {
        id: "prod-20",
        title: "Classic Straight Fit Dark Wash Jeans",
        price: 4299,
        category: "jeans",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
        description: "Traditional 5-pocket denim with clean dark indigo dye and copper riveted stress points.",
        sizes: ["30", "32", "34", "36", "38"],
        colors: ["Deep Raw Indigo"],
        rating: 4.8,
        reviews: 51,
        stock: 28,
        createdAt: "2026-01-29T10:00:00.000Z"
    },
    {
        id: "prod-21",
        title: "Vintage Distressed Relaxed Jeans",
        price: 4499,
        category: "jeans",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80",
        description: "90s loose fit denim with hand-abraded knee distressing and subtle authentic paint spatter details.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Vintage Blue Wash"],
        rating: 4.6,
        reviews: 29,
        stock: 20,
        createdAt: "2026-01-30T10:00:00.000Z"
    },
    {
        id: "prod-22",
        title: "Jet Black Stretch Denim Jeans",
        price: 3899,
        category: "jeans",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=600&q=80",
        description: "Fade-resistant sulphur black denim infused with 2% elastane for maximum range of motion.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Washed Black", "Pitch Black"],
        rating: 4.9,
        reviews: 62,
        stock: 35,
        createdAt: "2026-01-31T10:00:00.000Z"
    },
    {
        id: "prod-23",
        title: "Loose Fit Carpenter Denim Jeans",
        price: 4699,
        category: "jeans",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&w=600&q=80",
        description: "Workwear utilitarian carpenter trousers featuring utility hammer loop and dual side tool pockets.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Stonewash Light", "Khaki Denim"],
        rating: 4.7,
        reviews: 21,
        stock: 16,
        createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
        id: "prod-24",
        title: "Heavyweight Raw Selvedge Denim",
        price: 5499,
        category: "jeans",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1511196706463-843ab9d06b29?auto=format&fit=crop&w=600&q=80",
        description: "14.5 oz unwashed shuttle-loom selvedge denim that shapes uniquely to your lifestyle fades.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Midnight Navy"],
        rating: 5.0,
        reviews: 44,
        stock: 15,
        createdAt: "2026-02-02T10:00:00.000Z"
    },

    // ─── 5. HOODIES (6 Products) ───────────────────────────────────────────────
    {
        id: "prod-25",
        title: "Comfort Heavy Fleece Pullover Hoodie",
        price: 4499,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-soft inner fleece hooded jacket with drawstrings. Warm layering perfect for freezing winter evenings.",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Olive Green", "Crimson"],
        rating: 4.8,
        reviews: 58,
        stock: 40,
        createdAt: "2026-02-03T10:00:00.000Z"
    },
    {
        id: "prod-26",
        title: "Minimalist Boxy Oversized Hoodie",
        price: 4999,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80",
        description: "Heavy 450 GSM French terry hoodie with seamless kangaroo pocket and double-layered warm hood.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Oatmeal Melange", "Charcoal"],
        rating: 4.9,
        reviews: 37,
        stock: 25,
        createdAt: "2026-02-04T10:00:00.000Z"
    },
    {
        id: "prod-27",
        title: "Full Zip Tech Fleece Track Hoodie",
        price: 4799,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80",
        description: "Sleek double-knit bonded fleece with zippered sleeve pocket and ergonomic articulated elbows.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Heather Grey", "Black"],
        rating: 4.7,
        reviews: 31,
        stock: 28,
        createdAt: "2026-02-05T10:00:00.000Z"
    },
    {
        id: "prod-28",
        title: "Vintage Washed Drop-Shoulder Hoodie",
        price: 4699,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1513789181297-6f2ec112c2bc?auto=format&fit=crop&w=600&q=80",
        description: "Garment-dyed vintage sun-faded wash cotton fleece hoodie for laid-back weekend aesthetics.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Dust Rose", "Sand Beige"],
        rating: 4.6,
        reviews: 20,
        stock: 22,
        createdAt: "2026-02-06T10:00:00.000Z"
    },
    {
        id: "prod-29",
        title: "Embroidered Signature Logo Hoodie",
        price: 4899,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
        description: "Premium high-density embroidery branding on center chest with custom brass eyelets and drawcords.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Royal Navy", "Forest Green"],
        rating: 4.8,
        reviews: 43,
        stock: 30,
        createdAt: "2026-02-07T10:00:00.000Z"
    },
    {
        id: "prod-30",
        title: "Thermal Lined Heavyweight Winter Hoodie",
        price: 5499,
        category: "hoodies",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
        description: "Sherpa fur insulated lining throughout body and hood. The warmest winter companion for cold mornings.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Pitch Black", "Camel Brown"],
        rating: 5.0,
        reviews: 55,
        stock: 18,
        createdAt: "2026-02-08T10:00:00.000Z"
    },

    // ─── 6. JACKETS (6 Products) ───────────────────────────────────────────────
    {
        id: "prod-31",
        title: "Thermal Insulated Puffer Jacket",
        price: 8499,
        category: "jackets",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
        description: "Windproof and water-resistant insulated puffer jacket. Combines heavy protection with lightweight comfort.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Matte Black", "Rust Orange"],
        rating: 4.9,
        reviews: 64,
        stock: 25,
        createdAt: "2026-02-09T10:00:00.000Z"
    },
    {
        id: "prod-32",
        title: "Classic Trucker Denim Jacket",
        price: 6499,
        category: "jackets",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
        description: "Iconic heavy cotton trucker jacket with metal shank buttons, welt side pockets, and adjustable waist tabs.",
        sizes: ["M", "L", "XL"],
        colors: ["Classic Indigo", "Washed Black"],
        rating: 4.8,
        reviews: 49,
        stock: 20,
        createdAt: "2026-02-10T10:00:00.000Z"
    },
    {
        id: "prod-33",
        title: "Water-Resistant Technical Windbreaker",
        price: 5999,
        category: "jackets",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-lightweight ripstop nylon windbreaker with packable hood and storm-proof taped seams.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Slate Grey", "Olive Green"],
        rating: 4.7,
        reviews: 33,
        stock: 27,
        createdAt: "2026-02-11T10:00:00.000Z"
    },
    {
        id: "prod-34",
        title: "Premium Suede Bomber Jacket",
        price: 9999,
        category: "jackets",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=600&q=80",
        description: "Supple faux-suede bomber jacket with silky satin lining and thick ribbed collar and waist.",
        sizes: ["M", "L", "XL"],
        colors: ["Cognac Brown", "Midnight Black"],
        rating: 4.9,
        reviews: 41,
        stock: 14,
        createdAt: "2026-02-12T10:00:00.000Z"
    },
    {
        id: "prod-35",
        title: "Tailored Wool Blend Overcoat",
        price: 11999,
        category: "jackets",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
        description: "Sophisticated long double-breasted woolen overcoat. The absolute peak of premium style for winter evenings.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Camel Tan", "Charcoal Grey"],
        rating: 5.0,
        reviews: 72,
        stock: 12,
        createdAt: "2026-02-13T10:00:00.000Z"
    },
    {
        id: "prod-36",
        title: "Quilted Sherpa Fleece Winter Jacket",
        price: 7999,
        category: "jackets",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=600&q=80",
        description: "High-pile plush sherpa jacket combined with diamond-quilted nylon chest panels for rugged warmth.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Cream Ivory", "Forest Green"],
        rating: 4.8,
        reviews: 29,
        stock: 19,
        createdAt: "2026-02-14T10:00:00.000Z"
    },

    // ─── 7. SHORTS (6 Products) ────────────────────────────────────────────────
    {
        id: "prod-37",
        title: "Relaxed Fit Cotton Chino Shorts",
        price: 2799,
        category: "shorts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80",
        description: "Tailored 8-inch inseam cotton twill shorts with clean flat front and buttoned rear welt pockets.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Khaki", "Navy Blue", "Olive"],
        rating: 4.7,
        reviews: 36,
        stock: 35,
        createdAt: "2026-02-15T10:00:00.000Z"
    },
    {
        id: "prod-38",
        title: "Lightweight French Terry Sweat Shorts",
        price: 2499,
        category: "shorts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-cozy unbrushed French terry shorts with adjustable braided drawstring waistband.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Heather Grey", "Black"],
        rating: 4.8,
        reviews: 40,
        stock: 42,
        createdAt: "2026-02-16T10:00:00.000Z"
    },
    {
        id: "prod-39",
        title: "Stretch Cargo Utility Summer Shorts",
        price: 3199,
        category: "shorts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80",
        description: "Multi-pocket durable cotton ripstop cargo shorts built for outdoor adventure and utility styling.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Olive Drab", "Sand Beige"],
        rating: 4.6,
        reviews: 25,
        stock: 28,
        createdAt: "2026-02-17T10:00:00.000Z"
    },
    {
        id: "prod-40",
        title: "Vintage Distressed Denim Shorts",
        price: 2999,
        category: "shorts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
        description: "Frayed hem 5-pocket denim cutoffs with authentic stone wash fading and comfortable stretch.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Washed Light Blue"],
        rating: 4.7,
        reviews: 22,
        stock: 24,
        createdAt: "2026-02-18T10:00:00.000Z"
    },
    {
        id: "prod-41",
        title: "Quick-Dry Active Running Shorts",
        price: 2299,
        category: "shorts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80",
        description: "Breathable moisture-wicking micro-mesh shorts with built-in compression liner and zippered key pocket.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Jet Black", "Electric Navy"],
        rating: 4.9,
        reviews: 31,
        stock: 38,
        createdAt: "2026-02-19T10:00:00.000Z"
    },
    {
        id: "prod-42",
        title: "Linen Blend Drawstring Casual Shorts",
        price: 2899,
        category: "shorts",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
        description: "Pure resort comfort made from airy linen-cotton blend with elastic waistband for hot tropical days.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Beige", "Mint Green"],
        rating: 4.8,
        reviews: 27,
        stock: 30,
        createdAt: "2026-02-20T10:00:00.000Z"
    },

    // ─── 8. ACCESSORIES (6 Products) ───────────────────────────────────────────
    {
        id: "prod-43",
        title: "Genuine Grain Leather Bifold Wallet",
        price: 1999,
        category: "accessories",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
        description: "Handcrafted top-grain cowhide leather wallet with RFID-blocking lining, 8 card slots, and dual currency compartments.",
        sizes: ["One Size"],
        colors: ["Tan Brown", "Black"],
        rating: 4.9,
        reviews: 67,
        stock: 50,
        createdAt: "2026-02-21T10:00:00.000Z"
    },
    {
        id: "prod-44",
        title: "Classic Automatic Buckle Leather Belt",
        price: 2299,
        category: "accessories",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        description: "Smooth genuine leather dress belt with modern micro-adjustable ratchet buckle mechanism.",
        sizes: ["32", "34", "36", "38"],
        colors: ["Rich Brown", "Matte Black"],
        rating: 4.8,
        reviews: 44,
        stock: 36,
        createdAt: "2026-02-22T10:00:00.000Z"
    },
    {
        id: "prod-45",
        title: "Ribbed Cashmere Wool Winter Beanie",
        price: 1499,
        category: "accessories",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-soft cashmere-wool blend knit watch cap. Provides snug, itch-free warmth during biting winter chills.",
        sizes: ["One Size"],
        colors: ["Charcoal Grey", "Oatmeal", "Black"],
        rating: 4.9,
        reviews: 52,
        stock: 45,
        createdAt: "2026-02-23T10:00:00.000Z"
    },
    {
        id: "prod-46",
        title: "Handcrafted Wool Plaid Winter Scarf",
        price: 2499,
        category: "accessories",
        collection: "winter",
        image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80",
        description: "Generously sized brushed pure wool fringe scarf in a timeless tartan pattern for winter layering.",
        sizes: ["One Size"],
        colors: ["Classic Tartan", "Navy Monochrome"],
        rating: 4.8,
        reviews: 38,
        stock: 29,
        createdAt: "2026-02-24T10:00:00.000Z"
    },
    {
        id: "prod-47",
        title: "Vintage Washed Cotton Baseball Cap",
        price: 1699,
        category: "accessories",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
        description: "Unstructured 6-panel low profile dad hat with curved brim and antique brass buckle closure.",
        sizes: ["One Size"],
        colors: ["Khaki", "Washed Black", "Forest Green"],
        rating: 4.7,
        reviews: 33,
        stock: 40,
        createdAt: "2026-02-25T10:00:00.000Z"
    },
    {
        id: "prod-48",
        title: "Polarized Acetate Classic Sunglasses",
        price: 3499,
        category: "accessories",
        collection: "summer",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        description: "Hand-polished Italian acetate frame with UV400 anti-glare polarized lenses and reinforced 5-barrel hinges.",
        sizes: ["One Size"],
        colors: ["Tortoise Gold", "Jet Black"],
        rating: 4.9,
        reviews: 61,
        stock: 25,
        createdAt: "2026-02-26T10:00:00.000Z"
    }
];

// Initialize Mock database store in LocalStorage
function initMockDb() {
    const existing = JSON.parse(localStorage.getItem('mir_products')) || [];
    if (!localStorage.getItem('mir_products') || existing.length < DEFAULT_PRODUCTS.length) {
        localStorage.setItem('mir_products', JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem('mir_orders')) {
        localStorage.setItem('mir_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('mir_users')) {
        // Create a default admin user for initial logins (fallback only)
        const adminUser = {
            id: "admin-user",
            name: "MIR Admin",
            email: "admin@miroutfit.com",
            password: "admin123",
            role: "admin",
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('mir_users', JSON.stringify([adminUser]));
    }
}

initMockDb();

// ─── Firebase Auth State Listener ──────────────────────────────────────────
// Fires onAuthStateChanged ONCE, resolves authReadyPromise, then keeps
// sessionStorage in sync for the lifetime of the page.
if (isFirebaseAvailable) {
    let firstFire = true;
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const sessionUser = {
                        id: user.uid,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role
                    };
                    sessionStorage.setItem('mir_logged_user', JSON.stringify(sessionUser));
                    if (firstFire) {
                        firstFire = false;
                        _authReadyResolve(sessionUser);
                    }
                } else {
                    // Firebase Auth user exists but no Firestore document yet
                    // (edge case: user deleted from Firestore but not Auth)
                    const sessionUser = {
                        id: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        role: "customer"
                    };
                    sessionStorage.setItem('mir_logged_user', JSON.stringify(sessionUser));
                    if (firstFire) {
                        firstFire = false;
                        _authReadyResolve(sessionUser);
                    }
                }
            } catch (error) {
                console.error("Error fetching user data from Firestore", error);
                if (firstFire) {
                    firstFire = false;
                    _authReadyResolve(null);
                }
            }
        } else {
            sessionStorage.removeItem('mir_logged_user');
            if (firstFire) {
                firstFire = false;
                _authReadyResolve(null);
            }
        }
    });
}

// ─── waitForAuth ────────────────────────────────────────────────────────────
// Exported function. Awaiting this guarantees Firebase auth state is known
// before proceeding. Falls back to sessionStorage if Firebase unavailable.
export async function waitForAuth() {
    if (isFirebaseAvailable) {
        return await authReadyPromise;
    }
    // Fallback: read from sessionStorage directly
    return JSON.parse(sessionStorage.getItem('mir_logged_user')) || null;
}

// ─── Database Interface Wrappers ────────────────────────────────────────────
// Transparently chooses real Firebase or LocalStorage Fallback

export async function getDbProducts() {
    if (isFirebaseAvailable) {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const products = [];
            querySnapshot.forEach((d) => {
                products.push({ id: d.id, ...d.data() });
            });
            // If Firestore is empty, fall back to localStorage defaults
            if (products.length > 0) return products;
        } catch (error) {
            console.error("Firebase getDbProducts failed, falling back", error);
        }
    }
    return JSON.parse(localStorage.getItem('mir_products')) || [];
}

export async function addDbProduct(product) {
    if (isFirebaseAvailable) {
        try {
            const docRef = await addDoc(collection(db, "products"), {
                ...product,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...product };
        } catch (error) {
            console.error("Firebase addDbProduct failed, falling back", error);
        }
    }
    
    // Fallback
    const products = JSON.parse(localStorage.getItem('mir_products')) || [];
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
    if (isFirebaseAvailable) {
        try {
            const docRef = doc(db, "products", id);
            await updateDoc(docRef, updates);
            return { id, ...updates };
        } catch (error) {
            console.error("Firebase updateDbProduct failed, falling back", error);
        }
    }

    // Fallback
    const products = JSON.parse(localStorage.getItem('mir_products')) || [];
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        localStorage.setItem('mir_products', JSON.stringify(products));
        return products[index];
    }
    throw new Error("Product not found");
}

export async function deleteDbProduct(id) {
    if (isFirebaseAvailable) {
        try {
            await deleteDoc(doc(db, "products", id));
            return true;
        } catch (error) {
            console.error("Firebase deleteDbProduct failed, falling back", error);
        }
    }
    
    // Fallback
    let products = JSON.parse(localStorage.getItem('mir_products')) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem('mir_products', JSON.stringify(products));
    return true;
}

export async function getDbOrders() {
    if (isFirebaseAvailable) {
        try {
            const querySnapshot = await getDocs(collection(db, "orders"));
            const orders = [];
            querySnapshot.forEach((d) => {
                orders.push({ id: d.id, ...d.data() });
            });
            return orders;
        } catch (error) {
            console.error("Firebase getDbOrders failed, falling back", error);
        }
    }
    return JSON.parse(localStorage.getItem('mir_orders')) || [];
}

export async function addDbOrder(order) {
    if (isFirebaseAvailable) {
        try {
            const newOrderData = {
                ...order,
                createdAt: new Date().toISOString(),
                status: order.status || "Pending"
            };
            const docRef = await addDoc(collection(db, "orders"), newOrderData);
            return { id: docRef.id, ...newOrderData };
        } catch (error) {
            console.error("Firebase addDbOrder failed, falling back", error);
        }
    }

    // Fallback
    const orders = JSON.parse(localStorage.getItem('mir_orders')) || [];
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
    if (isFirebaseAvailable) {
        try {
            const docRef = doc(db, "orders", orderId);
            await updateDoc(docRef, { status });
            return { id: orderId, status };
        } catch (error) {
            console.error("Firebase updateDbOrderStatus failed, falling back", error);
        }
    }
    
    // Fallback
    const orders = JSON.parse(localStorage.getItem('mir_orders')) || [];
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = status;
        localStorage.setItem('mir_orders', JSON.stringify(orders));
        return orders[index];
    }
    throw new Error("Order not found");
}

// ─── Get Customer Count from Firestore ─────────────────────────────────────
export async function getDbCustomers() {
    if (isFirebaseAvailable) {
        try {
            const q = query(collection(db, "users"), where("role", "==", "customer"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error("Firebase getDbCustomers failed, falling back", error);
        }
    }
    // Fallback: count from localStorage
    const users = JSON.parse(localStorage.getItem('mir_users')) || [];
    return users.filter(u => u.role === 'customer').length;
}

// ─── Seed Firestore with Default Products ──────────────────────────────────
// Adds missing default products to Firestore safely without duplicating existing ones.
export async function seedFirestoreProducts() {
    if (!isFirebaseAvailable) {
        localStorage.setItem('mir_products', JSON.stringify(DEFAULT_PRODUCTS));
        return { success: true, message: `Local database updated with all ${DEFAULT_PRODUCTS.length} products.` };
    }
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const existingTitles = new Set();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.title) existingTitles.add(data.title.toLowerCase().trim());
        });

        // Find products that aren't in Firestore yet
        const missingProducts = DEFAULT_PRODUCTS.filter(p => !existingTitles.has(p.title.toLowerCase().trim()));

        if (missingProducts.length === 0) {
            return { 
                success: true, 
                message: `Firestore already has all ${querySnapshot.size} products. Catalog is fully up to date.` 
            };
        }

        // Add missing products
        const promises = missingProducts.map(product => {
            const { id, ...productData } = product;
            return addDoc(collection(db, "products"), {
                ...productData,
                createdAt: new Date().toISOString()
            });
        });
        await Promise.all(promises);

        // Also sync localStorage cache
        localStorage.setItem('mir_products', JSON.stringify(DEFAULT_PRODUCTS));

        return { 
            success: true, 
            message: `Successfully seeded ${missingProducts.length} new products to Firestore! Total in catalog: ${existingTitles.size + missingProducts.length}.` 
        };
    } catch (error) {
        console.error("seedFirestoreProducts error:", error);
        return { success: false, message: error.message };
    }
}

// ─── Authentication Helpers ─────────────────────────────────────────────────
// Kept for backward compatibility — prefer waitForAuth() for initial load checks
export async function getActiveUser() {
    return await waitForAuth();
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

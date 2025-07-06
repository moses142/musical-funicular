// Shopping cart functionality with Firebase integration

let cart = [];
let cartCount = 0;
let totalAmount = 0;
let currentUser = null;

// Firebase Authentication State Listener
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAuthUI();
    if (user) {
        loadUserCart();
        loadUserOrders();
    } else {
        cart = [];
        updateCartDisplay();
        updateCartCount();
    }
});

// Bug 1: XSS Vulnerability - Direct innerHTML usage without sanitization
function addToCart(productId, productName, price) {
    // This creates an XSS vulnerability
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    updateCartCount();
    saveCartToFirestore();
    
    // Track analytics event
    analytics.logEvent('add_to_cart', {
        currency: 'KES',
        value: price,
        items: [{
            item_id: productId,
            item_name: productName,
            price: price,
            quantity: 1
        }]
    });
    
    // FIXED: Removed memory leak - use single console log instead of recurring interval
    console.log('Item added to cart at: ' + new Date());
}

// Bug 3: Logic error - String concatenation instead of addition for prices
function calculateTotal() {
    let total = 0;
    cart.forEach(item => {
        // This will cause string concatenation instead of addition
        total = total + item.price * item.quantity;
    });
    return total;
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        // FIXED: Use safe DOM manipulation instead of innerHTML
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name; // Safe: textContent prevents XSS
        
        const quantitySpan = document.createElement('span');
        quantitySpan.textContent = `Quantity: ${item.quantity}`;
        
        const priceSpan = document.createElement('span');
        priceSpan.textContent = `KSh ${item.price * item.quantity}`;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removeFromCart(item.id)); // Safe event binding
        
        cartItemDiv.appendChild(nameSpan);
        cartItemDiv.appendChild(quantitySpan);
        cartItemDiv.appendChild(priceSpan);
        cartItemDiv.appendChild(removeButton);
        
        cartItemsContainer.appendChild(cartItemDiv);
    });
    
    totalAmount = calculateTotal();
    document.getElementById('total-amount').textContent = totalAmount;
}

function updateCartCount() {
    cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    updateCartCount();
}

async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    if (!currentUser) {
        alert('Please login to complete your order');
        showAuth();
        return;
    }
    
    try {
        // Create order in Firestore
        const order = {
            userId: currentUser.uid,
            items: cart,
            total: totalAmount,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        };
        
        await db.collection('orders').add(order);
        
        // Clear cart from Firestore
        if (currentUser) {
            await db.collection('carts').doc(currentUser.uid).delete();
        }
        
        alert(`Order placed successfully! Total: KSh ${totalAmount}`);
        cart = [];
        updateCartDisplay();
        updateCartCount();
        
        // Track analytics event
        analytics.logEvent('purchase', {
            currency: 'KES',
            value: totalAmount
        });
        
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order. Please try again.');
    }
}

// FIXED: Proper one-time event listener setup
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners once during initialization
    const cartSection = document.getElementById('cart-section');
    const cartLink = document.querySelector('a[href="#cart"]');
    
    if (cartLink && cartSection) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Toggle cart visibility
            if (cartSection.style.display === 'none' || cartSection.style.display === '') {
                cartSection.style.display = 'block';
                document.getElementById('products').style.display = 'none';
            } else {
                cartSection.style.display = 'none';
                document.getElementById('products').style.display = 'block';
            }
        });
    }
    
    // Set up navigation for home/shoes links
    const homeLink = document.querySelector('a[href="#home"]');
    const shoesLink = document.querySelector('a[href="#shoes"]');
    
    if (homeLink) {
        homeLink.addEventListener('click', function(e) {
            e.preventDefault();
            showProducts();
        });
    }
    
    if (shoesLink) {
        shoesLink.addEventListener('click', function(e) {
            e.preventDefault();
            showProducts();
        });
    }
    
    // Set up authentication link
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAuth();
        });
    }
});

// FIXED: Added null safety checks
function showCart() {
    const cartSection = document.getElementById('cart-section');
    const productsSection = document.getElementById('products');
    
    if (cartSection) cartSection.style.display = 'block';
    if (productsSection) productsSection.style.display = 'none';
}

function showProducts() {
    const cartSection = document.getElementById('cart-section');
    const productsSection = document.getElementById('products');
    const authSection = document.getElementById('auth-section');
    
    if (cartSection) cartSection.style.display = 'none';
    if (authSection) authSection.style.display = 'none';
    if (productsSection) productsSection.style.display = 'block';
}

function showAuth() {
    const cartSection = document.getElementById('cart-section');
    const productsSection = document.getElementById('products');
    const authSection = document.getElementById('auth-section');
    
    if (cartSection) cartSection.style.display = 'none';
    if (productsSection) productsSection.style.display = 'none';
    if (authSection) authSection.style.display = 'block';
}

// Firebase Authentication Functions
async function signupUser() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    
    if (!email || !password || !name) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save user profile to Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Account created successfully!');
        showProducts();
        
    } catch (error) {
        console.error('Error creating account:', error);
        alert('Error creating account: ' + error.message);
    }
}

async function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('Logged in successfully!');
        showProducts();
        
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in: ' + error.message);
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        alert('Logged out successfully!');
        showProducts();
        
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out: ' + error.message);
    }
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('user-profile').style.display = 'none';
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('user-profile').style.display = 'none';
}

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (currentUser) {
        if (authLink) authLink.textContent = 'Profile';
        if (loginForm) loginForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        if (userName) userName.textContent = currentUser.displayName || 'User';
        if (userEmail) userEmail.textContent = currentUser.email;
    } else {
        if (authLink) authLink.textContent = 'Login';
        if (loginForm) loginForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
        if (userProfile) userProfile.style.display = 'none';
    }
}

// Cart persistence functions
async function saveCartToFirestore() {
    if (!currentUser) return;
    
    try {
        await db.collection('carts').doc(currentUser.uid).set({
            items: cart,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

async function loadUserCart() {
    if (!currentUser) return;
    
    try {
        const cartDoc = await db.collection('carts').doc(currentUser.uid).get();
        if (cartDoc.exists) {
            cart = cartDoc.data().items || [];
            updateCartDisplay();
            updateCartCount();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

async function loadUserOrders() {
    if (!currentUser) return;
    
    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const ordersContainer = document.getElementById('user-orders');
        if (!ordersContainer) return;
        
        ordersContainer.innerHTML = '';
        
        if (ordersSnapshot.empty) {
            ordersContainer.innerHTML = '<p>No orders yet</p>';
            return;
        }
        
        ordersSnapshot.forEach((doc) => {
            const order = doc.data();
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-item';
            orderDiv.innerHTML = `
                <h5>Order #${doc.id.substring(0, 8)}</h5>
                <p>Total: KSh ${order.total}</p>
                <p>Status: ${order.status}</p>
                <p>Items: ${order.items.length}</p>
            `;
            ordersContainer.appendChild(orderDiv);
        });
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}
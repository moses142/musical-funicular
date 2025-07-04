// Shopping cart functionality with intentional bugs

let cart = [];
let cartCount = 0;
let totalAmount = 0;

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

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Simulate checkout process
    alert(`Checkout successful! Total: KSh ${totalAmount}`);
    cart = [];
    updateCartDisplay();
    updateCartCount();
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
    
    if (cartSection) cartSection.style.display = 'none';
    if (productsSection) productsSection.style.display = 'block';
}
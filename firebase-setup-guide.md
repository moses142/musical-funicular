# Firebase Setup Guide for Mitumba Shoes E-commerce

## Overview
This guide will help you set up Firebase services for your Mitumba Shoes e-commerce website. The integration includes:

- **Firebase Authentication** - User login/signup
- **Cloud Firestore** - Database for products, orders, and cart storage
- **Firebase Hosting** - Deploy your website
- **Firebase Analytics** - Track user behavior

## Step 1: Configure Firebase Project

### 1.1 Access Your Firebase Project
Visit your Firebase Studio project: https://studio.firebase.google.com/studio-5721024722

### 1.2 Get Firebase Configuration
1. Go to your Firebase Console
2. Click on the gear icon (Project Settings)
3. Scroll down to "Your apps" section
4. Click "Add app" and select "Web" (</> icon)
5. Register your app with a nickname like "Mitumba Shoes"
6. Copy the Firebase configuration object

### 1.3 Update firebase-config.js
Replace the placeholder configuration in `firebase-config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-actual-measurement-id"
};
```

## Step 2: Enable Firebase Services

### 2.1 Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save changes

### 2.2 Enable Cloud Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. The security rules are already configured in `firestore.rules`

### 2.3 Enable Analytics (Optional)
1. In Firebase Console, go to "Analytics"
2. Click "Enable Google Analytics"
3. Choose or create a Google Analytics account
4. Complete the setup

## Step 3: Deploy Security Rules

### 3.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 3.2 Login to Firebase
```bash
firebase login
```

### 3.3 Initialize Firebase in Your Project
```bash
firebase init
```

Select:
- Firestore
- Hosting

Choose your Firebase project when prompted.

### 3.4 Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3.5 Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

## Step 4: Seed Initial Product Data

### 4.1 Add Products to Firestore
Use the Firebase Console to manually add products to the `products` collection:

```javascript
// Example product document
{
  id: "1",
  name: "Black Red Sports Shoes",
  price: 26000,
  originalPrice: 28000,
  image: "shoe1.jpg",
  category: "sports",
  description: "High-quality sports shoes for children",
  inStock: true,
  createdAt: firestore.FieldValue.serverTimestamp()
}
```

## Step 5: Testing the Integration

### 5.1 Test Authentication
1. Open your website
2. Click "Login" in the navigation
3. Try creating a new account
4. Test login/logout functionality

### 5.2 Test Shopping Cart
1. Add items to cart while logged in
2. Verify cart persists after page refresh
3. Test checkout process

### 5.3 Test Order History
1. Complete a purchase
2. Check the user profile to see order history
3. Verify orders are stored in Firestore

## Step 6: Production Considerations

### 6.1 Update Firestore Security Rules
For production, update `firestore.rules` to be more restrictive:

```javascript
// Add admin-only write access for products
match /products/{productId} {
  allow read: if true;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### 6.2 Environment Configuration
Create separate Firebase projects for development and production.

### 6.3 Enable Additional Security
1. Set up App Check for your project
2. Configure domain restrictions
3. Set up monitoring and alerts

## Features Included

### Authentication Features
- User registration with email/password
- User login/logout
- User profile management
- Authentication state persistence

### E-commerce Features
- Shopping cart with Firebase persistence
- Order creation and storage
- Order history for logged-in users
- Analytics tracking for purchases and cart events

### Database Structure
```
/users/{userId}
  - name: string
  - email: string
  - createdAt: timestamp

/products/{productId}
  - name: string
  - price: number
  - image: string
  - category: string
  - description: string
  - inStock: boolean

/orders/{orderId}
  - userId: string
  - items: array
  - total: number
  - status: string
  - createdAt: timestamp

/carts/{userId}
  - items: array
  - updatedAt: timestamp
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Make sure your domain is added to Firebase Auth authorized domains
2. **Permission Denied**: Check your Firestore security rules
3. **Analytics Not Working**: Verify measurementId is correct in config

### Debug Mode
Add this to your console to enable Firebase debug mode:
```javascript
firebase.firestore().enableNetwork();
```

## Support
For additional help, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com)
- Your Firebase project: https://studio.firebase.google.com/studio-5721024722
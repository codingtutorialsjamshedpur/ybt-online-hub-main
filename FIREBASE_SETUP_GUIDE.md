# Firebase Setup Guide for YBT Online Hub

This guide will help you set up all required Firebase services for your project.

## Prerequisites
- Firebase account
- Project ID: `ctjsr-c8be4`

## Step 1: Set up Firebase Storage

Before you can deploy your app, you need to initialize Firebase Storage:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`ctjsr-c8be4`)
3. In the left sidebar, click on "Storage"
4. Click "Get Started" to set up Firebase Storage
5. Choose a storage location (closest to your users)
6. Accept the default security rules (we've already created custom rules in `storage.rules`)

## Step 2: Deploy from Command Line

After setting up Firebase Storage, you can deploy your app:

```bash
# Build and deploy
node deploy.js
```

Or run these commands individually:

```bash
# Build the application
npm run build

# Deploy to Firebase
npx firebase deploy
```

## Step 3: Access Your Deployed App

Once deployment is successful, your app will be available at:

https://ctjsr-c8be4.web.app

## Troubleshooting

### Storage Setup Issues
- Make sure you've completed the Storage setup in the Firebase Console
- Verify that your storage.rules file is properly formatted

### Deployment Issues
- Check that you're using the correct Firebase project ID
- Make sure you have the latest Firebase CLI installed
- Try running `firebase login` to refresh your credentials

### Authentication Issues
- Make sure Email/Password authentication is enabled in the Firebase Console
- Navigate to Authentication > Sign-in method > Email/Password

## Firebase Resources Used in This Project

| Service | Purpose |
|---------|---------|
| Authentication | User login, registration, profile management |
| Firestore | Database for blogs, products, users, and other data |
| Storage | File storage for blog images, user avatars |
| Hosting | Web hosting for the application |

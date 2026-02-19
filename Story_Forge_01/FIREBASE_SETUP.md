# Firebase Integration Setup Guide

## Overview
Your StoryForge application is now connected to Firebase for authentication and database management. Follow these steps to complete the setup.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "StoryForge")
4. Follow the setup wizard (you can disable Google Analytics for now)
5. Wait for your project to be created

## Step 2: Enable Authentication

1. In the Firebase Console, go to your project
2. Click **Authentication** in the left sidebar
3. Click **Get Started**
4. Select **Email/Password** provider
5. Enable it and click **Save**

## Step 3: Create Firestore Database

1. In the Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
   - **Important**: For production, set up proper security rules
4. Choose your region and click **Create**

## Step 4: Get Your Firebase Config

1. In Firebase Console, click the gear icon (⚙️) at the top
2. Select **Project settings**
3. Scroll to **Your apps** section
4. Click on the web app (if you haven't created one, click "Add app" and select web)
5. Copy your Firebase config (it should look like this):

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

## Step 5: Configure Environment Variables

1. In your project root, create a `.env.local` file (copy from `.env.example`)
2. Fill in the Firebase config values:

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

3. Save the file (do NOT commit this to version control)

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try signing up with a test account at `/signup`
3. Check Firebase Console > Authentication to see your new user
4. Sign in with your created account

## Firebase Structure

### Users Collection
User profiles are stored in Firestore at `users/{uid}` with the following structure:

```javascript
{
  uid: "user-id",
  email: "user@example.com",
  name: "User Name",
  createdAt: "2024-02-17T10:30:00.000Z"
}
```

## Important Security Notes

### For Development (Current Setup)
Your Firestore is in **test mode** - anyone can read/write to your database. This is fine for development.

### For Production
Update your Firestore security rules:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /documents/{docId} {
      allow read, write: if request.auth.uid == resource.data.owner;
    }
  }
}
```

## Features Implemented

✅ **Firebase Authentication**
- Email/password signup
- Email/password signin
- Logout functionality
- User profile creation in Firestore

✅ **Protected Routes**
- Dashboard and Document pages require authentication
- Unauthenticated users redirected to signin

✅ **Auth Context**
- Global authentication state management
- Easy access via `useAuth()` hook

## Available Auth Functions

Use the `useAuth()` hook in any component:

```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { user, userProfile, signUp, signIn, logOut, loading, error } = useAuth();
  
  // user: Firebase User object or null
  // userProfile: User profile from Firestore
  // loading: boolean indicating auth state loading
  // error: string error message if any
};
```

## Next Steps

1. **Password Reset**: Implement password recovery feature
2. **Social Login**: Add Google/GitHub authentication
3. **User Profile**: Add user profile editing page
4. **Documents**: Create document collection and storage
5. **Real-time Updates**: Use Firestore listeners for real-time document updates

## Troubleshooting

### "Cannot find module '@firebase/...'"
- Run `npm install firebase` again
- Clear node_modules: `rm -rf node_modules && npm install`

### Environment variables not loading
- Make sure `.env.local` is in the project root (not in Story_Forge_01 subfolder)
- Restart the dev server after updating `.env.local`
- Variable names must start with `VITE_` for Vite to expose them

### "Too Many Requests" error
- Firebase rate-limits signup attempts. Wait a few minutes and try again.

### Users not appearing in Firebase Console
- Check that you're in the correct Firebase project
- Make sure Firestore Database is created (not just Realtime Database)
- Check browser console for JavaScript errors

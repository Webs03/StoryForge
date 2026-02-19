# Firebase Integration - Quick Start

## What's Been Set Up

✅ **Firebase Authentication** - Email/password signup and signin
✅ **Firestore Database** - Cloud storage for user data and documents
✅ **Auth Context** - Global state management for authentication
✅ **Protected Routes** - Dashboard and document pages require login
✅ **User Profiles** - Automatic user profile creation in Firestore
✅ **Document Management** - Hook for CRUD operations on documents

## Quick Start

### 1. Configure Firebase (Required)
- Follow the guide in `FIREBASE_SETUP.md`
- Add your Firebase credentials to `.env.local`

### 2. Run the App
```bash
npm run dev
```

### 3. Test Authentication
- Sign up at `/signup`
- Sign in at `/signin`
- Access `/dashboard` (protected route)

## Using Authentication in Components

```typescript
import { useAuth } from "@/contexts/AuthContext";

export const MyComponent = () => {
  const { user, userProfile, signUp, signIn, logOut, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {userProfile?.name}!</div>;
};
```

## Managing Documents

```typescript
import { useDocuments } from "@/hooks/use-documents";

export const DocumentsList = () => {
  const { documents, createDocument, updateDocument, deleteDocument, loading } = useDocuments();
  
  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <p>{doc.content}</p>
        </div>
      ))}
    </div>
  );
};
```

## File Structure

```
src/
├── lib/
│   └── firebase.ts              # Firebase configuration
├── contexts/
│   ├── AuthContext.tsx          # Auth provider and useAuth hook
│   └── index.ts                 # Convenient exports
├── components/
│   ├── ProtectedRoute.tsx       # Route guard for authenticated pages
│   └── ui/
│       └── spinner.tsx          # Loading indicator
├── hooks/
│   └── use-documents.ts         # Firestore document management
├── pages/
│   ├── SignUp.tsx               # Firebase signup
│   ├── SignIn.tsx               # Firebase signin
│   ├── Dashboard.tsx            # Protected route
│   └── ...
└── main.tsx                     # Wrapped with AuthProvider
```

## Environment Variables Needed

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

See `.env.example` for template.

## Next Steps

1. **Add logout button** - Use `logOut()` from `useAuth()`
2. **Password reset** - Implement forgot password feature
3. **User profile page** - Allow users to edit their profile
4. **Document creation** - Build document management UI
5. **Real-time sync** - Use Firestore listeners for live updates

## Troubleshooting

- **Auth not working?** Check `.env.local` has correct Firebase credentials
- **Firestore errors?** Ensure Firestore Database is created in Firebase Console
- **Routes not protected?** Verify `ProtectedRoute` wraps Dashboard routes

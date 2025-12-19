# Setup Instructions

## Firebase Configuration
1.  Create a project at [Firebase Console](https://console.firebase.google.com/).
2.  Enable **Authentication** (Email/Password).
3.  Enable **Firestore Database**.
4.  Enable **Storage**.
5.  Go to Project Settings > General > Your apps > Add App > Web.
6.  Copy the `firebaseConfig` keys.
7.  Create a file named `.env.local` in the root directory.
8.  Add the following keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Running the App
```bash
npm run dev
```

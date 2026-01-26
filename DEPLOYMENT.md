# Horizon - Deployment Guide

## 🚀 Deployment Status

The Horizon app is configured for automatic deployment to Firebase Hosting.

### Firebase Project
- **Project ID**: `horizon-9d594`
- **Hosting URL**: `https://horizon-9d594.web.app`

---

## 📦 Automatic Deployment (GitHub Actions)

Every push to the `main` branch triggers an automatic build and deployment workflow.

### Required GitHub Secrets

To enable automatic deployment, add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

#### Firebase Configuration
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### OpenAI Configuration
- `VITE_OPENAI_API_KEY`

#### Firebase Service Account
- `FIREBASE_SERVICE_ACCOUNT` - JSON key for Firebase deployment

---

## 🔧 Manual Deployment

If you prefer to deploy manually:

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Build the app
```bash
npm run build
```

### 4. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

---

## 🔑 Getting Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`horizon-9d594`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the entire JSON content
6. Add it as `FIREBASE_SERVICE_ACCOUNT` secret in GitHub

---

## 📝 Environment Variables

Create a `.env` file in the project root (already gitignored):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=horizon-9d594.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=horizon-9d594
VITE_FIREBASE_STORAGE_BUCKET=horizon-9d594.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=your_openai_key
```

---

## ✅ Verification

After deployment, verify the app is working:

1. Visit `https://horizon-9d594.web.app`
2. Test authentication (sign up / login)
3. Test Smart Scan feature (upload receipt)
4. Test manual entry
5. Verify dashboard displays correctly

---

## 🐛 Troubleshooting

### Build fails in GitHub Actions
- Check that all required secrets are set
- Verify the secret values are correct (no extra spaces)

### Firebase deployment fails
- Ensure `FIREBASE_SERVICE_ACCOUNT` secret contains valid JSON
- Verify the service account has "Firebase Hosting Admin" role

### App loads but features don't work
- Check browser console for errors
- Verify Firebase configuration in `.env` matches your project
- Ensure Firestore and Authentication are enabled in Firebase Console

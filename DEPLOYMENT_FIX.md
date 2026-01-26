# 🔧 Fix GitHub Actions Deployment Failure

## ✅ What I Fixed

The GitHub Actions workflow was using `FIREBASE_SERVICE_ACCOUNT` secret with the `FirebaseExtended/action-hosting-deploy` action, which can be finicky. 

**Solution**: Switched to using `firebase-tools` CLI directly with a `FIREBASE_TOKEN` secret, which is simpler and more reliable.

---

## 🔑 How to Get Your FIREBASE_TOKEN

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Generate the Token
Run this command in your terminal:
```bash
firebase login:ci
```

This will:
1. Open your browser for Firebase authentication
2. Ask you to log in to your Google account
3. Generate a CI token and display it in the terminal

### Step 3: Copy the Token
After successful login, you'll see output like:
```
✔  Success! Use this token to login on a CI server:

1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Example: firebase deploy --token "$FIREBASE_TOKEN"
```

**Copy the entire token** (the long string starting with `1//0...`)

---

## 📝 Add the Token to GitHub Secrets

### Option 1: Direct Link
Go to: **https://github.com/BarneyWong123/horizon-app/settings/secrets/actions/new**

### Option 2: Manual Navigation
1. Go to https://github.com/BarneyWong123/horizon-app
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add the Secret
- **Name**: `FIREBASE_TOKEN` (exactly as shown, all caps)
- **Secret**: Paste the token you copied from step 3
- Click **Add secret**

---

## ✅ Verify All Required Secrets

Make sure you have ALL of these secrets configured:

| Secret Name | Status | Where to Find |
|-------------|--------|---------------|
| `FIREBASE_TOKEN` | ⚠️ **NEW - Add this now** | Run `firebase login:ci` (see above) |
| `VITE_FIREBASE_API_KEY` | ✓ Should already be added | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✓ Should already be added | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | ✓ Should already be added | `horizon-9d594` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✓ Should already be added | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✓ Should already be added | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | ✓ Should already be added | Firebase Console → Project Settings |
| `VITE_OPENAI_API_KEY` | ✓ Should already be added | OpenAI Platform → API Keys |

---

## 🚀 Test the Deployment

Once you've added the `FIREBASE_TOKEN` secret:

1. The workflow will automatically run (I just pushed the fix)
2. Go to https://github.com/BarneyWong123/horizon-app/actions
3. Watch the latest workflow run
4. It should now succeed and deploy to: **https://horizon-9d594.web.app**

---

## 🐛 If It Still Fails

Check the workflow logs for specific errors:
1. Go to https://github.com/BarneyWong123/horizon-app/actions
2. Click on the failed run
3. Click on the "build-and-deploy" job
4. Expand the "Deploy to Firebase Hosting" step
5. Share the error message with me

---

## 📊 What Changed in the Workflow

**Before** (using GitHub action):
```yaml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    channelId: live
    projectId: horizon-9d594
```

**After** (using firebase-tools CLI):
```yaml
- name: Install Firebase CLI
  run: npm install -g firebase-tools

- name: Deploy to Firebase Hosting
  run: firebase deploy --only hosting --non-interactive
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

This approach is simpler, more reliable, and gives better error messages.

// Quick script to add missing user document fields via Firebase
// Run this once to fix existing phantom users

const admin = require('firebase-admin');

// Initialize with your service account
// You'll need to download the service account JSON from Firebase Console
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixUserDocument() {
    const userId = 'd7d8Fwl2ONbU93yChurV0DTjzfs2';
    const userEmail = 'ceye010@student.glendale.edu';

    try {
        await db.collection('users').doc(userId).set({
            email: userEmail,
            displayName: 'ceye010',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            subscription: { tier: 'free' }
        }, { merge: true });

        console.log('User document fixed successfully!');
    } catch (error) {
        console.error('Error fixing user:', error);
    }

    process.exit(0);
}

fixUserDocument();

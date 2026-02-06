// Quick script to add missing user document fields via Firebase
// Run this once to fix existing phantom users

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let admin;
try {
    const module = await import('firebase-admin');
    admin = module.default || module;
} catch (e) {
    console.warn("firebase-admin not found. This is fine if running tests with mocks.");
}

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Main execution check
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
    if (!admin) {
        console.error("firebase-admin is required to run this script.");
        process.exit(1);
    }

    if (!fs.existsSync(serviceAccountPath)) {
        console.error('Error: serviceAccountKey.json not found in scripts directory.');
        console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts');
        console.error('Save it as scripts/serviceAccountKey.json');
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const auth = admin.auth();

    fixPhantomUsers(db, auth, admin)
        .then(() => {
            console.log('Script completed successfully.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

export async function fixPhantomUsers(db, auth, adminInstance) {
    console.log('Starting phantom user fix...');

    let nextPageToken;
    let totalFixed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalProcessed = 0;

    // Process in batches
    try {
        do {
            const result = await auth.listUsers(1000, nextPageToken);
            const users = result.users;
            nextPageToken = result.pageToken;

            console.log(`Processing batch of ${users.length} users...`);

            for (const user of users) {
                totalProcessed++;
                try {
                    const userRef = db.collection('users').doc(user.uid);
                    const docSnapshot = await userRef.get();

                    const createdAt = user.metadata.creationTime
                        ? new Date(user.metadata.creationTime)
                        : adminInstance.firestore.FieldValue.serverTimestamp();

                    const defaults = {
                        email: user.email || null,
                        displayName: user.displayName || null,
                        createdAt: createdAt,
                        subscription: { tier: 'free' }
                    };

                    if (!docSnapshot.exists) {
                        console.log(`Fixing phantom user (missing doc): ${user.email} (${user.uid})`);
                        await userRef.set(defaults);
                        totalFixed++;
                    } else {
                        const data = docSnapshot.data();
                        const updates = {};

                        if (!data.email && user.email) updates.email = user.email;
                        if (!data.displayName && user.displayName) updates.displayName = user.displayName;
                        // Ensure subscription exists
                        if (!data.subscription) updates.subscription = { tier: 'free' };
                        // Ensure createdAt exists
                        if (!data.createdAt) updates.createdAt = createdAt;

                        if (Object.keys(updates).length > 0) {
                            console.log(`Updating user fields for: ${user.email} (${user.uid})`, updates);
                            await userRef.set(updates, { merge: true });
                            totalUpdated++;
                        } else {
                            totalSkipped++;
                        }
                    }
                } catch (err) {
                    console.error(`Error processing user ${user.uid}:`, err);
                }
            }

        } while (nextPageToken);
    } catch (error) {
        console.error("Error fetching users from Auth:", error);
        throw error;
    }

    console.log('Summary:');
    console.log(`- Total Processed: ${totalProcessed}`);
    console.log(`- Fixed (created doc): ${totalFixed}`);
    console.log(`- Updated (missing fields): ${totalUpdated}`);
    console.log(`- Skipped (already correct): ${totalSkipped}`);
}

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    getDocs,
    setDoc,
    getDoc
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";
import { auth, db, storage } from "../config/firebase";
import { getLocalISODate } from "../utils/dateUtils";

const googleProvider = new GoogleAuthProvider();

export const FirebaseService = {
    // Auth Operations
    async login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    },

    async signUp(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    },

    async loginWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    },

    async logout() {
        return signOut(auth);
    },

    subscribeToAuthChanges(callback) {
        return onAuthStateChanged(auth, callback);
    },

    // Transaction Operations
    async addTransaction(uid, transactionData) {
        const transactionsRef = collection(db, "users", uid, "transactions");
        return addDoc(transactionsRef, {
            ...transactionData,
            createdAt: serverTimestamp(),
            date: transactionData.date || getLocalISODate()
        });
    },

    async updateTransaction(uid, transactionId, data) {
        const transactionRef = doc(db, "users", uid, "transactions", transactionId);
        return updateDoc(transactionRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteTransaction(uid, transactionId) {
        const transactionRef = doc(db, "users", uid, "transactions", transactionId);
        return deleteDoc(transactionRef);
    },

    subscribeToTransactions(uid, callback, accountId = null) {
        const transactionsRef = collection(db, "users", uid, "transactions");
        let q = query(transactionsRef, orderBy("createdAt", "desc"));

        // Note: Firestore requires composite index for filtering + ordering
        // For now, we filter client-side if accountId is provided

        return onSnapshot(q, (snapshot) => {
            let transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (accountId) {
                transactions = transactions.filter(t => t.accountId === accountId);
            }

            callback(transactions);
        });
    },

    // Account Operations
    async addAccount(uid, accountData) {
        const accountsRef = collection(db, "users", uid, "accounts");
        return addDoc(accountsRef, {
            ...accountData,
            createdAt: serverTimestamp()
        });
    },

    async updateAccount(uid, accountId, data) {
        const accountRef = doc(db, "users", uid, "accounts", accountId);
        return updateDoc(accountRef, data);
    },

    async deleteAccount(uid, accountId) {
        const accountRef = doc(db, "users", uid, "accounts", accountId);
        return deleteDoc(accountRef);
    },

    subscribeToAccounts(uid, callback) {
        const accountsRef = collection(db, "users", uid, "accounts");
        const q = query(accountsRef, orderBy("createdAt", "asc"));

        return onSnapshot(q, (snapshot) => {
            const accounts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(accounts);
        });
    },

    async initializeDefaultAccount(uid, userEmail = null, displayName = null) {
        // CRITICAL: Ensure user document exists BEFORE creating subcollections
        // This prevents "phantom" documents that don't appear in queries
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: userEmail || null,
                displayName: displayName || null,
                createdAt: serverTimestamp(),
                subscription: { tier: 'free' }
            }, { merge: true });
        }

        // Now safe to create subcollection
        const accountsRef = collection(db, "users", uid, "accounts");
        const snapshot = await getDocs(accountsRef);

        if (snapshot.empty) {
            return addDoc(accountsRef, {
                name: "Cash",
                type: "cash",
                balance: 0,
                currency: "USD",
                icon: "Wallet",
                color: "#10b981",
                createdAt: serverTimestamp()
            });
        }
        return null;
    },

    // Category Operations
    async addCategory(uid, categoryData) {
        const categoriesRef = collection(db, "users", uid, "categories");
        // If an ID is provided (like from defaults), try to use it as document ID or just store it
        // Ideally defaults should have unique IDs. Let's cleaner just let Firestore generate IDs 
        // OR use the 'id' field from defaults as the actual ID? 
        // Using 'id' field is safer for migration but Firestore auto-ID is cleaner.
        // Let's store the 'id' field as 'slug' or just 'id' inside the data, and let doc ID be auto.

        return addDoc(categoriesRef, {
            ...categoryData,
            createdAt: serverTimestamp()
        });
    },

    async updateCategory(uid, categoryId, data) {
        const categoryRef = doc(db, "users", uid, "categories", categoryId);
        return updateDoc(categoryRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteCategory(uid, categoryId) {
        const categoryRef = doc(db, "users", uid, "categories", categoryId);
        return deleteDoc(categoryRef);
    },

    subscribeToCategories(uid, callback) {
        const categoriesRef = collection(db, "users", uid, "categories");
        const q = query(categoriesRef, orderBy("createdAt", "asc"));

        return onSnapshot(q, (snapshot) => {
            const categories = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    docId: doc.id, // Actual Firestore ID
                    id: data.id || doc.id // Use internal ID if present (migration), else doc ID
                };
            });
            callback(categories);
        });
    },

    // Chat Operations
    async addChatMessage(uid, message) {
        const chatsRef = collection(db, "users", uid, "chats");
        return addDoc(chatsRef, {
            ...message,
            createdAt: serverTimestamp()
        });
    },

    subscribeToChat(uid, callback) {
        const chatsRef = collection(db, "users", uid, "chats");
        const q = query(chatsRef, orderBy("createdAt", "asc"));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(messages);
        });
    },

    async clearChatHistory(uid) {
        const chatsRef = collection(db, "users", uid, "chats");
        const snapshot = await getDocs(chatsRef);
        const batchPromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(batchPromises);
    },

    async deleteUserData(uid) {
        // Helper to delete all docs in a collection
        const deleteCollection = async (collName) => {
            const ref = collection(db, "users", uid, collName);
            const snapshot = await getDocs(ref);
            const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(promises);
        };

        await Promise.all([
            deleteCollection("transactions"),
            deleteCollection("accounts"),
            deleteCollection("categories"),
            deleteCollection("chats"),
            deleteCollection("settings")
        ]);
    },

    // Branding & Settings
    async uploadLogo(uid, file) {
        const logoRef = ref(storage, `users/${uid}/branding/logo`);
        await uploadBytes(logoRef, file);
        return getDownloadURL(logoRef);
    },

    async updateBranding(uid, brandingData) {
        const brandingRef = doc(db, "users", uid, "settings", "branding");
        return setDoc(brandingRef, {
            ...brandingData,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    subscribeToBranding(uid, callback) {
        const brandingRef = doc(db, "users", uid, "settings", "branding");
        return onSnapshot(brandingRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    },

    async updatePreferences(uid, prefs) {
        const prefsRef = doc(db, "users", uid, "settings", "preferences");
        return setDoc(prefsRef, {
            ...prefs,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    subscribeToPreferences(uid, callback) {
        const prefsRef = doc(db, "users", uid, "settings", "preferences");
        return onSnapshot(prefsRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    },

    subscribeToUserSettings(uid, callback) {
        const userRef = doc(db, "users", uid);
        return onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    },

    async updateProfile(uid, profileData) {
        const profileRef = doc(db, "users", uid, "settings", "profile");
        return setDoc(profileRef, {
            ...profileData,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    subscribeToProfile(uid, callback) {
        const profileRef = doc(db, "users", uid, "settings", "profile");
        return onSnapshot(profileRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    },

    // Admin Operations
    async getAllUsers() {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users = [];

        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();
            users.push({
                uid: userDoc.id,
                email: userData.email || null,
                displayName: userData.displayName || null,
                subscription: userData.subscription || { tier: 'free' },
                createdAt: userData.createdAt || null,
                profile: userData.profile || null
            });
        }

        return users;
    },

    async updateUserTier(targetUid, tier) {
        const userRef = doc(db, "users", targetUid);
        return setDoc(userRef, {
            subscription: {
                tier: tier,
                updatedAt: serverTimestamp()
            }
        }, { merge: true });
    },

    async initializeUserDocument(uid, userData) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return setDoc(userRef, {
                email: userData.email || null,
                displayName: userData.displayName || null,
                createdAt: serverTimestamp(),
                subscription: { tier: 'free' }
            }, { merge: true });
        }
        return null;
    }
};


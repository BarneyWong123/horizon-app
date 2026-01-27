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
    onSnapshot,
    serverTimestamp,
    getDocs,
    limit,
    orderBy
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

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
            date: transactionData.date || new Date().toISOString()
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

    subscribeToTransactions(uid, callback, options = {}) {
        const { accountId, limit: limitCount } = options;
        const transactionsRef = collection(db, "users", uid, "transactions");

        // Use server-side sorting on 'createdAt' (single field index exists by default)
        // This ensures compatibility with mobile apps that might not set the 'date' field.
        const constraints = [orderBy("createdAt", "desc")];

        if (limitCount) {
            constraints.push(limit(limitCount));
        }

        const q = query(transactionsRef, ...constraints);

        return onSnapshot(q, (snapshot) => {
            let transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (accountId) {
                transactions = transactions.filter(t => t.accountId === accountId);
            }

            callback(transactions);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            callback([]); // Return empty list on error to stop loading state
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
        const q = query(accountsRef);

        return onSnapshot(q, (snapshot) => {
            const accounts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort
            try {
                accounts.sort((a, b) => {
                    const getTime = (t) => {
                        // Handle pending writes (null createdAt) by treating them as 'now'
                        if (t.createdAt === null) {
                            return Date.now();
                        }
                        if (t.createdAt && typeof t.createdAt.toMillis === 'function') {
                            return t.createdAt.toMillis();
                        }
                        return 0;
                    };
                    return getTime(a) - getTime(b);
                });
            } catch (e) {
                console.error("Error sorting accounts:", e);
            }

            callback(accounts);
        }, (error) => {
            console.error("Error fetching accounts:", error);
            callback([]);
        });
    },

    async initializeDefaultAccount(uid) {
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
    }
};


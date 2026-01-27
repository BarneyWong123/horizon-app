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
    runTransaction
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
        // If no account specified, just add the transaction
        if (!transactionData.accountId) {
            const transactionsRef = collection(db, "users", uid, "transactions");
            return addDoc(transactionsRef, {
                ...transactionData,
                createdAt: serverTimestamp(),
                date: transactionData.date || new Date().toISOString()
            });
        }

        return runTransaction(db, async (transaction) => {
            const accountRef = doc(db, "users", uid, "accounts", transactionData.accountId);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) {
                throw new Error("Account does not exist!");
            }

            const newBalance = (accountDoc.data().balance || 0) + (transactionData.type === 'income' ? transactionData.total : -transactionData.total);

            // Add transaction
            const transactionsRef = collection(db, "users", uid, "transactions");
            const newTransactionRef = doc(transactionsRef); // Generate ID
            transaction.set(newTransactionRef, {
                ...transactionData,
                createdAt: serverTimestamp(),
                date: transactionData.date || new Date().toISOString()
            });

            // Update account balance
            transaction.update(accountRef, { balance: newBalance });
        });
    },

    async updateTransaction(uid, transactionId, newData) {
        const transactionRef = doc(db, "users", uid, "transactions", transactionId);

        return runTransaction(db, async (transaction) => {
            const transactionDoc = await transaction.get(transactionRef);
            if (!transactionDoc.exists()) {
                throw new Error("Transaction does not exist!");
            }

            const oldData = transactionDoc.data();
            const accountId = oldData.accountId;

            // Update the transaction
            transaction.update(transactionRef, {
                ...newData,
                updatedAt: serverTimestamp()
            });

            // If account is involved, update balance
            if (accountId) {
                const accountRef = doc(db, "users", uid, "accounts", accountId);
                const accountDoc = await transaction.get(accountRef);

                if (accountDoc.exists()) {
                    let balanceChange = 0;

                    // Revert old transaction effect
                    if (oldData.type === 'income') {
                        balanceChange -= oldData.total;
                    } else {
                        balanceChange += oldData.total;
                    }

                    // Apply new transaction effect (use newData if present, else oldData)
                    const newType = newData.type || oldData.type;
                    const newTotal = newData.total !== undefined ? newData.total : oldData.total;

                    if (newType === 'income') {
                        balanceChange += newTotal;
                    } else {
                        balanceChange -= newTotal;
                    }

                    const newBalance = (accountDoc.data().balance || 0) + balanceChange;
                    transaction.update(accountRef, { balance: newBalance });
                }
            }
        });
    },

    async deleteTransaction(uid, transactionId) {
        const transactionRef = doc(db, "users", uid, "transactions", transactionId);

        return runTransaction(db, async (transaction) => {
            const transactionDoc = await transaction.get(transactionRef);
            if (!transactionDoc.exists()) {
                throw new Error("Transaction does not exist!");
            }

            const transactionData = transactionDoc.data();
            const accountId = transactionData.accountId;

            // Delete transaction
            transaction.delete(transactionRef);

            // Update account balance if applicable
            if (accountId) {
                const accountRef = doc(db, "users", uid, "accounts", accountId);
                const accountDoc = await transaction.get(accountRef);

                if (accountDoc.exists()) {
                    const currentBalance = accountDoc.data().balance || 0;
                    const newBalance = currentBalance + (transactionData.type === 'income' ? -transactionData.total : transactionData.total);
                    transaction.update(accountRef, { balance: newBalance });
                }
            }
        });
    },

    subscribeToTransactions(uid, callback, options = {}) {
        const { accountId, limit: limitCount } = options;
        const transactionsRef = collection(db, "users", uid, "transactions");

        // Remove server-side ordering to ensure we get ALL documents,
        // even those missing 'createdAt' or 'date' fields (e.g. from mobile).
        const constraints = [];

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

            // Client-side sort: robust handling for missing/different timestamp fields
            transactions.sort((a, b) => {
                const getDate = (t) => {
                    if (t.createdAt && typeof t.createdAt.toMillis === 'function') return t.createdAt.toMillis();
                    if (t.date) return new Date(t.date).getTime();
                    if (t.timestamp && typeof t.timestamp.toMillis === 'function') return t.timestamp.toMillis();
                    return 0; // Fallback for missing dates
                };
                return getDate(b) - getDate(a); // Descending
            });

            callback(transactions);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            callback([]);
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


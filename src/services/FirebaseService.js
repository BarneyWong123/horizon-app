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
    getDocs
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


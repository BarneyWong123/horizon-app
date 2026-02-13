import { performance } from 'perf_hooks';

// Mock Data
const DOC_COUNT = 1200;
const SIMULATED_LATENCY_MS = 50;
const BATCH_LATENCY_MS = 100;
const CONCURRENCY_LIMIT = 10; // Browser limit simulation

// Mock Firestore structures
const db = {};
const collection = (db, ...path) => ({ path });
const doc = (ref) => ({ id: 'mock-id', ref });

const createMockDocs = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `doc-${i}`,
        ref: { id: `doc-${i}`, path: `users/uid/chats/doc-${i}` },
        data: () => ({ message: 'test' })
    }));
};

const mockDocs = createMockDocs(DOC_COUNT);

// Mock getDocs
const getDocs = async (ref) => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return {
        docs: mockDocs,
        empty: mockDocs.length === 0,
        size: mockDocs.length
    };
};

// Semaphore for concurrency simulation
class Semaphore {
    constructor(max) {
        this.max = max;
        this.count = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.count < this.max) {
            this.count++;
            return;
        }
        await new Promise(resolve => this.queue.push(resolve));
    }

    release() {
        this.count--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.count++;
            next();
        }
    }
}

const semaphore = new Semaphore(CONCURRENCY_LIMIT);

// Mock deleteDoc with concurrency limit simulation
const deleteDoc = async (ref) => {
    await semaphore.acquire();
    try {
        await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));
    } finally {
        semaphore.release();
    }
};

// Mock writeBatch
const writeBatch = (db) => {
    let operations = 0;
    return {
        delete: (ref) => { operations++; },
        commit: async () => {
             // Simulate batch commit latency
             await new Promise(resolve => setTimeout(resolve, BATCH_LATENCY_MS));
             return operations;
        }
    };
};

// --- Implementations ---

// 1. Current Implementation (N+1 Writes)
async function clearChatHistoryOriginal(uid) {
    console.log(`[Original] Starting clearChatHistory for ${DOC_COUNT} docs...`);
    const start = performance.now();

    // Simulate getDocs
    const snapshot = await getDocs(collection(db, "users", uid, "chats"));

    // Simulate N deleteDoc calls
    const batchPromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(batchPromises);

    const end = performance.now();
    console.log(`[Original] Finished in ${(end - start).toFixed(2)}ms`);
    return end - start;
}

// 2. Optimized Implementation (Batch Write)
async function clearChatHistoryOptimized(uid) {
    console.log(`[Optimized] Starting clearChatHistory for ${DOC_COUNT} docs...`);
    const start = performance.now();

    const snapshot = await getDocs(collection(db, "users", uid, "chats"));

    if (snapshot.empty) return;

    // Process in chunks of 500 (Firestore batch limit)
    const CHUNK_SIZE = 500;
    const chunks = [];

    for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
        chunks.push(snapshot.docs.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }

    const end = performance.now();
    console.log(`[Optimized] Finished in ${(end - start).toFixed(2)}ms`);
    return end - start;
}

// --- Run Benchmark ---

async function runBenchmark() {
    console.log("Starting Benchmark...\n");

    const originalTime = await clearChatHistoryOriginal("user-123");
    console.log("-".repeat(20));
    const optimizedTime = await clearChatHistoryOptimized("user-123");

    console.log("\nResults:");
    console.log(`Original Time: ${originalTime.toFixed(2)}ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(originalTime / optimizedTime).toFixed(2)}x`);
}

runBenchmark();

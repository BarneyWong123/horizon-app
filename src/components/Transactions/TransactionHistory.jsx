import React, { useState, useEffect } from 'react';
import { FirebaseService } from '../../services/FirebaseService';
import TransactionList from '../Dashboard/TransactionList';
import TransactionEditModal from '../Dashboard/TransactionEditModal';
import { generateCSV } from '../../utils/exportUtils';
import { useCategory } from '../../context/CategoryContext';
import { Download } from 'lucide-react';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../data/categories';

const TransactionHistory = ({ user }) => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState(null);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const { categories } = useCategory();
    const [accounts, setAccounts] = useState([]); // Need accounts for export names

    useEffect(() => {
        const unsubTx = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        });

        // Also fetch accounts for export context
        const unsubAcc = FirebaseService.subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
        });

        return () => {
            unsubTx();
            unsubAcc();
        };
    }, [user.uid]);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = !searchQuery ||
            t.merchant?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-4 px-4 md:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white">All Transactions</h1>
                        <p className="text-sm text-slate-500">{transactions.length} total</p>
                    </div>
                </div>
                <button
                    onClick={() => generateCSV(transactions, categories, accounts)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 hover:border-emerald-500/50"
                    title="Export as CSV"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Export CSV</span>
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={filterCategory || ''}
                    onChange={(e) => setFilterCategory(e.target.value || null)}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Transaction List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="animate-pulse p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-slate-800 rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <TransactionList
                        transactions={filteredTransactions}
                        onEdit={(t) => setEditingTransaction(t)}
                    />
                )}
            </div>

            {/* Edit Modal */}
            <TransactionEditModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                user={user}
                transaction={editingTransaction}
                accounts={accounts}
            />
        </div>
    );
};

export default TransactionHistory;

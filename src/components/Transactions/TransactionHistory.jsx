import React, { useState, useEffect } from 'react';
import { FirebaseService } from '../../services/FirebaseService';
import TransactionList from '../Dashboard/TransactionList';
import TransactionEditModal from '../Dashboard/TransactionEditModal';
import { generateCSV } from '../../utils/exportUtils';
import { useCategory } from '../../context/CategoryContext';
import { Search, Filter, ArrowLeft, X, ArrowUp, ArrowDown, Calendar, Wallet, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../data/categories';
import { useCurrency } from '../../context/CurrencyContext';

const TransactionHistory = ({ user }) => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState(null);
    const [filterAccount, setFilterAccount] = useState(null);
    const [filterDateRange, setFilterDateRange] = useState('all'); // today, week, month, year, custom, all
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [sortField, setSortField] = useState('date'); // date, amount
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const { categories } = useCategory();
    const { convert, formatAmount } = useCurrency();
    const [accounts, setAccounts] = useState([]);

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
        // Search filter
        const matchesSearch = !searchQuery ||
            t.merchant?.toLowerCase().includes(searchQuery.toLowerCase());

        // Category filter
        const matchesCategory = !filterCategory || t.category === filterCategory;

        // Account filter
        const matchesAccount = !filterAccount || t.accountId === filterAccount;

        // Date filter
        const txDate = new Date(t.date);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let matchesDate = true;
        if (filterDateRange === 'today') matchesDate = txDate >= startOfDay;
        else if (filterDateRange === 'week') matchesDate = txDate >= startOfWeek;
        else if (filterDateRange === 'month') matchesDate = txDate >= startOfMonth;
        else if (filterDateRange === 'year') matchesDate = txDate >= startOfYear;
        else if (filterDateRange === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = txDate >= start && txDate <= end;
        }

        return matchesSearch && matchesCategory && matchesAccount && matchesDate;
    }).sort((a, b) => {
        let valA, valB;
        if (sortField === 'date') {
            valA = new Date(a.date).getTime();
            valB = new Date(b.date).getTime();
        } else {
            // Normalize to USD for accurate sorting
            valA = convert(a.total || 0, a.currency || 'USD', 'USD');
            valB = convert(b.total || 0, b.currency || 'USD', 'USD');
        }

        return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    const clearFilters = () => {
        setSearchQuery('');
        setFilterCategory(null);
        setFilterAccount(null);
        setFilterDateRange('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setSortField('date');
        setSortOrder('desc');
    };

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
                    onClick={() => generateCSV(filteredTransactions, categories, accounts)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 hover:border-emerald-500/50"
                    title="Export as CSV"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Export CSV</span>
                </button>
            </div>

            {/* Search, Filter Toggle & Clear */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[280px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by merchant or category..."
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3.5 pl-11 pr-4 text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl transition-all ${showFilters || filterCategory || filterAccount || filterDateRange !== 'all'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}
                        title="Filter"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className={`p-2.5 rounded-xl transition-all ${sortField !== 'date' || sortOrder !== 'desc'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}
                        title={`Sort: ${sortField === 'date' ? 'Date' : 'Amount'} (${sortOrder === 'asc' ? 'Oldest/Lowest' : 'Newest/Highest'})`}
                    >
                        {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                    {(searchQuery || filterCategory || filterAccount || filterDateRange !== 'all' || sortField !== 'date' || sortOrder !== 'desc') && (
                        <button
                            onClick={clearFilters}
                            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all"
                            title="Clear all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-800/30 border border-slate-700/50 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                value={filterCategory || ''}
                                onChange={(e) => setFilterCategory(e.target.value || null)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Account */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                value={filterAccount || ''}
                                onChange={(e) => setFilterAccount(e.target.value || null)}
                            >
                                <option value="">All Accounts</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date Range</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                value={filterDateRange}
                                onChange={(e) => setFilterDateRange(e.target.value)}
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sort By</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                    value={sortField}
                                    onChange={(e) => setSortField(e.target.value)}
                                >
                                    <option value="date">Date</option>
                                    <option value="amount">Amount</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 hover:text-white"
                                >
                                    {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Custom Date Inputs */}
                        {filterDateRange === 'custom' && (
                            <div className="col-span-full grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">From</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">To</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
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

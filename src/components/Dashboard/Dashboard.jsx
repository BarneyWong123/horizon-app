import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseService } from '../../services/FirebaseService';
import SpendingChart from './SpendingChart';
import TransactionList from './TransactionList';
import AccountCard from './AccountCard';
import FloatingActionButton from './FloatingActionButton';
import QuickAddModal from './QuickAddModal';
import TransactionEditModal from './TransactionEditModal';
import { Wallet, TrendingDown, Calendar, ChevronRight, Filter, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useCurrency } from '../../context/CurrencyContext';

const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    const { formatAmount } = useCurrency();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // New filter states
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [timePeriod, setTimePeriod] = useState('month'); // 'month' | 'year' | 'all'
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);

    useEffect(() => {
        // Initialize default account if none exists
        FirebaseService.initializeDefaultAccount(user.uid);

        const unsubTransactions = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        }, selectedAccountId);

        const unsubAccounts = FirebaseService.subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
            // Also set loading to false when accounts arrive (handles empty transactions case)
            setLoading(false);
        });

        return () => {
            unsubTransactions();
            unsubAccounts();
        };
    }, [user.uid, selectedAccountId]);

    // Filter transactions by category and time period
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return transactions.filter(t => {
            // Category filter
            if (selectedCategory && t.category !== selectedCategory) return false;

            // Time period filter
            if (timePeriod !== 'all') {
                const txDate = new Date(t.date);
                if (timePeriod === 'month' && txDate < startOfMonth) return false;
                if (timePeriod === 'year' && txDate < startOfYear) return false;
            }

            return true;
        });
    }, [transactions, selectedCategory, timePeriod]);

    const stats = useMemo(() => {
        const totalSpent = filteredTransactions.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const dayOfMonth = new Date().getDate() || 1;
        const dailyRate = totalSpent / dayOfMonth;

        // Calculate days until zero (if user has balance)
        const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
        const daysUntilZero = dailyRate > 0 ? Math.floor(totalBalance / dailyRate) : Infinity;

        // Category breakdown
        const categoryTotals = filteredTransactions.reduce((acc, t) => {
            const cat = t.category || 'other';
            acc[cat] = (acc[cat] || 0) + (t.total || 0);
            return acc;
        }, {});

        return { totalSpent, dailyRate, totalBalance, daysUntilZero, categoryTotals };
    }, [filteredTransactions, accounts]);

    const selectedCategoryData = selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory) : null;
    const CategoryIcon = selectedCategoryData ? (LucideIcons[selectedCategoryData.icon] || LucideIcons.CircleDot) : null;

    if (loading) {
        return (
            <div className="animate-pulse space-y-6 p-4">
                <div className="h-24 bg-slate-900 rounded-xl"></div>
                <div className="h-48 bg-slate-900 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-24 px-4 md:px-0">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-slate-400 text-sm">Your financial overview</p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Time Period Filter */}
                <div className="flex bg-slate-800 rounded-lg p-1">
                    {[
                        { id: 'month', label: 'Month' },
                        { id: 'year', label: 'Year' },
                        { id: 'all', label: 'All' }
                    ].map(period => (
                        <button
                            key={period.id}
                            onClick={() => setTimePeriod(period.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === period.id
                                ? 'bg-emerald-500 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                {/* Category Filter */}
                <div className="relative">
                    <button
                        onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedCategory
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        {selectedCategory ? (
                            <>
                                {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5" style={{ color: selectedCategoryData?.color }} />}
                                {selectedCategoryData?.name}
                            </>
                        ) : (
                            <>
                                <Filter className="w-3.5 h-3.5" />
                                Category
                            </>
                        )}
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {showCategoryFilter && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                            <button
                                onClick={() => { setSelectedCategory(null); setShowCategoryFilter(false); }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${!selectedCategory ? 'text-emerald-400' : 'text-slate-300'}`}
                            >
                                All Categories
                            </button>
                            {CATEGORIES.filter(c => c.id !== 'income' && c.id !== 'transfer').map(cat => {
                                const Icon = LucideIcons[cat.icon] || LucideIcons.CircleDot;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setShowCategoryFilter(false); }}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 flex items-center gap-2 ${selectedCategory === cat.id ? 'text-emerald-400' : 'text-slate-300'}`}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedCategory && (
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-slate-500 hover:text-white"
                    >
                        Clear filter
                    </button>
                )}
            </div>

            {/* Account Cards */}
            {accounts.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                    <button
                        onClick={() => setSelectedAccountId(null)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedAccountId === null
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        All Accounts
                    </button>
                    {accounts.map(account => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            isSelected={selectedAccountId === account.id}
                            onClick={() => setSelectedAccountId(account.id)}
                            compact
                        />
                    ))}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Total Spent</span>
                        <Wallet className="text-emerald-500 w-4 h-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-white">{formatAmount(stats.totalSpent)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {timePeriod === 'month' ? 'This month' : timePeriod === 'year' ? 'This year' : 'All time'}
                        {selectedCategory && ` • ${selectedCategoryData?.name}`}
                    </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Daily Average</span>
                        <TrendingDown className="text-amber-500 w-4 h-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-white">{formatAmount(stats.dailyRate)}</p>
                    <p className="text-xs text-slate-500 mt-1">Per day</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Balance</span>
                        <Wallet className="text-blue-500 w-4 h-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-white">{formatAmount(stats.totalBalance)}</p>
                    <p className="text-xs text-slate-500 mt-1">All accounts</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Days Left</span>
                        <Calendar className="text-purple-500 w-4 h-4" />
                    </div>
                    <p className={`text-xl md:text-2xl font-bold ${stats.daysUntilZero > 30 ? 'text-emerald-400' : stats.daysUntilZero > 14 ? 'text-amber-400' : 'text-red-400'}`}>
                        {stats.daysUntilZero === Infinity ? '∞' : stats.daysUntilZero}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">At current rate</p>
                </div>
            </div>

            {/* Spending Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h3 className="text-slate-400 text-sm font-medium mb-4">Spending Trend</h3>
                <div className="h-[200px] md:h-[250px]">
                    <SpendingChart transactions={filteredTransactions} />
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-slate-400 text-sm font-medium">
                        Recent Transactions
                        {filteredTransactions.length > 0 && (
                            <span className="ml-2 text-slate-600">({filteredTransactions.length})</span>
                        )}
                    </h3>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="text-emerald-500 text-sm font-medium flex items-center gap-1 hover:text-emerald-400"
                    >
                        See All <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-slate-500">No transactions found</p>
                        <p className="text-slate-600 text-sm mt-1">
                            {selectedCategory || timePeriod !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Add your first transaction to get started'}
                        </p>
                    </div>
                ) : (
                    <TransactionList
                        transactions={filteredTransactions.slice(0, 5)}
                        onEdit={(t) => setEditingTransaction(t)}
                    />
                )}
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton
                onQuickAdd={() => setShowQuickAdd(true)}
                onScan={() => navigate('/scan')}
            />

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                user={user}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
            />

            {/* Edit Transaction Modal */}
            <TransactionEditModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                user={user}
                transaction={editingTransaction}
            />
        </div>
    );
};

export default Dashboard;


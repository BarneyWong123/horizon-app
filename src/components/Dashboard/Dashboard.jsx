import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseService } from '../../services/FirebaseService';
import AnalyticsSection from './AnalyticsSection';
import TransactionList from './TransactionList';
import AccountCard from './AccountCard';
import FloatingActionButton from './FloatingActionButton';
import QuickAddModal from './QuickAddModal';
import TransactionEditModal from './TransactionEditModal';
import CategorySettingsModal from '../Settings/CategorySettingsModal';
import { Wallet, TrendingDown, Calendar, ChevronRight, Filter, ChevronDown, CalendarDays, X, Settings2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useCategory } from '../../context/CategoryContext';
import { useToast } from '../../context/ToastContext';
import { OpenAIService } from '../../services/OpenAIService';
import { useCurrency } from '../../context/CurrencyContext';
import BudgetProgress from './BudgetProgress';

const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    const { formatAmount, convert } = useCurrency();
    const { categories } = useCategory();
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showCategorySettings, setShowCategorySettings] = useState(false);
    const [averageType, setAverageType] = useState('daily'); // 'daily' | 'monthly'

    // New filter states
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [timePeriod, setTimePeriod] = useState('month'); // 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showScanOptions, setShowScanOptions] = useState(false);

    useEffect(() => {
        // Initialize default account if none exists
        FirebaseService.initializeDefaultAccount(user.uid);

        const unsubTransactions = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        }, selectedAccountId);

        // Auto-scan listener if navigated with intent? 
        // Not needed if we do it directly here.

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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return transactions.filter(t => {
            // Category filter
            if (selectedCategory && t.category !== selectedCategory) return false;

            // Time period filter
            const txDate = new Date(t.date);

            if (timePeriod === 'custom' && customStartDate && customEndDate) {
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                if (txDate < start || txDate > end) return false;
            } else if (timePeriod !== 'all') {
                if (timePeriod === 'today' && txDate < today) return false;
                if (timePeriod === 'week' && txDate < startOfWeek) return false;
                if (timePeriod === 'month' && txDate < startOfMonth) return false;
                if (timePeriod === 'year' && txDate < startOfYear) return false;
            }

            return true;
        });
    }, [transactions, selectedCategory, timePeriod, customStartDate, customEndDate]);

    const stats = useMemo(() => {
        const totalSpent = filteredTransactions.reduce((acc, curr) => {
            if (curr.type === 'income' || curr.category === 'income') return acc;
            const amountInUSD = convert(curr.total || 0, curr.currency || 'USD', 'USD');
            return acc + amountInUSD;
        }, 0);

        const dayOfMonth = new Date().getDate() || 1;

        const totalIncome = filteredTransactions.reduce((acc, curr) => {
            if (curr.type === 'income' || curr.category === 'income') {
                const amountInUSD = convert(curr.total || 0, curr.currency || 'USD', 'USD');
                return acc + amountInUSD;
            }
            return acc;
        }, 0);

        const dailyRate = totalSpent / dayOfMonth;
        const dailyIncome = totalIncome / dayOfMonth;
        const dailyBurn = dailyRate - dailyIncome;

        let displayAverage = dailyRate;
        if (averageType === 'monthly') {
            displayAverage = dailyRate * 30;
        }

        // Calculate total balance FIRST (before using it)
        const totalBalance = accounts.reduce((acc, curr) => {
            // If an account is selected, only count that one. Otherwise count all.
            if (selectedAccountId && curr.id !== selectedAccountId) return acc;
            const balanceInUSD = convert(curr.balance || 0, curr.currency || 'USD', 'USD');
            return acc + balanceInUSD;
        }, 0);

        const daysUntilZero = dailyBurn > 0 ? Math.floor(totalBalance / dailyBurn) : Infinity;

        // Category breakdown
        const categoryTotals = filteredTransactions.reduce((acc, t) => {
            // Only count expenses for category breakdown
            if (t.type === 'income' || t.category === 'income') return acc;
            const cat = t.category || 'other';
            const amountInUSD = convert(t.total || 0, t.currency || 'USD', 'USD');
            acc[cat] = (acc[cat] || 0) + amountInUSD;
            return acc;
        }, {});

        return {
            totalSpent,
            totalIncome,
            dailyRate,
            dailyIncome,
            dailyBurn,
            displayAverage,
            totalBalance,
            daysUntilZero,
            categoryTotals
        };
    }, [filteredTransactions, accounts, convert, averageType, selectedAccountId]);

    const selectedCategoryData = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
    const CategoryIcon = selectedCategoryData ? (LucideIcons[selectedCategoryData.icon] || LucideIcons.CircleDot) : null;

    const handleInstantScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast('Scanning receipt...', 'info');
        setLoading(true);

        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
            });

            const analysis = await OpenAIService.scanReceipt(base64);
            setEditingTransaction({
                ...analysis,
                id: 'new-scan', // Dummy ID to trigger edit modal
                date: analysis.date || new Date().toISOString().split('T')[0],
                accountId: selectedAccountId || (accounts.length > 0 ? accounts[0].id : null),
                currency: 'USD', // Default or detect?
                isNewScan: true // Flag to handle saving vs updating
            });
            showToast('Scan complete! Please verify details.', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to scan receipt', 'error');
        } finally {
            setLoading(false);
            // Clear input
            e.target.value = '';
        }
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="animate-pulse space-y-6 p-4">
                <div className="h-24 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}></div>
                <div className="h-48 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-24 px-4 md:px-0">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your financial overview</p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Time Period Filter */}
                <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--bg-input)' }}>
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'week', label: 'Week' },
                        { id: 'month', label: 'Month' },
                        { id: 'year', label: 'Year' },
                        { id: 'all', label: 'All' }
                    ].map(period => (
                        <button
                            key={period.id}
                            onClick={() => { setTimePeriod(period.id); setShowDatePicker(false); }}
                            className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timePeriod === period.id
                                ? 'bg-emerald-500 text-white'
                                : ''
                                }`}
                            style={timePeriod !== period.id ? { color: 'var(--text-muted)' } : {}}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                {/* Custom Date Picker Toggle */}
                <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${timePeriod === 'custom'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                        {timePeriod === 'custom' && customStartDate && customEndDate
                            ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
                            : 'Custom'
                        }
                    </span>
                </button>

                {/* Custom Date Range Picker Dropdown */}
                {showDatePicker && (
                    <div className="absolute top-20 left-4 md:left-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 w-72">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">Custom Date Range</span>
                            <button onClick={() => setShowDatePicker(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">End Date</label>
                                <input
                                    type="date"
                                    className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (customStartDate && customEndDate) {
                                        setTimePeriod('custom');
                                        setShowDatePicker(false);
                                    }
                                }}
                                disabled={!customStartDate || !customEndDate}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}

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
                            <button
                                onClick={() => { setShowCategorySettings(true); setShowCategoryFilter(false); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700 text-blue-400 flex items-center gap-2 border-b border-slate-700 mb-1"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                                Manage Categories
                            </button>
                            {categories.filter(c => c.id !== 'income' && c.id !== 'transfer').map(cat => {
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
                <div
                    onClick={() => setTimePeriod(prev => prev === 'year' ? 'month' : 'year')}
                    className="card rounded-xl p-3 md:p-4 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Spent</span>
                        <Wallet className="text-emerald-500 w-4 h-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatAmount(stats.totalSpent)}</p>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        {timePeriod === 'month' ? 'This month' : timePeriod === 'year' ? 'This year' : 'All time'}
                        <LucideIcons.RefreshCw className="w-3 h-3 opacity-50" />
                        {selectedCategory && ` • ${selectedCategoryData?.name}`}
                    </p>
                </div>

                <div
                    className="card rounded-xl p-3 md:p-4"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => setAverageType(prev => prev === 'daily' ? 'monthly' : 'daily')}
                            className="text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {averageType === 'daily' ? 'Daily Average' : 'Monthly Average'}
                            <LucideIcons.ArrowLeftRight className="w-3 h-3" />
                        </button>
                        <TrendingDown className="text-amber-500 w-4 h-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatAmount(averageType === 'daily' ? stats.dailyRate : stats.displayAverage)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {averageType === 'daily' ? 'Per day' : 'Per 30 days'}
                    </p>
                </div>

                <div
                    onClick={() => {
                        const currentIdx = selectedAccountId ? accounts.findIndex(a => a.id === selectedAccountId) : -1;
                        const nextIdx = currentIdx + 1;
                        if (nextIdx < accounts.length) {
                            setSelectedAccountId(accounts[nextIdx].id);
                        } else {
                            setSelectedAccountId(null);
                        }
                    }}
                    className="card rounded-xl p-3 md:p-4 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Balance</span>
                        <Wallet className="text-blue-500 w-4 h-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatAmount(stats.totalBalance)}</p>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        {selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'All accounts'}
                        <LucideIcons.RefreshCw className="w-3 h-3 opacity-50" />
                    </p>
                </div>

                <div
                    className="card rounded-xl p-3 md:p-4"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                >
                    <div className="flex items-center justify-between mb-2 group relative">
                        <span className="text-xs font-medium flex items-center gap-1 cursor-help" style={{ color: 'var(--text-muted)' }}>
                            Days Left
                            <LucideIcons.Info className="w-3 h-3" />
                        </span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                            Estimated time until your total balance reaches zero at your current daily spending rate.
                        </div>
                        <Calendar className="text-purple-500 w-4 h-4" />
                    </div>
                    <p className={`text-xl md:text-2xl font-bold ${stats.daysUntilZero > 30 ? 'text-emerald-500' : stats.daysUntilZero > 14 ? 'text-amber-500' : 'text-red-500'}`}>
                        {stats.daysUntilZero === Infinity ? '∞' : stats.daysUntilZero}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>At current rate</p>
                </div>
            </div>



            {/* Analytics Section - New Visuals */}
            <AnalyticsSection transactions={filteredTransactions} />

            {/* Budget Progress Section */}
            <BudgetProgress transactions={transactions} />

            {/* Recent Transactions */}
            <div className="bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-xl overflow-hidden">
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



            {/* Hidden Photo Inputs */}
            <input
                id="instant-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleInstantScan}
            />
            <input
                id="instant-gallery-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInstantScan}
            />

            {/* Scan Options Modal */}
            {showScanOptions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-sm rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Scan Receipt</h3>
                            <button onClick={() => setShowScanOptions(false)} style={{ color: 'var(--text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => {
                                    setShowScanOptions(false);
                                    document.getElementById('instant-camera-input').click();
                                }}
                                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <LucideIcons.Camera className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Take Photo</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Use your camera</p>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    setShowScanOptions(false);
                                    document.getElementById('instant-gallery-input').click();
                                }}
                                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                    <LucideIcons.Image className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Choose from Gallery</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pick an existing photo</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <FloatingActionButton
                onQuickAdd={() => setShowQuickAdd(true)}
                onScan={() => setShowScanOptions(true)}
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
                accounts={accounts}
            />

            {/* Category Settings Modal */}
            <CategorySettingsModal
                isOpen={showCategorySettings}
                onClose={() => setShowCategorySettings(false)}
            />
        </div>
    );
};

export default Dashboard;


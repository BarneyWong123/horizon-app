import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseService } from '../../services/FirebaseService';
import SpendingChart from './SpendingChart';
import TransactionList from './TransactionList';
import AccountCard from './AccountCard';
import FloatingActionButton from './FloatingActionButton';
import QuickAddModal from './QuickAddModal';
import TransactionEditModal from './TransactionEditModal';
import { Wallet, TrendingDown, Calendar, ChevronRight } from 'lucide-react';

const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        // Initialize default account if none exists
        FirebaseService.initializeDefaultAccount(user.uid);

        const unsubTransactions = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        }, { limit: 100, accountId: selectedAccountId });

        const unsubAccounts = FirebaseService.subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
        });

        return () => {
            unsubTransactions();
            unsubAccounts();
        };
    }, [user.uid, selectedAccountId]);

    const monthlyTransactions = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return transactions.filter(t => {
            let tDate;
            if (t.date) {
                tDate = new Date(t.date);
            } else if (t.createdAt && typeof t.createdAt.toDate === 'function') {
                tDate = t.createdAt.toDate();
            } else {
                // If created via pending write or missing date, assume it's recent (this month)
                // This prevents newly added items from disappearing until refresh
                tDate = new Date();
            }

            const isThisMonth = tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
            const isExpense = t.type === 'expense' || !t.type;

            return isThisMonth && isExpense;
        });
    }, [transactions]);

    const stats = useMemo(() => {
        const totalSpent = monthlyTransactions.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const now = new Date();
        const dayOfMonth = now.getDate() || 1;
        const dailyRate = totalSpent / dayOfMonth;

        // Calculate days until zero (if user has balance)
        const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
        const daysUntilZero = dailyRate > 0 ? Math.floor(totalBalance / dailyRate) : Infinity;

        return { totalSpent, dailyRate, totalBalance, daysUntilZero };
    }, [monthlyTransactions, accounts]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-24 bg-slate-900 rounded-xl"></div>
                <div className="h-48 bg-slate-900 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-slate-400 text-sm">Your financial overview</p>
            </div>

            {/* Account Cards */}
            {accounts.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Total Spent</span>
                        <Wallet className="text-emerald-500 w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-white">${stats.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">This month</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Daily Average</span>
                        <TrendingDown className="text-amber-500 w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-white">${stats.dailyRate.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-1">Per day</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Balance</span>
                        <Wallet className="text-blue-500 w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-white">${stats.totalBalance.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">All accounts</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-xs font-medium">Days Left</span>
                        <Calendar className="text-purple-500 w-4 h-4" />
                    </div>
                    <p className={`text-2xl font-bold ${stats.daysUntilZero > 30 ? 'text-emerald-400' : stats.daysUntilZero > 14 ? 'text-amber-400' : 'text-red-400'}`}>
                        {stats.daysUntilZero === Infinity ? '∞' : stats.daysUntilZero}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">At current rate</p>
                </div>
            </div>

            {/* Spending Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h3 className="text-slate-400 text-sm font-medium mb-4">Spending Trend</h3>
                <div className="h-[250px]">
                    <SpendingChart transactions={monthlyTransactions} />
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-slate-400 text-sm font-medium">Recent Transactions</h3>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="text-emerald-500 text-sm font-medium flex items-center gap-1 hover:text-emerald-400"
                    >
                        See All <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <TransactionList
                    transactions={transactions.slice(0, 5)}
                    onEdit={(t) => setEditingTransaction(t)}
                />
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

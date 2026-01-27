import React, { useState, useEffect } from 'react';
import { FirebaseService } from '../../services/FirebaseService';
import { ACCOUNT_TYPES } from '../../data/categories';
import { CURRENCIES, getCurrencyByCode } from '../../data/currencies';
import * as LucideIcons from 'lucide-react';
import { Plus, ArrowLeft, Trash2, X, Loader2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const AccountManager = ({ user }) => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToAccounts(user.uid, (data) => {
            setAccounts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    return (
        <div className="space-y-4 px-4 md:px-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-white truncate">Accounts</h1>
                        <p className="text-sm text-slate-500 hidden sm:block">Manage your wallets and accounts</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 flex-shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Account</span>
                </button>
            </div>

            {/* Account List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-800 rounded-xl" />
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
                        <p className="text-slate-400">No accounts yet</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 text-emerald-500 font-medium"
                        >
                            Create your first account
                        </button>
                    </div>
                ) : (
                    accounts.map(account => {
                        const accountType = ACCOUNT_TYPES.find(t => t.id === account.type) || ACCOUNT_TYPES[0];
                        const IconComponent = LucideIcons[account.icon || accountType.icon] || LucideIcons.Wallet;
                        const color = account.color || accountType.color;
                        const currencyInfo = getCurrencyByCode(account.currency || 'USD');

                        return (
                            <div
                                key={account.id}
                                onClick={() => setEditingAccount(account)}
                                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    <IconComponent className="w-6 h-6" style={{ color }} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-white">{account.name}</p>
                                    <p className="text-sm text-slate-500">{accountType.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-white">
                                        {currencyInfo?.symbol || '$'}{(account.balance || 0).toLocaleString()}
                                    </p>
                                    {account.currency && (
                                        <p className="text-xs text-slate-500">{account.currency}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || editingAccount) && (
                <AccountModal
                    user={user}
                    account={editingAccount}
                    onClose={() => { setShowAddModal(false); setEditingAccount(null); }}
                />
            )}
        </div>
    );
};

const AccountModal = ({ user, account, onClose }) => {
    const [name, setName] = useState(account?.name || '');
    const [type, setType] = useState(account?.type || 'cash');
    const [balance, setBalance] = useState(account?.balance?.toString() || '0');
    const [currency, setCurrency] = useState(account?.currency || 'USD');
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { showToast } = useToast();

    const selectedType = ACCOUNT_TYPES.find(t => t.id === type) || ACCOUNT_TYPES[0];
    const selectedCurrency = getCurrencyByCode(currency);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                name: name || selectedType.name,
                type,
                balance: parseFloat(balance) || 0,
                currency: currency,
                icon: selectedType.icon,
                color: selectedType.color
            };

            if (account) {
                await FirebaseService.updateAccount(user.uid, account.id, data);
                showToast('Account updated!', 'success');
            } else {
                await FirebaseService.addAccount(user.uid, data);
                showToast('Account created!', 'success');
            }
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to save account', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this account? This will not delete associated transactions.')) return;
        setDeleting(true);
        try {
            await FirebaseService.deleteAccount(user.uid, account.id);
            showToast('Account deleted', 'success');
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete account', 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">
                        {account ? 'Edit Account' : 'New Account'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Account Name</label>
                        <input
                            type="text"
                            placeholder={selectedType.name}
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Account Type</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {ACCOUNT_TYPES.map(t => {
                                const IconComponent = LucideIcons[t.icon] || LucideIcons.Wallet;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setType(t.id)}
                                        className={`flex flex-col items-center p-3 rounded-xl transition-all ${type === t.id
                                            ? 'bg-slate-700 ring-2 ring-emerald-500'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                            }`}
                                    >
                                        <IconComponent className="w-5 h-5 mb-1" style={{ color: t.color }} />
                                        <span className="text-xs text-slate-400">{t.name.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Currency Selector */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                        <div className="relative mt-1">
                            <button
                                type="button"
                                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{selectedCurrency?.flag}</span>
                                    <span>{selectedCurrency?.name}</span>
                                    <span className="text-slate-500">({selectedCurrency?.symbol})</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCurrencyPicker ? 'rotate-180' : ''}`} />
                            </button>

                            {showCurrencyPicker && (
                                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                                    {CURRENCIES.map(c => (
                                        <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => {
                                                setCurrency(c.code);
                                                setShowCurrencyPicker(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-left hover:bg-slate-700 flex items-center gap-3 ${currency === c.code ? 'bg-slate-700' : ''}`}
                                        >
                                            <span className="text-lg">{c.flag}</span>
                                            <span className="text-slate-200 flex-1">{c.name}</span>
                                            <span className="text-slate-500 text-sm">{c.symbol}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Current Balance</label>
                        <div className="relative mt-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                {selectedCurrency?.symbol || '$'}
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {account && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (account ? 'Save' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountManager;

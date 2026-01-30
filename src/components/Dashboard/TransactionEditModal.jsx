import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CURRENCIES, getCurrencyByCode } from '../../data/currencies';
import { FirebaseService } from '../../services/FirebaseService';
import { useToast } from '../../context/ToastContext';
import { useCategory } from '../../context/CategoryContext';
import { useCurrency } from '../../context/CurrencyContext';

const TransactionEditModal = ({ isOpen, onClose, user, transaction, accounts = [] }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [categoryId, setCategoryId] = useState('other');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showItems, setShowItems] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const { showToast } = useToast();
    const { categories } = useCategory();
    const { convert } = useCurrency();
    const [accountId, setAccountId] = useState('');

    // Sync state with transaction prop when it changes
    useEffect(() => {
        if (transaction) {
            setAmount(transaction.total?.toString() || '');
            setNote(transaction.merchant || '');
            setCategoryId(transaction.category || 'other');
            setDate(transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
            setCurrency(transaction.currency || 'USD');
            // If it's a new scan, we might have a suggested account already or default to first
            setAccountId(transaction.accountId || (accounts.length > 0 ? accounts[0].id : ''));
        }
    }, [transaction, accounts]);

    if (!isOpen || !transaction) return null;

    const selectedCurrency = getCurrencyByCode(currency);
    const items = transaction.items || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newAmount = parseFloat(amount);
            if (!newAmount || newAmount <= 0) {
                showToast('Please enter a valid amount.', 'error');
                return;
            }

            if (transaction.isNewScan) {
                // Apply New Balance
                if (accountId) {
                    const targetAccount = accounts.find(a => a.id === accountId);
                    if (targetAccount) {
                        const deductAmount = convert(newAmount, currency, targetAccount.currency || 'USD');
                        await FirebaseService.updateAccount(user.uid, accountId, {
                            balance: (targetAccount.balance || 0) - deductAmount
                        });
                    }
                }

                await FirebaseService.addTransaction(user.uid, {
                    total: newAmount,
                    category: categoryId,
                    merchant: note || categories.find(c => c.id === categoryId)?.name || 'Expense',
                    date: date,
                    currency: currency,
                    accountId: accountId || null,
                    inputType: 'image',
                    items: transaction.items || []
                });
                showToast('Transaction saved!', 'success');
            } else {
                // Handle Balance Adjustments
                const oldAccountId = transaction.accountId;
                const oldAmount = transaction.total || 0;
                const oldCurrency = transaction.currency || 'USD';

                // 1. Revert Old Balance
                if (oldAccountId) {
                    const oldAccount = accounts.find(a => a.id === oldAccountId);
                    if (oldAccount) {
                        const revertAmount = convert(oldAmount, oldCurrency, oldAccount.currency || 'USD');
                        await FirebaseService.updateAccount(user.uid, oldAccountId, {
                            balance: (oldAccount.balance || 0) + revertAmount
                        });
                    }
                }

                // 2. Apply New Balance
                if (accountId) {
                    const targetAccount = accounts.find(a => a.id === accountId);
                    if (targetAccount) {
                        const deductAmount = convert(newAmount, currency, targetAccount.currency || 'USD');
                        let currentBalance = targetAccount.balance || 0;
                        if (accountId === oldAccountId) {
                            const revertAmount = convert(oldAmount, oldCurrency, targetAccount.currency || 'USD');
                            currentBalance += revertAmount;
                        }

                        await FirebaseService.updateAccount(user.uid, accountId, {
                            balance: currentBalance - deductAmount
                        });
                    }
                }

                await FirebaseService.updateTransaction(user.uid, transaction.id, {
                    total: newAmount,
                    category: categoryId,
                    merchant: note || categories.find(c => c.id === categoryId)?.name || 'Expense',
                    date: date,
                    currency: currency,
                    accountId: accountId || null
                });
                showToast('Transaction updated!', 'success');
            }
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to save transaction', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        setDeleting(true);
        try {
            // Revert balance before deleting
            if (transaction.accountId) {
                const account = accounts.find(a => a.id === transaction.accountId);
                if (account) {
                    const revertAmount = convert(transaction.total || 0, transaction.currency || 'USD', account.currency || 'USD');
                    await FirebaseService.updateAccount(user.uid, transaction.accountId, {
                        balance: (account.balance || 0) + revertAmount
                    });
                }
            }

            await FirebaseService.deleteTransaction(user.uid, transaction.id);
            showToast('Transaction deleted', 'success');
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete transaction', 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">
                        {transaction.isNewScan ? 'Confirm Scan' : 'Edit Transaction'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Amount + Currency Row */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                            <div className="relative mt-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                    {selectedCurrency?.symbol || '$'}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Currency Selector */}
                        <div className="w-24">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Currency</label>
                            <div className="relative mt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 px-3 text-slate-200 flex items-center justify-center gap-1"
                                >
                                    <span>{selectedCurrency?.flag}</span>
                                    <span className="text-sm font-medium">{currency}</span>
                                </button>

                                {showCurrencyPicker && (
                                    <div className="absolute top-full mt-1 right-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                                        {CURRENCIES.map(c => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => {
                                                    setCurrency(c.code);
                                                    setShowCurrencyPicker(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2 ${currency === c.code ? 'bg-slate-700' : ''}`}
                                            >
                                                <span>{c.flag}</span>
                                                <span className="text-sm text-slate-200">{c.code}</span>
                                                <span className="text-xs text-slate-500">{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Itemized Breakdown (if available) */}
                    {items.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700">
                            <button
                                type="button"
                                onClick={() => setShowItems(!showItems)}
                                className="w-full flex items-center justify-between p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-300">
                                        {items.length} item{items.length > 1 ? 's' : ''} from receipt
                                    </span>
                                </div>
                                {showItems ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                            </button>

                            {showItems && (
                                <div className="border-t border-slate-700 divide-y divide-slate-700/50">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center px-3 py-2">
                                            <span className="text-sm text-slate-300 truncate flex-1">{item.name}</span>
                                            <span className="text-sm font-medium text-slate-200 ml-2">
                                                {selectedCurrency?.symbol}{item.price?.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Account Selector */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Account</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {accounts.map((acc) => {
                                const IconComp = LucideIcons[acc.icon] || LucideIcons.Wallet;
                                return (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        onClick={() => setAccountId(acc.id)}
                                        className={`flex items-center gap-2 p-3 rounded-xl transition-all ${accountId === acc.id
                                            ? 'bg-slate-700 ring-2 ring-emerald-500'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                            }`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${acc.color}20` }}
                                        >
                                            <IconComp className="w-4 h-4" style={{ color: acc.color }} />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-xs font-bold text-slate-200 truncate">{acc.name}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {getCurrencyByCode(acc.currency || 'USD')?.symbol}{acc.balance?.toFixed(2)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Grid */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                            {categories.slice(0, 10).map((cat) => {
                                const IconComponent = LucideIcons[cat.icon] || LucideIcons.CircleDot;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryId(cat.id)}
                                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${categoryId === cat.id
                                            ? 'bg-slate-700 ring-2 ring-emerald-500'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                            }`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                                            style={{ backgroundColor: `${cat.color}20` }}
                                        >
                                            <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 truncate w-full text-center">{cat.name.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Note Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Note</label>
                        <input
                            type="text"
                            placeholder="e.g. Lunch at cafe"
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Date Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                        <input
                            type="date"
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={transaction.isNewScan ? onClose : handleDelete}
                            disabled={deleting}
                            className={`flex-1 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${transaction.isNewScan
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
                                }`}
                        >
                            {deleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : transaction.isNewScan ? (
                                'Discard'
                            ) : (
                                <><Trash2 className="w-4 h-4" /> Delete</>
                            )}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : transaction.isNewScan ? 'Save Expense' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionEditModal;

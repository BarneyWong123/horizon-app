import React, { useState, useEffect } from 'react';
import { X, Loader2, Delete, Wallet, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { CURRENCIES, getCurrencyByCode } from '../../data/currencies';
import { FirebaseService } from '../../services/FirebaseService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';

const QuickAddModal = ({ isOpen, onClose, user, accounts, selectedAccountId: defaultAccountId }) => {
    const [amount, setAmount] = useState('0');
    const [note, setNote] = useState('');
    const [categoryId, setCategoryId] = useState('food');
    const [accountId, setAccountId] = useState(defaultAccountId || '');
    const [currency, setCurrency] = useState('USD');
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { selectedCurrency: globalCurrency } = useCurrency();

    // Update account and currency when selections change
    useEffect(() => {
        if (defaultAccountId) {
            setAccountId(defaultAccountId);
        } else if (accounts.length > 0 && !accountId) {
            setAccountId(accounts[0].id);
        }
    }, [defaultAccountId, accounts]);

    // Use selected account's currency by default
    useEffect(() => {
        if (accountId) {
            const account = accounts.find(a => a.id === accountId);
            if (account?.currency) {
                setCurrency(account.currency);
            }
        } else {
            setCurrency(globalCurrency);
        }
    }, [accountId, accounts, globalCurrency]);

    if (!isOpen) return null;

    const selectedCurrencyInfo = getCurrencyByCode(currency);

    const handleCalcInput = (value) => {
        if (value === 'C') {
            setAmount('0');
        } else if (value === 'DEL') {
            setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else if (value === '.') {
            if (!amount.includes('.')) {
                setAmount(prev => prev + '.');
            }
        } else {
            setAmount(prev => prev === '0' ? value : prev + value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;

        setLoading(true);
        try {
            // Add the transaction with currency
            await FirebaseService.addTransaction(user.uid, {
                total: numAmount,
                category: categoryId,
                merchant: note || CATEGORIES.find(c => c.id === categoryId)?.name || 'Expense',
                date: new Date().toISOString().split('T')[0],
                accountId: accountId || null,
                currency: currency,
                type: 'expense'
            });

            // Deduct from account balance if account is selected
            if (accountId) {
                const selectedAccount = accounts.find(a => a.id === accountId);
                if (selectedAccount) {
                    const newBalance = (selectedAccount.balance || 0) - numAmount;
                    await FirebaseService.updateAccount(user.uid, accountId, {
                        balance: newBalance
                    });
                }
            }

            // Reset form
            setAmount('0');
            setNote('');
            setCategoryId('food');

            // Show success toast
            showToast('Expense added successfully!', 'success');

            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to add expense', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calcButtons = [
        ['7', '8', '9', 'DEL'],
        ['4', '5', '6', 'C'],
        ['1', '2', '3', '.'],
        ['0', '00', '000', '=']
    ];

    const selectedAccount = accountId ? accounts.find(a => a.id === accountId) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Add Expense</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Amount Display with Currency Picker */}
                    <div className="bg-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>

                            {/* Inline Currency Selector */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs transition-colors"
                                >
                                    <span>{selectedCurrencyInfo?.flag}</span>
                                    <span className="text-slate-300">{currency}</span>
                                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showCurrencyPicker ? 'rotate-180' : ''}`} />
                                </button>

                                {showCurrencyPicker && (
                                    <div className="absolute top-full mt-1 right-0 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto">
                                        {CURRENCIES.map(c => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => {
                                                    setCurrency(c.code);
                                                    setShowCurrencyPicker(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2 text-sm ${currency === c.code ? 'bg-slate-700' : ''}`}
                                            >
                                                <span>{c.flag}</span>
                                                <span className="text-slate-200">{c.code}</span>
                                                <span className="text-xs text-slate-500">{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {selectedCurrencyInfo?.symbol || '$'}{parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Calculator Keypad */}
                    <div className="grid grid-cols-4 gap-2">
                        {calcButtons.map((row, rowIdx) =>
                            row.map((btn) => (
                                <button
                                    key={`${rowIdx}-${btn}`}
                                    type="button"
                                    onClick={() => btn !== '=' && handleCalcInput(btn)}
                                    className={`py-3 rounded-xl font-bold text-lg transition-all ${btn === 'DEL' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                            btn === 'C' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' :
                                                btn === '=' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                                                    'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                        }`}
                                >
                                    {btn === 'DEL' ? <Delete className="w-5 h-5 mx-auto" /> : btn}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Account Selector */}
                    {accounts.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                <Wallet className="w-3 h-3" />
                                Deduct From Account
                            </label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {accounts.map((account) => {
                                    const IconComponent = LucideIcons[account.icon] || LucideIcons.Wallet;
                                    const accountCurrency = getCurrencyByCode(account.currency || 'USD');
                                    return (
                                        <button
                                            key={account.id}
                                            type="button"
                                            onClick={() => setAccountId(account.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${accountId === account.id
                                                    ? 'bg-slate-700 ring-2 ring-emerald-500'
                                                    : 'bg-slate-800 hover:bg-slate-700'
                                                }`}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${account.color}20` }}
                                            >
                                                <IconComponent className="w-4 h-4" style={{ color: account.color }} />
                                            </div>
                                            <div className="flex-1 text-left overflow-hidden">
                                                <p className="text-sm font-medium text-slate-200 truncate">{account.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {accountCurrency?.symbol}{account.balance?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedAccount && parseFloat(amount) > (selectedAccount.balance || 0) && (
                                <p className="text-xs text-amber-400 mt-2">
                                    ⚠️ Amount exceeds account balance
                                </p>
                            )}
                        </div>
                    )}

                    {/* Category Grid */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                            {CATEGORIES.slice(0, 10).map((cat) => {
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
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Note (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Lunch at cafe"
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || parseFloat(amount) <= 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuickAddModal;

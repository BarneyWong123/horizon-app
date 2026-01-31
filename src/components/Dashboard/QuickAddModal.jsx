import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Delete, Wallet, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCategory } from '../../context/CategoryContext';
import { CURRENCIES, getCurrencyByCode } from '../../data/currencies';

const QuickAddModal = ({ isOpen, onClose, user, accounts, selectedAccountId: defaultAccountId }) => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('0');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('food');
    const [accountId, setAccountId] = useState(defaultAccountId || '');
    const [currency, setCurrency] = useState('USD');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { selectedCurrency: globalCurrency, convert } = useCurrency();
    const { categories: allCategories } = useCategory();
    const [preferences, setPreferences] = useState(null);

    useEffect(() => {
        if (!user) return;
        return FirebaseService.subscribeToPreferences(user.uid, setPreferences);
    }, [user]);

    // Derived values
    const categories = preferences?.quickAddCategories?.length
        ? allCategories.filter(c => preferences.quickAddCategories.includes(c.id))
        : allCategories;

    // Update account and currency when selections change
    useEffect(() => {
        if (preferences?.defaultAccountId) {
            setAccountId(preferences.defaultAccountId);
        } else if (defaultAccountId) {
            setAccountId(defaultAccountId);
        } else if (accounts.length > 0 && !accountId) {
            setAccountId(accounts[0].id);
        }
    }, [preferences?.defaultAccountId, defaultAccountId, accounts]);

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

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Don't intercept if an input or textarea is focused
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            // Prevent default for calculator keys to avoid side effects (except modifiers)
            const key = e.key;

            if (key === 'Escape') {
                onClose();
                return;
            }

            // Numbers and Operators
            if (/^[0-9.]$/.test(key)) {
                e.preventDefault();
                handleCalcInput(key);
            } else if (['+', '-', '*', '/'].includes(key)) {
                e.preventDefault();
                handleCalcInput(key);
            } else if (key === 'Enter') {
                e.preventDefault();
                // If equation exists (contains operators), evaluate it. Else submit.
                if (['+', '-', '*', '/'].some(op => amount.includes(op))) {
                    handleCalcInput('=');
                } else {
                    handleSubmit(e);
                }
            } else if (key === 'Backspace') {
                e.preventDefault();
                handleCalcInput('DEL');
            } else if (key === 'c' || key === 'C') {
                e.preventDefault();
                handleCalcInput('C');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, amount, note, categoryId, accountId, currency]); // Dependencies for submit

    if (!isOpen) return null;

    const selectedCurrencyInfo = getCurrencyByCode(currency);

    const handleCalcInput = (value) => {
        if (value === 'C') {
            setAmount('0');
        } else if (value === 'DEL') {
            setAmount(prev => {
                if (prev.length <= 1) return '0';
                if (prev === 'Error') return '0';
                return prev.slice(0, -1);
            });
        } else if (value === '=') {
            try {
                // Safe evaluation
                // Replace visual X with * if needed (though we use * in state for simplicity)
                const safeExpression = amount.replace(/[^0-9.+\-*/]/g, '');
                // eslint-disable-next-line
                const result = Function('"use strict";return (' + safeExpression + ')')();
                setAmount(String(parseFloat(result.toFixed(2))));
            } catch (e) {
                setAmount('Error');
            }
        } else if (['+', '-', '*', '/'].includes(value)) {
            // Prevent double operators
            if (['+', '-', '*', '/'].includes(amount.slice(-1))) {
                setAmount(prev => prev.slice(0, -1) + value);
            } else {
                setAmount(prev => prev + value);
            }
        } else {
            // Numbers
            setAmount(prev => {
                if (prev === '0' || prev === 'Error') return value;
                return prev + value;
            });
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Evaluate if there's an unfinished expression
        let finalAmount = amount;
        if (['+', '-', '*', '/'].some(op => amount.includes(op))) {
            try {
                const safeExpression = amount.replace(/[^0-9.+\-*/]/g, '');
                const result = Function('"use strict";return (' + safeExpression + ')')();
                finalAmount = String(result);
            } catch (e) {
                showToast('Invalid calculation', 'error');
                return;
            }
        }

        const numAmount = parseFloat(finalAmount);
        if (!numAmount || numAmount <= 0 || isNaN(numAmount)) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        setLoading(true);
        try {
            await FirebaseService.addTransaction(user.uid, {
                total: numAmount,
                category: categoryId,
                merchant: note || categories.find(c => c.id === categoryId)?.name || 'Expense',
                date: date,
                accountId: accountId || null,
                currency: currency,
                type: 'expense'
            });

            if (accountId) {
                const selectedAccount = accounts.find(a => a.id === accountId);
                if (selectedAccount) {
                    const deductionAmount = convert(numAmount, currency, selectedAccount.currency || 'USD');
                    const newBalance = (selectedAccount.balance || 0) - deductionAmount;
                    await FirebaseService.updateAccount(user.uid, accountId, {
                        balance: newBalance
                    });
                }
            }

            setAmount('0');
            setNote('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategoryId('food');
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
        ['C', '/', '*', 'DEL'],
        ['7', '8', '9', '-'],
        ['4', '5', '6', '+'],
        ['1', '2', '3', '='],
        ['0', '.'] // Last row custom layout
    ];

    const selectedAccount = accountId ? accounts.find(a => a.id === accountId) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-default)'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>New Expense</h3>
                    <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Amount & Note Group */}
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowCurrencyPicker(!showCurrencyPicker); }}
                                    className="text-emerald-500 font-bold text-xl hover:text-emerald-400 transition-colors flex items-center gap-1"
                                >
                                    {selectedCurrencyInfo?.symbol || '$'}
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                {showCurrencyPicker && (
                                    <div className="absolute top-full mt-2 left-0 w-44 rounded-xl shadow-2xl bg-slate-900 border border-slate-800 z-50 max-h-48 overflow-y-auto">
                                        {CURRENCIES.map(c => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrency(c.code);
                                                    setShowCurrencyPicker(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm hover:bg-slate-800 transition-colors ${currency === c.code ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-200'}`}
                                            >
                                                <span>{c.flag}</span>
                                                <span>{c.code}</span>
                                                <span className="text-slate-500">{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                autoFocus
                                onClick={() => !showAdvanced && setShowAdvanced(true)}
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-6 pl-12 pr-4 text-4xl font-bold text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`p-2 rounded-xl transition-all ${showAdvanced ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                                    title="Show Calculator & Details"
                                >
                                    <LucideIcons.Calculator className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="What did you buy?"
                                className="flex-1 bg-transparent border-none p-0 text-xl text-slate-200 focus:ring-0 outline-none placeholder:text-slate-600 font-medium"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            {/* Date Pill in Minimal View */}
                            <div className="relative">
                                <input
                                    type="date"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700 pointer-events-none">
                                    <LucideIcons.Calendar className="w-3 h-3" />
                                    <span>{date === new Date().toISOString().split('T')[0] ? 'Today' : date}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compact Categories */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick Category</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                            {categories.map((cat) => {
                                const IconComp = LucideIcons[cat.icon] || LucideIcons.CircleDot;
                                const isActive = categoryId === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryId(cat.id)}
                                        className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl transition-all ${isActive
                                            ? 'bg-slate-700 ring-2 ring-emerald-500/50 shadow-lg'
                                            : 'bg-slate-800/50 hover:bg-slate-700/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                                            }`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5"
                                            style={{ backgroundColor: isActive ? `${cat.color}30` : 'transparent' }}
                                        >
                                            <IconComp className="w-5 h-5" style={{ color: cat.color }} />
                                        </div>
                                        <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                            {cat.name.split(' ')[0]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Advanced Section */}
                    {showAdvanced && (
                        <div className="space-y-6 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                            {/* Calculator */}
                            <div className="grid grid-cols-4 gap-2">
                                {calcButtons.map((row, rowIdx) => (
                                    <React.Fragment key={rowIdx}>
                                        {row.map((btn) => (
                                            <button
                                                key={btn}
                                                type="button"
                                                onClick={() => handleCalcInput(btn)}
                                                className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-95 ${btn === 'DEL' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                                                    btn === 'C' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' :
                                                        btn === '=' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                                                            ['/', '*', '-', '+'].includes(btn) ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' :
                                                                btn === '0' ? 'col-span-1 bg-slate-800 text-slate-300 hover:bg-slate-700' :
                                                                    'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {btn === 'DEL' ? <LucideIcons.Delete className="w-5 h-5 mx-auto" /> : btn}
                                            </button>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Date & Account */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 outline-none"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Currency</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{selectedCurrencyInfo?.flag}</span>
                                                <span>{currency}</span>
                                            </div>
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        </button>
                                        {showCurrencyPicker && (
                                            <div className="absolute bottom-full mb-2 right-0 w-44 rounded-xl shadow-2xl bg-slate-900 border border-slate-800 z-30 max-h-48 overflow-y-auto">
                                                {CURRENCIES.map(c => (
                                                    <button
                                                        key={c.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrency(c.code);
                                                            setShowCurrencyPicker(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left flex items-center gap-3 text-sm hover:bg-slate-800 transition-colors"
                                                    >
                                                        <span>{c.flag}</span>
                                                        <span className="text-slate-200">{c.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Account</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {accounts.map((acc) => {
                                        const IconComp = LucideIcons[acc.icon] || LucideIcons.Wallet;
                                        return (
                                            <button
                                                key={acc.id}
                                                type="button"
                                                onClick={() => setAccountId(acc.id)}
                                                className={`flex items-center gap-3 p-3 rounded-2xl min-w-[140px] transition-all ${accountId === acc.id
                                                    ? 'bg-slate-700 ring-2 ring-emerald-500/50'
                                                    : 'bg-slate-800 hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${acc.color}20` }}>
                                                    <IconComp className="w-4 h-4" style={{ color: acc.color }} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-200 truncate">{acc.name}</p>
                                                    <p className="text-[10px] text-slate-500">{getCurrencyByCode(acc.currency || 'USD')?.symbol}{acc.balance?.toFixed(2)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || parseFloat(amount) <= 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:grayscale text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Expense'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickAddModal;

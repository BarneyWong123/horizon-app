import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Delete, Wallet, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useCategory } from '../../context/CategoryContext';

const QuickAddModal = ({ isOpen, onClose, user, accounts, selectedAccountId: defaultAccountId }) => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('0');
    const [note, setNote] = useState('');
    const [categoryId, setCategoryId] = useState('food');
    const [accountId, setAccountId] = useState(defaultAccountId || '');
    const [currency, setCurrency] = useState('USD');
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { selectedCurrency: globalCurrency, convert } = useCurrency();
    const { categories } = useCategory();

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

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

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
                date: new Date().toISOString().split('T')[0],
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
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Add Transaction</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                window.location.href = '/scan'; // Force navigate or use navigate hook if available. 
                                // Since we are in modal, useNavigate hook should work if parent passed it or we use it.
                                // But component doesn't have useNavigate. Let's fix that or use window.location as fallback.
                                // Actually, I'll update component to use useNavigate.
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-medium transition-colors"
                        >
                            <LucideIcons.ScanLine className="w-3.5 h-3.5" />
                            Scan Receipt
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Amount Display */}
                    <div className="bg-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                            {/* Currency Picker */}
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
                        <div className="text-3xl font-bold text-white tracking-wider overflow-x-auto whitespace-nowrap scrollbar-hide">
                            {amount || '0'}
                        </div>
                    </div>

                    {/* Calculator Keypad */}
                    <div className="grid grid-cols-4 gap-2">
                        {calcButtons.map((row, rowIdx) => (
                            <React.Fragment key={rowIdx}>
                                {row.map((btn) => (
                                    <button
                                        key={btn}
                                        type="button"
                                        onClick={() => handleCalcInput(btn)}
                                        className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-95 ${btn === 'DEL' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                            btn === 'C' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' :
                                                btn === '=' ? 'bg-emerald-500 text-white hover:bg-emerald-600 row-span-2' : // Not actually row-span in this grid structure
                                                    ['/', '*', '-', '+'].includes(btn) ? 'bg-slate-700 text-emerald-400 hover:bg-slate-600' :
                                                        btn === '0' ? 'col-span-2 bg-slate-800 text-slate-200 hover:bg-slate-700' :
                                                            'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                            }`}
                                    >
                                        {btn === 'DEL' ? <Delete className="w-5 h-5 mx-auto" /> : btn}
                                    </button>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Note Input - Moved Here */}
                    <div>
                        <input
                            type="text"
                            placeholder="Add a note... (e.g. Lunch at cafe)"
                            className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Account Selector */}
                    {accounts.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                            {accounts.map((account) => {
                                const IconComponent = LucideIcons[account.icon] || LucideIcons.Wallet;
                                const accountCurrency = getCurrencyByCode(account.currency || 'USD');
                                return (
                                    <button
                                        key={account.id}
                                        type="button"
                                        onClick={() => setAccountId(account.id)}
                                        className={`flex items-center gap-2 p-3 rounded-xl transition-all ${accountId === account.id
                                            ? 'bg-slate-700 ring-1 ring-emerald-500'
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
                                            <p className="text-xs font-bold text-slate-200 truncate">{account.name}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {accountCurrency?.symbol}{account.balance?.toFixed(2)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Category Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {categories.slice(0, 10).map((cat) => {
                            const IconComponent = LucideIcons[cat.icon] || LucideIcons.CircleDot;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${categoryId === cat.id
                                        ? 'bg-emerald-500/20 ring-1 ring-emerald-500 text-emerald-400'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                        }`}
                                >
                                    <IconComponent className="w-5 h-5 mb-1" />
                                    <span className="text-[10px] truncate w-full text-center">{cat.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Expense'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickAddModal;

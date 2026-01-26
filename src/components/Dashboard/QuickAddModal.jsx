import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { FirebaseService } from '../../services/FirebaseService';

const QuickAddModal = ({ isOpen, onClose, user, accounts, selectedAccountId }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [categoryId, setCategoryId] = useState('food');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        try {
            await FirebaseService.addTransaction(user.uid, {
                total: parseFloat(amount),
                category: categoryId,
                merchant: note || CATEGORIES.find(c => c.id === categoryId)?.name || 'Expense',
                date: new Date().toISOString().split('T')[0],
                accountId: selectedAccountId || null,
                type: 'expense'
            });
            setAmount('');
            setNote('');
            setCategoryId('food');
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Add Expense</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Amount Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                        <div className="relative mt-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

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
                        disabled={loading || !amount}
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

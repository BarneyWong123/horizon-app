import React, { useState } from 'react';
import { Calculator, Calendar, Tag, User, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';
import CalculatorInput from './CalculatorInput';

const CATEGORIES = [
    'Food & Dining', 'Transportation', 'Entertainment', 'Shopping',
    'Bills & Utilities', 'Health & Fitness', 'Travel', 'Other'
];

const ManualEntry = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);

    const [formData, setFormData] = useState({
        amount: '0.00',
        merchant: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        sentiment: 'Survival'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await FirebaseService.addTransaction(user.uid, {
                merchant: formData.merchant,
                total: parseFloat(formData.amount),
                date: formData.date,
                sentiment: formData.sentiment,
                category: formData.category,
                inputType: 'manual'
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setFormData({
                amount: '0.00',
                merchant: '',
                category: 'Other',
                date: new Date().toISOString().split('T')[0],
                sentiment: 'Survival'
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-black text-white italic tracking-tight mb-2 uppercase">Manual Entry</h1>
                <p className="text-slate-400">Establish a new transaction record manually</p>
            </div>

            <div className="card shadow-2xl relative overflow-hidden">
                {success && (
                    <div className="absolute inset-0 z-10 bg-slate-900/90 flex items-center justify-center animate-in fade-in duration-300">
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-emerald/10 rounded-full border border-brand-emerald">
                                <CheckCircle2 className="text-brand-emerald w-10 h-10" />
                            </div>
                            <p className="text-xl font-bold text-white">Record Logged Successfully</p>
                            <p className="text-slate-400">Operational vectors updated.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Transaction Amount</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-2xl font-black text-brand-emerald focus:ring-2 focus:ring-brand-emerald outline-none cursor-pointer"
                                    value={formData.amount}
                                    onClick={() => setShowCalculator(true)}
                                />
                                <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-brand-emerald transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Merchant / Vendor</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Starbucks"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-slate-200 focus:ring-2 focus:ring-brand-emerald outline-none transition-all"
                                    value={formData.merchant}
                                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                                />
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-brand-emerald transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Classification</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-slate-200 focus:ring-2 focus:ring-brand-emerald outline-none appearance-none transition-all cursor-pointer"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-brand-emerald transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Temporal Data (Date)</label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-12 text-slate-200 focus:ring-2 focus:ring-brand-emerald outline-none transition-all cursor-pointer"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-brand-emerald transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Spending Sentiment</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Survival', 'Investment', 'Regret'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, sentiment: s })}
                                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${formData.sentiment === s
                                            ? (s === 'Survival' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                                                s === 'Investment' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                                                    'bg-red-500/20 text-red-400 border border-red-500/50')
                                            : 'bg-slate-800/50 text-slate-500 border border-transparent hover:bg-slate-800'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || formData.amount === '0.00' || !formData.merchant}
                        className="w-full btn-primary py-4 text-lg mt-8 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.3)] flex items-center justify-center space-x-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Establish Vector</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {showCalculator && (
                <CalculatorInput
                    initialValue={formData.amount}
                    onApply={(val) => {
                        setFormData({ ...formData, amount: val });
                        setShowCalculator(false);
                    }}
                    onClose={() => setShowCalculator(false)}
                />
            )}
        </div>
    );
};

export default ManualEntry;

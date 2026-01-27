import React, { useState } from 'react';
import { Camera, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { OpenAIService } from '../../services/OpenAIService';
import { FirebaseService } from '../../services/FirebaseService';
import { CATEGORIES, getCategoryById } from '../../data/categories';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import ImageUploader from './ImageUploader';

const SmartScan = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');
    const { showToast } = useToast();
    const { formatAmount } = useCurrency();

    const handleImageUpload = async (base64Image) => {
        setLoading(true);
        setError(null);
        try {
            const analysis = await OpenAIService.scanReceipt(base64Image);
            await FirebaseService.addTransaction(user.uid, {
                ...analysis,
                inputType: 'image'
            });
            setResult(analysis);
            showToast('Receipt scanned and saved!', 'success');
        } catch (err) {
            setError("Failed to scan receipt. Please try again.");
            showToast('Failed to scan receipt', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const analysis = await OpenAIService.chatWithAuditor(
                [{ role: 'user', content: `Extract expense details from this note: "${note}". Output JSON only: { merchant: string, total: number, date: string, items: [{name: string, price: number}], sentiment: 'Survival'|'Investment'|'Regret', category: 'food'|'transport'|'shopping'|'bills'|'entertainment'|'health'|'travel'|'other' }` }],
                []
            );

            const parsed = JSON.parse(analysis.match(/\{.*\}/s)[0]);
            await FirebaseService.addTransaction(user.uid, {
                ...parsed,
                inputType: 'text',
                rawInput: note
            });
            setResult(parsed);
            setNote('');
            showToast('Expense added successfully!', 'success');
        } catch (err) {
            setError("Failed to parse note. Please try again.");
            showToast('Failed to parse note', 'error');
        } finally {
            setLoading(false);
        }
    };

    const category = result ? getCategoryById(result.category) : null;
    const CategoryIcon = category ? (LucideIcons[category.icon] || LucideIcons.CircleDot) : null;

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
            <div className="text-center">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Scan Receipt</h1>
                <p className="text-slate-400 text-sm">Upload a receipt image to automatically extract expense details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Camera className="w-5 h-5" />
                        <h2 className="font-medium">Upload Receipt</h2>
                    </div>
                    <ImageUploader onUpload={handleImageUpload} disabled={loading} />
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <FileText className="w-5 h-5" />
                        <h2 className="font-medium">Quick Note</h2>
                    </div>
                    <form onSubmit={handleTextSubmit} className="space-y-4">
                        <textarea
                            className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-brand-emerald focus:outline-none h-32"
                            placeholder="e.g. $45 for groceries at Trader Joes"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !note.trim()}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Expense'}
                        </button>
                    </form>
                </div>
            </div>

            {result && (
                <div className="card border-brand-emerald/30 bg-emerald-500/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center space-x-3 mb-4">
                        <CheckCircle2 className="text-brand-emerald w-6 h-6" />
                        <h3 className="text-lg md:text-xl font-bold text-white">Transaction Recorded</h3>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                            <p className="text-slate-500">Merchant</p>
                            <p className="text-slate-200 font-medium text-lg">{result.merchant}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Total</p>
                            <p className="text-brand-emerald font-bold text-lg">${result.total?.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Category</p>
                            <div className="flex items-center gap-2 mt-1">
                                {CategoryIcon && (
                                    <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${category.color}20` }}
                                    >
                                        <CategoryIcon className="w-3.5 h-3.5" style={{ color: category.color }} />
                                    </div>
                                )}
                                <span className="text-slate-200 font-medium">{category?.name || 'Other'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-500">Sentiment</p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-bold ${result.sentiment === 'Survival' ? 'bg-blue-500/20 text-blue-400' :
                                result.sentiment === 'Investment' ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                {result.sentiment}
                            </span>
                        </div>
                    </div>

                    {/* Itemized Items */}
                    {result.items && result.items.length > 0 && (
                        <div className="border-t border-slate-700 pt-4">
                            <p className="text-slate-500 text-sm mb-2">Items ({result.items.length})</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {result.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-slate-800/50 rounded-lg">
                                        <span className="text-slate-300 text-sm truncate flex-1">{item.name}</span>
                                        <span className="text-slate-400 text-sm font-medium ml-2">${item.price?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                    {error}
                </div>
            )}
        </div>
    );
};

export default SmartScan;


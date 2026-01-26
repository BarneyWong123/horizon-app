import React, { useState } from 'react';
import { Camera, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { OpenAIService } from '../../services/OpenAIService';
import { FirebaseService } from '../../services/FirebaseService';
import ImageUploader from './ImageUploader';

const SmartScan = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');

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
        } catch (err) {
            setError("Failed to scan receipt. Please try again.");
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
                [{ role: 'user', content: `Extract expense details from this note: "${note}". Output JSON only: { merchant, total, date, items: [], sentiment: 'Survival'|'Investment'|'Regret' }` }],
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
        } catch {
            setError("Failed to parse note. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-1">Scan Receipt</h1>
                <p className="text-slate-400 text-sm">Upload a receipt image to automatically extract expense details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <h3 className="text-xl font-bold">Transaction Recorded</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Merchant</p>
                            <p className="text-slate-200 font-medium text-lg">{result.merchant}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Total</p>
                            <p className="text-brand-emerald font-bold text-lg">${result.total}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Sentiment</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${result.sentiment === 'Survival' ? 'bg-blue-500/20 text-blue-400' :
                                result.sentiment === 'Investment' ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                {result.sentiment}
                            </span>
                        </div>
                    </div>
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

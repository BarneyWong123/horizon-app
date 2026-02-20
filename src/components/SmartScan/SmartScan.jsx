import React, { useState } from 'react';
import { Camera, FileText, Loader2, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getLocalStartOfMonth } from '../../utils/dateUtils';
import { OpenAIService } from '../../services/OpenAIService';
import { FirebaseService } from '../../services/FirebaseService';
import { StreakService } from '../../services/StreakService';
import { CATEGORIES, getCategoryById } from '../../data/categories';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useSubscription } from '../../context/SubscriptionContext';
import ImageUploader from './ImageUploader';

const SmartScan = ({ user }) => {
    const { isPro } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showFailureModal, setShowFailureModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMatch, setDuplicateMatch] = useState(null);
    const [note, setNote] = useState('');
    const [scanCount, setScanCount] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [preferences, setPreferences] = useState(null);
    const { showToast } = useToast();
    const { formatAmount, selectedCurrency: globalCurrency } = useCurrency();

    // Fetch monthly scan count & transactions
    React.useEffect(() => {
        if (!user) return;
        const startOfMonth = getLocalStartOfMonth();

        const unsubscribe = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
            const monthlyScans = data.filter(t =>
                t.inputType === 'image' &&
                new Date(t.date || t.createdAt?.toDate()) >= startOfMonth
            ).length;
            setScanCount(monthlyScans);
        });

        return () => unsubscribe();
    }, [user]);

    // Load preferences and accounts
    React.useEffect(() => {
        if (!user) return;
        const unsubPrefs = FirebaseService.subscribeToPreferences(user.uid, setPreferences);
        const unsubAccs = FirebaseService.subscribeToAccounts(user.uid, setAccounts);
        return () => { unsubPrefs(); unsubAccs(); };
    }, [user]);

    const handleImageUpload = async (base64Image) => {
        // Feature gate: Free users limited to 50 scans
        if (!isPro && scanCount >= 50) {
            setShowUpgradeModal(true);
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setProgress(0);

        // Simulate progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + Math.random() * 15;
            });
        }, 300);

        try {
            const analysis = await OpenAIService.scanReceipt(base64Image);
            clearInterval(progressInterval);
            setProgress(100);

            // Check if scan was successful
            if (analysis.success === false) {
                setError(analysis.error || "This doesn't appear to be a receipt.");
                setShowFailureModal(true);
                setLoading(false);
                return;
            }

            // DON'T auto-save - show result modal for user confirmation
            // Attach default account and currency
            const defaultAccountId = preferences?.defaultAccountId || (accounts.length > 0 ? accounts[0].id : null);
            const defaultAccount = accounts.find(a => a.id === defaultAccountId);
            const defaultCurrency = defaultAccount?.currency || globalCurrency || 'USD';

            analysis.accountId = defaultAccountId;
            analysis.currency = defaultCurrency;

            setResult(analysis);
            setShowResultModal(true);
        } catch (err) {
            clearInterval(progressInterval);
            setError("Failed to scan receipt. Please try again.");
            setShowFailureModal(true);
            console.error(err);
        } finally {
            setLoading(false);
            setProgress(0);
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
            // Record streak
            await StreakService.recordLog(user.uid);
            setResult(parsed);
            setShowResultModal(true);
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

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Result Popup Modal */}
            {showResultModal && result && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border-b border-emerald-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Scan Successful!</h3>
                                    <p className="text-xs text-emerald-400">Transaction has been saved</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowResultModal(false)}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Main Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Merchant</p>
                                    <p className="text-white font-medium text-lg">{result.merchant}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total</p>
                                    <p className="text-emerald-500 font-bold text-2xl">{formatAmount(result.total, result.currency)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Date</p>
                                    <p className="text-white font-medium">{result.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Category</p>
                                    <div className="flex items-center gap-2">
                                        {CategoryIcon && (
                                            <div
                                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${category.color}20` }}
                                            >
                                                <CategoryIcon className="w-3.5 h-3.5" style={{ color: category.color }} />
                                            </div>
                                        )}
                                        <span className="text-white font-medium">{category?.name || 'Other'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sentiment */}
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Sentiment</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${result.sentiment === 'Survival' ? 'bg-blue-500/20 text-blue-400' :
                                    result.sentiment === 'Investment' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {result.sentiment}
                                </span>
                            </div>

                            {/* Items */}
                            {result.items && result.items.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Items ({result.items.length})</p>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {result.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1.5 px-3 bg-slate-800/50 rounded-lg">
                                                <span className="text-slate-300 text-sm truncate flex-1">{item.name}</span>
                                                <span className="text-slate-400 text-sm font-medium ml-2">{formatAmount(item.price, result.currency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                            <button
                                onClick={async () => {
                                    // Check for potential duplicates
                                    const potentialDup = transactions.find(t =>
                                        t.total === result.total &&
                                        t.date === result.date &&
                                        t.merchant?.toLowerCase() === result.merchant?.toLowerCase()
                                    );

                                    if (potentialDup) {
                                        setDuplicateMatch(potentialDup);
                                        setShowDuplicateModal(true);
                                        return;
                                    }

                                    try {
                                        await FirebaseService.addTransaction(user.uid, {
                                            ...result,
                                            inputType: 'image'
                                        });
                                        await StreakService.recordLog(user.uid);
                                        showToast('Transaction saved!', 'success');
                                        setShowResultModal(false);
                                        setResult(null);
                                    } catch (err) {
                                        showToast('Failed to save transaction', 'error');
                                    }
                                }}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Save Transaction
                            </button>
                            <button
                                onClick={() => {
                                    setShowResultModal(false);
                                    setResult(null);
                                }}
                                className="w-full text-slate-500 hover:text-slate-400 text-sm font-medium py-2 mt-2"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Failure Modal */}
            {showFailureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-4 bg-red-500/10 border-b border-red-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Scan Failed</h3>
                                    <p className="text-xs text-red-400">Could not extract data</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFailureModal(false)}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-slate-400 text-sm mb-4">
                                {error || "This image doesn't appear to be a receipt or we couldn't read it clearly."}
                            </p>
                            <p className="text-slate-500 text-xs mb-4">Tips for better scans:</p>
                            <ul className="text-slate-500 text-xs space-y-1 list-disc list-inside">
                                <li>Ensure the receipt is flat and well-lit</li>
                                <li>Capture the entire receipt in frame</li>
                                <li>Avoid blurry or low-quality images</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                            <button
                                onClick={() => setShowFailureModal(false)}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <LucideIcons.Lock className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Monthly Limit Reached</h3>
                            <p className="text-slate-400 text-sm">
                                You've used all {scanCount} free scans this month. Upgrade to Pro for unlimited AI scans and advanced features.
                            </p>
                        </div>
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => navigate('/settings')}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Upgrade to Pro
                            </button>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="w-full text-slate-500 hover:text-slate-400 text-sm font-medium py-1"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Centered Progress Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-xs p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Scanning receipt...</span>
                                <span className="text-emerald-500 font-medium">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-center">Analyzing with AI vision...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Confirmation Modal */}
            {showDuplicateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Potential Duplicate</h3>
                                <p className="text-xs text-amber-400">A similar entry already exists</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-slate-400 text-sm">
                                We found an existing transaction with the same amount ({formatAmount(result?.total, result?.currency)})
                                at <span className="text-white font-medium">{result?.merchant}</span> on {result?.date}.
                            </p>
                            <p className="text-slate-500 text-xs">Do you still want to add this transaction?</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                            <button
                                onClick={() => { setShowDuplicateModal(false); setDuplicateMatch(null); }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await FirebaseService.addTransaction(user.uid, {
                                            ...result,
                                            inputType: 'image'
                                        });
                                        await StreakService.recordLog(user.uid);
                                        showToast('Transaction saved!', 'success');
                                        setShowDuplicateModal(false);
                                        setShowResultModal(false);
                                        setResult(null);
                                        setDuplicateMatch(null);
                                    } catch (err) {
                                        showToast('Failed to save', 'error');
                                    }
                                }}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Add Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartScan;


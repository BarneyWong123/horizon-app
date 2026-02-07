import React, { useState, useEffect } from 'react';
import { X, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';
import { useToast } from '../../context/ToastContext';

// Available dashboard widgets
const AVAILABLE_WIDGETS = [
    { id: 'accounts', label: 'Account Cards', description: 'Your wallet accounts' },
    { id: 'streak', label: 'Streak Badge', description: 'Daily logging streak' },
    { id: 'forecast', label: 'Cash Flow Forecast', description: '30-day projection' },
    { id: 'stats', label: 'Stats Cards', description: 'Spending, average, balance' },
    { id: 'analytics', label: 'Analytics Charts', description: 'Category breakdown' },
    { id: 'budget', label: 'Budget Progress', description: 'Monthly budgets' },
    { id: 'transactions', label: 'Recent Transactions', description: 'Latest entries' },
];

const DEFAULT_WIDGETS = ['accounts', 'streak', 'forecast', 'stats', 'analytics', 'budget', 'transactions'];

const DashboardPreferences = ({ isOpen, onClose, user }) => {
    const [widgets, setWidgets] = useState([]);
    const [hiddenWidgets, setHiddenWidgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // Load current preferences
    useEffect(() => {
        if (!user || !isOpen) return;

        const unsub = FirebaseService.subscribeToPreferences(user.uid, (prefs) => {
            if (prefs?.dashboardWidgets) {
                setWidgets(prefs.dashboardWidgets);
            } else {
                setWidgets(DEFAULT_WIDGETS);
            }
            setHiddenWidgets(prefs?.hiddenWidgets || []);
        });

        return () => unsub?.();
    }, [user, isOpen]);

    const handleToggleWidget = (widgetId) => {
        if (hiddenWidgets.includes(widgetId)) {
            setHiddenWidgets(hiddenWidgets.filter(id => id !== widgetId));
        } else {
            setHiddenWidgets([...hiddenWidgets, widgetId]);
        }
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newWidgets = [...widgets];
        [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
        setWidgets(newWidgets);
    };

    const handleMoveDown = (index) => {
        if (index === widgets.length - 1) return;
        const newWidgets = [...widgets];
        [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
        setWidgets(newWidgets);
    };

    const handleReset = () => {
        setWidgets(DEFAULT_WIDGETS);
        setHiddenWidgets([]);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await FirebaseService.updatePreferences(user.uid, {
                dashboardWidgets: widgets,
                hiddenWidgets: hiddenWidgets,
            });
            showToast('Dashboard preferences saved!', 'success');
            onClose();
        } catch (err) {
            console.error('Failed to save preferences:', err);
            showToast('Failed to save preferences', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white">Customize Dashboard</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <p className="text-slate-400 text-sm mb-4">
                        Drag to reorder • Click eye to show/hide widgets
                    </p>

                    {widgets.map((widgetId, index) => {
                        const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
                        if (!widget) return null;

                        const isHidden = hiddenWidgets.includes(widgetId);

                        return (
                            <div
                                key={widgetId}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isHidden
                                        ? 'bg-slate-800/30 border-slate-800 opacity-50'
                                        : 'bg-slate-800/50 border-slate-700'
                                    }`}
                            >
                                <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />

                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{widget.label}</p>
                                    <p className="text-slate-500 text-xs truncate">{widget.description}</p>
                                </div>

                                {/* Move buttons */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === widgets.length - 1}
                                        className="p-1 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Visibility toggle */}
                                <button
                                    onClick={() => handleToggleWidget(widgetId)}
                                    className={`p-2 rounded-lg transition-colors ${isHidden
                                            ? 'text-slate-500 hover:text-white hover:bg-slate-700'
                                            : 'text-emerald-400 hover:bg-emerald-500/20'
                                        }`}
                                >
                                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPreferences;

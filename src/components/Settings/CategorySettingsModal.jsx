import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, RotateCcw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useCategory } from '../../context/CategoryContext';
import { useToast } from '../../context/ToastContext';

const AVAILABLE_ICONS = [
    'Utensils', 'Car', 'ShoppingBag', 'FileText', 'Film', 'Heart',
    'Plane', 'TrendingUp', 'ArrowLeftRight', 'MoreHorizontal',
    'Coffee', 'Home', 'Smartphone', 'Wifi', 'Zap', 'Gift',
    'Music', 'Book', 'GraduationCap', 'Briefcase', 'DollarSign',
    'CreditCard', 'PiggyBank', 'Anchor', 'Bike', 'Bus', 'Train'
];

const AVAILABLE_COLORS = [
    '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#ef4444',
    '#06b6d4', '#22c55e', '#6366f1', '#6b7280',
    '#f97316', '#eab308', '#84cc16', '#14b8a6', '#0ea5e9', '#d946ef'
];

const CategorySettingsModal = ({ isOpen, onClose }) => {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategory();
    const { showToast } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        icon: 'Circle',
        color: '#6b7280',
        budgetLimit: ''
    });

    if (!isOpen) return null;

    const resetForm = () => {
        setFormData({ name: '', icon: 'Circle', color: '#6b7280', budgetLimit: '' });
        setEditingId(null);
    };

    const handleEdit = (category) => {
        setEditingId(category.docId); // Use docId for updates
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
            budgetLimit: category.budgetLimit || ''
        });
    };

    const handleDelete = async (docId) => {
        if (!confirm('Delete this category? Transactions will remain but show as "Other" or generic stats.')) return;
        try {
            await deleteCategory(docId);
            showToast('Category deleted', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        try {
            if (editingId) {
                await updateCategory(editingId, formData);
                showToast('Category updated', 'success');
            } else {
                await addCategory(formData);
                showToast('Category created', 'success');
            }
            resetForm();
        } catch (error) {
            console.error(error);
            showToast('Failed to save category', 'error');
        } finally {
            setLoading(false);
        }
    };

    const IconPreview = LucideIcons[formData.icon] || LucideIcons.Circle;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white">Manage Categories</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* List Section */}
                    <div className="flex-1 overflow-y-auto p-4 border-b md:border-b-0 md:border-r border-slate-800">
                        <div className="space-y-2">
                            <button
                                onClick={resetForm}
                                className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500 hover:bg-slate-800 transition-all mb-4"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">Add New Category</span>
                            </button>

                            {categories.map(cat => {
                                const CatIcon = LucideIcons[cat.icon] || LucideIcons.Circle;
                                return (
                                    <div
                                        key={cat.docId}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editingId === cat.docId
                                            ? 'bg-emerald-500/10 border-emerald-500/50'
                                            : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${cat.color}20` }}
                                            >
                                                <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-200">{cat.name}</p>
                                                {/* Debug info if needed: <p className="text-[10px] text-slate-600">{cat.id}</p> */}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.docId)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editor Section */}
                    <div className="w-full md:w-80 p-4 bg-slate-900/50 overflow-y-auto">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">
                            {editingId ? 'Edit Category' : 'Create Category'}
                        </h4>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Preview */}
                            <div className="flex justify-center mb-6">
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg transition-colors"
                                        style={{ backgroundColor: formData.color }}
                                    >
                                        <IconPreview className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-white">
                                        {formData.name || 'New Category'}
                                    </span>
                                </div>
                            </div>

                            {/* Name Input */}
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Name</label>
                                <input
                                    type="text"
                                    placeholder="Category Name"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    maxLength={20}
                                />
                            </div>

                            {/* Budget Limit Input */}
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Monthly Budget (Optional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={formData.budgetLimit}
                                        onChange={(e) => setFormData({ ...formData, budgetLimit: parseFloat(e.target.value) || '' })}
                                    />
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Color</label>
                                <div className="grid grid-cols-8 gap-2">
                                    {AVAILABLE_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: c })}
                                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${formData.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Icon</label>
                                <div className="grid grid-cols-6 gap-2 h-40 overflow-y-auto p-1">
                                    {AVAILABLE_ICONS.map(iconName => {
                                        const Icon = LucideIcons[iconName] || LucideIcons.Circle;
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: iconName })}
                                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${formData.icon === iconName
                                                    ? 'bg-slate-700 text-white ring-1 ring-emerald-500'
                                                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                                                    }`}
                                                title={iconName}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading || !formData.name}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategorySettingsModal;

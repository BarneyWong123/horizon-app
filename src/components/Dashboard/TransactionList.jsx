import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useCategory } from '../../context/CategoryContext';
import { getCurrencyByCode } from '../../data/currencies';
import { Receipt } from 'lucide-react';

const TransactionList = ({ transactions, onEdit }) => {
    const { getCategoryById } = useCategory();
    if (transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500">No transactions yet</p>
                <p className="text-slate-600 text-sm mt-1">Add your first expense using the + button</p>
            </div>
        );
    }

    return (
        <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {transactions.map((t) => {
                const category = getCategoryById(t.category);
                const IconComponent = LucideIcons[category.icon] || LucideIcons.CircleDot;
                const currencyInfo = getCurrencyByCode(t.currency || 'USD');
                const hasItems = t.items && t.items.length > 0;

                return (
                    <div
                        key={t.id}
                        onClick={() => onEdit && onEdit(t)}
                        className="flex items-center gap-3 p-4 transition-colors cursor-pointer"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {/* Category Icon */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category.color}20` }}
                        >
                            <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.merchant}</p>
                                {hasItems && (
                                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-full">
                                        <Receipt className="w-2.5 h-2.5" />
                                        {t.items.length}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {category.name} • {new Date(t.date || t.createdAt?.toDate()).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Amount with Currency */}
                        <div className="text-right">
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                {currencyInfo?.symbol || '$'}{(t.total || 0).toFixed(2)}
                            </p>
                            {t.currency && t.currency !== 'USD' && (
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.currency}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionList;

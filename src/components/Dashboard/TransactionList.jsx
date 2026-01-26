import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getCategoryById } from '../../data/categories';

const TransactionList = ({ transactions, onEdit }) => {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500">No transactions yet</p>
                <p className="text-slate-600 text-sm mt-1">Add your first expense using the + button</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-800">
            {transactions.map((t) => {
                const category = getCategoryById(t.category);
                const IconComponent = LucideIcons[category.icon] || LucideIcons.CircleDot;

                return (
                    <div
                        key={t.id}
                        onClick={() => onEdit && onEdit(t)}
                        className="flex items-center gap-3 p-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
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
                            <p className="font-medium text-slate-200 truncate">{t.merchant}</p>
                            <p className="text-xs text-slate-500">
                                {category.name} • {new Date(t.date || t.createdAt?.toDate()).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                            <p className="font-bold text-white">${(t.total || 0).toFixed(2)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionList;

import React from 'react';
import { useCategory } from '../../context/CategoryContext';
import { useCurrency } from '../../context/CurrencyContext';

const BudgetProgress = ({ transactions }) => {
    const { categories } = useCategory();
    const { formatAmount, convert, selectedCurrency } = useCurrency();

    // 1. Filter categories that have a budget limit
    const budgetedCategories = categories.filter(c => c.budgetLimit && c.budgetLimit > 0);

    if (budgetedCategories.length === 0) return null;

    // 2. Calculate spending for this month for each category
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spendingByCategory = transactions.reduce((acc, t) => {
        const tDate = new Date(t.date);
        if (t.type === 'expense' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            const catId = t.category || 'other';
            const amount = convert(t.total || 0, t.currency || 'USD', selectedCurrency);
            acc[catId] = (acc[catId] || 0) + amount;
        }
        return acc;
    }, {});

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mt-6">
            <h3 className="text-slate-400 text-sm font-medium mb-4">Monthly Budgets</h3>
            <div className="space-y-4">
                {budgetedCategories.map(cat => {
                    const spent = spendingByCategory[cat.id] || 0;
                    const limit = cat.budgetLimit;
                    const percent = Math.min((spent / limit) * 100, 100);

                    let progressColor = 'bg-emerald-500';
                    if (percent > 100) progressColor = 'bg-red-500';
                    else if (percent > 80) progressColor = 'bg-amber-500';

                    return (
                        <div key={cat.id}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-200 font-medium">{cat.name}</span>
                                <span className="text-slate-400">
                                    <span className={percent > 100 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                        {formatAmount(spent)}
                                    </span>
                                    {' / '}
                                    {formatAmount(limit)}
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetProgress;

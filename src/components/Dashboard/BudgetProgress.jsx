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
        <div
            className="rounded-xl p-4 mt-6"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-default)'
            }}
        >
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Monthly Budgets</h3>
            <div className="space-y-4">
                {budgetedCategories.map(cat => {
                    const spent = spendingByCategory[cat.id] || 0;
                    const limit = cat.budgetLimit;
                    const percent = Math.min((spent / limit) * 100, 100);

                    // Compliance Neutral UI (MacroFactor pattern):
                    // Use softer colors that inform without shaming
                    let progressColor = 'bg-emerald-500';
                    if (percent > 100) progressColor = 'bg-purple-500'; // Over = purple (neutral)
                    else if (percent > 80) progressColor = 'bg-amber-500';

                    return (
                        <div key={cat.id}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    <span className={percent > 100 ? 'text-purple-400 font-medium' : ''} style={percent <= 100 ? { color: 'var(--text-primary)' } : {}}>
                                        {formatAmount(spent)}
                                    </span>
                                    {' / '}
                                    {formatAmount(limit)}
                                </span>
                            </div>
                            <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
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

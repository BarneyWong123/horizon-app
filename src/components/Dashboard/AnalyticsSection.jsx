import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';
import { useCategory } from '../../context/CategoryContext';
import * as LucideIcons from 'lucide-react';

const AnalyticsSection = ({ transactions }) => {
    const { convert, formatAmount, selectedCurrency } = useCurrency();
    const { categories, getCategoryById } = useCategory();

    // 1. Prepare Pie Chart Data (Spending by Category)
    const pieData = useMemo(() => {
        const totals = transactions.reduce((acc, t) => {
            const catId = t.category || 'other';
            const amount = convert(t.total || 0, t.currency || 'USD', selectedCurrency);
            // Only count expenses
            if (t.type === 'income') return acc;

            acc[catId] = (acc[catId] || 0) + amount;
            return acc;
        }, {});

        return Object.entries(totals)
            .map(([id, value]) => {
                const category = getCategoryById(id);
                return {
                    id,
                    name: category.name,
                    value,
                    color: category.color,
                    icon: category.icon
                };
            })
            .sort((a, b) => b.value - a.value) // Sort highest first
            .filter(d => d.value > 0);
    }, [transactions, selectedCurrency, categories, getCategoryById, convert]);

    // 2. Prepare Bar Chart Data (Daily Trend - Last 7 Days / Selected Range)
    const barData = useMemo(() => {
        // Simple View: Group by Date
        // If many days, maybe group by week? For now, stick to daily aggregation of the passed transactions
        // But we want to ensure we show empty days too if it's a short range like "week"
        // For simplicity, let's just group the transactions we have

        const daily = transactions.reduce((acc, t) => {
            if (t.type === 'income') return acc;

            const date = t.date?.split('T')[0];
            const amount = convert(t.total || 0, t.currency || 'USD', selectedCurrency);

            acc[date] = (acc[date] || 0) + amount;
            return acc;
        }, {});

        return Object.entries(daily)
            .map(([date, amount]) => ({
                date,
                amount,
                label: new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [transactions, selectedCurrency, convert]);

    // Graph Configuration
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-400 text-xs mb-1">{label}</p>
                    <p className="text-emerald-400 font-bold font-mono">
                        {formatAmount(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (transactions.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Trend (Area Chart) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h3 className="text-slate-400 text-sm font-medium mb-4">Spending Trend (Last 7 Days)</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={barData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={20}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Spending Breakdown */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h3 className="text-slate-400 text-sm font-medium mb-4">Expenses by Category</h3>
                <div className="h-[250px] w-full flex items-center justify-center">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatAmount(value)}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-500 text-sm">No expenses to display</p>
                    )}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 max-h-32 overflow-y-auto">
                    {pieData.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-slate-300 truncate max-w-[100px]">{d.name}</span>
                            </div>
                            <span className="font-medium text-slate-200">{formatAmount(d.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSection;

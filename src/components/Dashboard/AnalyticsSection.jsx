import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';
import { useCategory } from '../../context/CategoryContext';
import * as LucideIcons from 'lucide-react';

const AnalyticsSection = ({ transactions }) => {
    const { convert, formatAmount, selectedCurrency, getCurrencySymbol } = useCurrency();
    const { categories, getCategoryById } = useCategory();

    // Helper to format already-converted amounts (no additional conversion)
    const formatDirectAmount = (amount) => {
        const symbol = getCurrencySymbol();
        const formattedNumber = Math.abs(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${amount < 0 ? '-' : ''}${symbol}${formattedNumber}`;
    };

    // 1. Prepare Pie Chart Data (Spending by Category)
    const pieData = useMemo(() => {
        const totals = transactions.reduce((acc, t) => {
            const catId = t.category || 'other';
            const txCurrency = t.currency || selectedCurrency; // Default to selectedCurrency if not set
            // Only convert if currencies differ
            const amount = txCurrency === selectedCurrency
                ? (t.total || 0)
                : convert(t.total || 0, txCurrency, selectedCurrency);
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
            const txCurrency = t.currency || selectedCurrency; // Default to selectedCurrency if not set
            // Only convert if currencies differ
            const amount = txCurrency === selectedCurrency
                ? (t.total || 0)
                : convert(t.total || 0, txCurrency, selectedCurrency);

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
                <div
                    className="p-3 rounded-lg shadow-xl"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-default)'
                    }}
                >
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-emerald-500 font-bold font-mono">
                        {formatDirectAmount(payload[0].value)}
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
            <div
                className="rounded-xl p-4"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-default)'
                }}
            >
                <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Spending Trend (Last 7 Days)</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={barData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="var(--text-muted)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={20}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
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
            <div
                className="rounded-xl p-4"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-default)'
                }}
            >
                <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Expenses by Category</h3>
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
                                    formatter={(value) => formatDirectAmount(value)}
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
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-4 max-h-32 overflow-y-auto">
                    {pieData.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-xs min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                            </div>
                            <span className="font-medium flex-shrink-0 ml-1 text-right" style={{ color: 'var(--text-primary)' }}>{formatDirectAmount(d.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSection;

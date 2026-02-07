import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';

const BurnVelocityChart = ({ transactions }) => {
    const { convert, selectedCurrency, getCurrencySymbol } = useCurrency();

    const data = useMemo(() => {
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const spendingMap = {};

        transactions.forEach(t => {
            const date = new Date(t.date || t.createdAt?.toDate());
            const day = date.getDate();
            const txCurrency = t.currency || selectedCurrency;
            const amount = txCurrency === selectedCurrency
                ? (t.total || 0)
                : convert(t.total || 0, txCurrency, selectedCurrency);

            spendingMap[day] = (spendingMap[day] || 0) + amount;
        });

        let cumulative = 0;
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            cumulative += (spendingMap[day] || 0);
            return {
                day,
                amount: parseFloat(cumulative.toFixed(2))
            };
        });
    }, [transactions, selectedCurrency, convert]);

    const today = new Date().getDate();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                    dataKey="day"
                    stroke="#475569"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${getCurrencySymbol()}${value}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                    itemStyle={{ color: '#10b981' }}
                    cursor={{ stroke: '#334155', strokeWidth: 2 }}
                />
                <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                />
                <ReferenceLine x={today} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#ef4444', fontSize: 10 }} />

            </AreaChart>
        </ResponsiveContainer>
    );
};

export default BurnVelocityChart;

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SpendingChart = ({ transactions }) => {
    const data = useMemo(() => {
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const spendingMap = {};

        transactions.forEach(t => {
            const date = new Date(t.date || t.createdAt?.toDate());
            const day = date.getDate();
            spendingMap[day] = (spendingMap[day] || 0) + (t.total || 0);
        });

        const chartData = [];
        let cumulative = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            cumulative += (spendingMap[i] || 0);
            chartData.push({
                day: i,
                amount: cumulative
            });
        }
        return chartData;
    }, [transactions]);

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
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#475569"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    width={50}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value) => [`$${value}`, 'Total Spent']}
                    labelFormatter={(day) => `Day ${day}`}
                />
                <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                />
                <ReferenceLine
                    x={today}
                    stroke="#6366f1"
                    strokeDasharray="3 3"
                    label={{ position: 'top', value: 'Today', fill: '#6366f1', fontSize: 10 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default SpendingChart;

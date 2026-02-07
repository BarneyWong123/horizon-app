import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const CashFlowForecast = ({ transactions, accounts, stats, daysToForecast = 30 }) => {
    const { convert, formatAmount, selectedCurrency } = useCurrency();

    const forecast = useMemo(() => {
        if (!transactions || transactions.length < 5) {
            return null;
        }

        // Use dashboard stats if provided for consistency, otherwise calculate
        const currentBalanceUSD = stats?.totalBalance !== undefined
            ? stats.totalBalance
            : accounts?.reduce((sum, acc) => {
                const acctCurrency = acc.currency || selectedCurrency;
                return sum + (acctCurrency === 'USD' ? (acc.balance || 0) : convert(acc.balance || 0, acctCurrency, 'USD'));
            }, 0) || 0;

        const dailyNetRateUSD = stats?.dailyBurn !== undefined
            ? -stats.dailyBurn // dailyBurn in dashboard is expense - income, so net is negative burn
            : (() => {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const recent = transactions.filter(t => {
                    const txDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                    return txDate >= thirtyDaysAgo;
                });

                const expenses = recent.filter(t => t.type === 'expense' || t.category !== 'income')
                    .reduce((sum, t) => {
                        const txCurrency = t.currency || 'USD';
                        return sum + (txCurrency === 'USD' ? (t.total || 0) : convert(t.total || 0, txCurrency, 'USD'));
                    }, 0);

                const income = recent.filter(t => t.type === 'income' || t.category === 'income')
                    .reduce((sum, t) => {
                        const txCurrency = t.currency || 'USD';
                        return sum + (txCurrency === 'USD' ? (t.total || 0) : convert(t.total || 0, txCurrency, 'USD'));
                    }, 0);

                const days = Math.max(1, new Date().getDate());
                return (income - expenses) / days;
            })();

        // Generate forecast points (calculate in USD)
        const forecastPoints = [];
        for (let i = 0; i <= daysToForecast; i += 7) {
            const projectedBalanceUSD = currentBalanceUSD + (dailyNetRateUSD * i);
            forecastPoints.push({
                day: i,
                balance: projectedBalanceUSD,
                label: i === 0 ? 'Today' : `Day ${i}`
            });
        }

        const daysUntilZero = dailyNetRateUSD < 0 && currentBalanceUSD > 0
            ? Math.floor(currentBalanceUSD / Math.abs(dailyNetRateUSD))
            : null;

        return {
            currentBalance: currentBalanceUSD,
            projectedBalance: currentBalanceUSD + (dailyNetRateUSD * daysToForecast),
            dailyNetRate: dailyNetRateUSD,
            forecastPoints,
            daysUntilZero,
            trend: dailyNetRateUSD >= 0 ? 'positive' : 'negative'
        };
    }, [transactions, accounts, stats, convert, selectedCurrency, daysToForecast]);

    const { getCurrencySymbol } = useCurrency();

    if (!forecast) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <h3 className="text-white font-bold">Cash Flow Forecast</h3>
                </div>
                <p className="text-slate-500 text-sm">Log more transactions to see your forecast</p>
            </div>
        );
    }

    // Use user's primary currency for display

    // Find min and max for scaling the wave
    const minBalance = Math.min(...forecast.forecastPoints.map(p => p.balance));
    const maxBalance = Math.max(...forecast.forecastPoints.map(p => p.balance));
    const range = maxBalance - minBalance || 1;

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {forecast.trend === 'positive' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <TrendingDown className="w-5 h-5 text-amber-400" />
                    )}
                    <h3 className="text-white font-bold">30-Day Forecast</h3>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${forecast.trend === 'positive'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {forecast.trend === 'positive' ? '+' : ''}{formatAmount(forecast.dailyNetRate)}/day
                </span>
            </div>

            {/* Cash Flow Wave Visualization */}
            <div className="relative h-20 mb-4">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={forecast.trend === 'positive' ? '#10b981' : '#f59e0b'} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={forecast.trend === 'positive' ? '#10b981' : '#f59e0b'} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                        d={`
                            M 0 ${80 - ((forecast.forecastPoints[0].balance - minBalance) / range) * 60}
                            ${forecast.forecastPoints.map((point, i) => {
                            const x = (i / (forecast.forecastPoints.length - 1)) * 100;
                            const y = 80 - ((point.balance - minBalance) / range) * 60;
                            return `L ${x}% ${y}`;
                        }).join(' ')}
                            L 100% 80 L 0 80 Z
                        `}
                        fill="url(#waveGradient)"
                    />

                    {/* Line */}
                    <path
                        d={`
                            M 0 ${80 - ((forecast.forecastPoints[0].balance - minBalance) / range) * 60}
                            ${forecast.forecastPoints.map((point, i) => {
                            const x = (i / (forecast.forecastPoints.length - 1)) * 100;
                            const y = 80 - ((point.balance - minBalance) / range) * 60;
                            return `L ${x}% ${y}`;
                        }).join(' ')}
                        `}
                        fill="none"
                        stroke={forecast.trend === 'positive' ? '#10b981' : '#f59e0b'}
                        strokeWidth="2"
                    />

                    {/* Today marker */}
                    <circle cx="0%" cy={80 - ((forecast.forecastPoints[0].balance - minBalance) / range) * 60} r="4" fill="#fff" />
                </svg>

                {/* Zero line if balance goes negative */}
                {minBalance < 0 && (
                    <div
                        className="absolute left-0 right-0 border-t border-red-500/50 border-dashed"
                        style={{ top: `${80 - ((0 - minBalance) / range) * 60}px` }}
                    >
                        <span className="absolute right-0 -top-3 text-xs text-red-400">$0</span>
                    </div>
                )}
            </div>

            {/* Forecast Summary */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Now</p>
                    <p className="text-white font-bold">{formatAmount(forecast.currentBalance)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">In 30 days</p>
                    <p className={`font-bold ${forecast.projectedBalance >= 0 ? 'text-white' : 'text-amber-400'}`}>
                        {formatAmount(forecast.projectedBalance)}
                    </p>
                </div>
            </div>

            {/* Warning if heading towards $0 */}
            {forecast.daysUntilZero && forecast.daysUntilZero <= 60 && (
                <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                        At current pace, balance reaches $0 in ~{forecast.daysUntilZero} days
                    </p>
                </div>
            )}
        </div>
    );
};

export default CashFlowForecast;

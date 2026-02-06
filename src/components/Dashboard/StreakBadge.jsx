import React from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';

const StreakBadge = ({ streak, longestStreak, compact = false }) => {
    const getFlameColor = (days) => {
        if (days >= 100) return 'text-purple-400';
        if (days >= 30) return 'text-amber-400';
        if (days >= 7) return 'text-orange-400';
        return 'text-orange-300';
    };

    const getBackgroundGradient = (days) => {
        if (days >= 100) return 'from-purple-500/20 to-pink-500/20';
        if (days >= 30) return 'from-amber-500/20 to-orange-500/20';
        if (days >= 7) return 'from-orange-500/20 to-red-500/20';
        return 'from-slate-700/50 to-slate-800/50';
    };

    if (compact) {
        return (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${getBackgroundGradient(streak)} border border-slate-700/50`}>
                <Flame className={`w-4 h-4 ${getFlameColor(streak)} ${streak > 0 ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-bold text-white">{streak}</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundGradient(streak)} border border-slate-700/50 p-4`}>
            {/* Animated background glow for active streaks */}
            {streak >= 7 && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10 animate-pulse" />
            )}

            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center`}>
                        <Flame className={`w-7 h-7 ${getFlameColor(streak)} ${streak > 0 ? 'animate-bounce' : ''}`}
                            style={{ animationDuration: '2s' }}
                        />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide font-bold">Daily Streak</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{streak}</span>
                            <span className="text-slate-400 text-sm">days</span>
                        </div>
                    </div>
                </div>

                {/* Best streak indicator */}
                {longestStreak > 0 && longestStreak >= streak && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-300">Best: {longestStreak}</span>
                    </div>
                )}
            </div>

            {/* Motivational text */}
            <p className="mt-3 text-sm text-slate-300">
                {streak === 0 && "Log your first transaction to start!"}
                {streak === 1 && "Great start! Come back tomorrow 💪"}
                {streak >= 2 && streak < 7 && `${7 - streak} more days to your first milestone!`}
                {streak === 7 && "🎉 One week! You're building a habit!"}
                {streak > 7 && streak < 30 && "Keep it up! You're doing amazing!"}
                {streak >= 30 && "🏆 You're a budgeting legend!"}
            </p>

            {/* Milestone progress bar */}
            {streak > 0 && streak < 30 && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Next milestone</span>
                        <span>{streak < 7 ? '7 days' : '30 days'}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                            style={{
                                width: `${streak < 7 ? (streak / 7) * 100 : ((streak - 7) / 23) * 100}%`
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreakBadge;

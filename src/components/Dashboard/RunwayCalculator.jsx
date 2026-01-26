import React, { useState } from 'react';
import { Clock, RefreshCcw } from 'lucide-react';

const RunwayCalculator = ({ transactions, burnRate }) => {
    const [balance, setBalance] = useState(5000); // Default simulated balance
    const [isEditing, setIsEditing] = useState(false);

    const runwayDays = burnRate > 0 ? Math.floor(balance / burnRate) : Infinity;

    const getRunwayStatus = () => {
        if (runwayDays > 30) return 'text-emerald-500';
        if (runwayDays > 14) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="card relative group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 font-bold text-xs tracking-widest uppercase">Runway Days</span>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-slate-600 hover:text-brand-emerald transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <input
                        type="number"
                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-brand-emerald outline-none"
                        value={balance}
                        onChange={(e) => setBalance(Number(e.target.value))}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                    />
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Enter Current Balance</p>
                </div>
            ) : (
                <>
                    <p className={`text-3xl font-black ${getRunwayStatus()}`}>
                        {runwayDays === Infinity ? '∞' : runwayDays} <span className="text-sm font-bold uppercase tracking-widest ml-1">Days Remaining</span>
                    </p>
                    <div className="mt-4 flex items-center space-x-2">
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${runwayDays > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min((runwayDays / 60) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RunwayCalculator;

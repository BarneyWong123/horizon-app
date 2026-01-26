import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getAccountTypeById } from '../../data/categories';

const AccountCard = ({ account, isSelected, onClick, compact = false }) => {
    const accountType = getAccountTypeById(account.type);
    const IconComponent = LucideIcons[account.icon || accountType.icon] || LucideIcons.Wallet;
    const color = account.color || accountType.color;

    if (compact) {
        return (
            <button
                onClick={onClick}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                        ? 'text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                style={isSelected ? { backgroundColor: color } : {}}
            >
                <IconComponent className="w-4 h-4" />
                <span>{account.name}</span>
            </button>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/50 ${isSelected ? 'border-emerald-500' : 'border-slate-800'
                }`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <IconComponent className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                    <p className="font-medium text-white">{account.name}</p>
                    <p className="text-xs text-slate-500">{accountType.name}</p>
                </div>
            </div>
            <p className="text-2xl font-bold text-white">
                ${(account.balance || 0).toLocaleString()}
            </p>
        </div>
    );
};

export default AccountCard;

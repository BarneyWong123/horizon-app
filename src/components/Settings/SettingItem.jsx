import React from 'react';
import { ChevronRight } from 'lucide-react';

const SettingItem = ({ icon: Icon, label, value, onClick, type = 'arrow', color = 'text-slate-400' }) => {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 transition-colors"
            style={{ borderBottom: '1px solid var(--border-default)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
                    style={{ backgroundColor: 'var(--bg-input)' }}
                >
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
            </div>

            <div className="flex items-center gap-2">
                {value && type !== 'toggle' && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{value}</span>}
                {type === 'arrow' && <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                {type === 'toggle' && (
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : ''}`} style={!value ? { backgroundColor: 'var(--bg-input)' } : {}}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-4' : ''}`} />
                    </div>
                )}
            </div>
        </button>
    );
};

export default SettingItem;

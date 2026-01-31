import React from 'react';

const SettingsSection = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="font-bold text-xs uppercase tracking-wider mb-3 px-2" style={{ color: 'var(--text-muted)' }}>{title}</h3>
        <div
            className="rounded-xl overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-default)'
            }}
        >
            {children}
        </div>
    </div>
);

export default SettingsSection;

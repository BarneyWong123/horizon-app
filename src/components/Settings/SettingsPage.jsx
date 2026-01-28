import React, { useState, useEffect } from 'react';
import {
    User, Moon, Sun, Bell, Shield, Wallet, Trash2,
    ChevronRight, LogOut, Settings2, LayoutDashboard, CreditCard, Lock, X
} from 'lucide-react';

import { CURRENCIES } from '../../data/currencies';

import { FirebaseService } from '../../services/FirebaseService';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import CategorySettingsModal from './CategorySettingsModal';

const SettingsPage = ({ user }) => {
    const { theme, toggleTheme } = useTheme();
    const { selectedCurrency, setCurrency } = useCurrency();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(true);
    const [securityPin, setSecurityPin] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await FirebaseService.logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
            showToast('Failed to logout', 'error');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await FirebaseService.deleteUserData(user.uid);
            showToast('Account data deleted successfully', 'success');
            await FirebaseService.logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete data. Try logging in again.', 'error');
            setDeleteModalOpen(false);
        }
    };

    const Section = ({ title, children }) => (
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

    const SettingItem = ({ icon: Icon, label, value, onClick, type = 'arrow', color = 'text-slate-400' }) => (
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

    return (
        <div className="max-w-2xl mx-auto pb-24 px-4 md:px-0 mt-6">
            <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h1>

            {/* Profile Section */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-2xl border border-emerald-500/30">
                    {user.email?.[0].toUpperCase()}
                </div>
                <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user.email}</h2>
                    <p className="text-emerald-500 text-sm">Free Plan</p>
                </div>
            </div>

            <Section title="General">
                <SettingItem
                    icon={Wallet}
                    label="Primary Currency"
                    value={selectedCurrency}
                    onClick={() => setCurrencyModalOpen(true)}
                    color="text-blue-500"
                />
                <SettingItem
                    icon={LayoutDashboard}
                    label="Manage Categories"
                    onClick={() => setShowCategoryModal(true)}
                    color="text-purple-500"
                />
            </Section>

            <Section title="Appearance">
                <SettingItem
                    icon={theme === 'dark' ? Moon : Sun}
                    label="Dark Mode"
                    type="toggle"
                    value={theme === 'dark'}
                    onClick={toggleTheme}
                    color="text-amber-500"
                />
            </Section>

            <Section title="Notifications & Security">
                <SettingItem
                    icon={Bell}
                    label="Push Notifications"
                    type="toggle"
                    value={notifications}
                    onClick={() => {
                        setNotifications(!notifications);
                        showToast(`Notifications ${!notifications ? 'enabled' : 'disabled'}`, 'success');
                    }}
                    color="text-red-500"
                />
                <SettingItem
                    icon={Lock}
                    label="App Lock (FaceID / Pin)"
                    type="toggle"
                    value={securityPin}
                    onClick={() => {
                        setSecurityPin(!securityPin);
                        showToast(`Security check ${!securityPin ? 'enabled' : 'disabled'}`, 'success');
                    }}
                    color="text-emerald-500"
                />
            </Section>

            <Section title="Data">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Log Out</span>
                </button>
                <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-500/10 transition-colors text-red-500"
                >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Delete Account & Data</span>
                </button>
            </Section>

            {/* Modals */}
            <CategorySettingsModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
            />

            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        className="rounded-2xl p-6 max-w-sm w-full"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Account?</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                            This action cannot be undone. All your data, transactions, and categories will be permanently lost.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currencyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        className="rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Select Primary Currency</h3>
                            <button onClick={() => setCurrencyModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2">
                            {CURRENCIES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => {
                                        setCurrency(c.code);
                                        setCurrencyModalOpen(false);
                                        showToast(`Primary currency set to ${c.code}`, 'success');
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
                                    style={{
                                        backgroundColor: selectedCurrency === c.code ? 'var(--bg-input)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => { if (selectedCurrency !== c.code) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                                    onMouseLeave={(e) => { if (selectedCurrency !== c.code) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{c.flag}</span>
                                        <div className="text-left">
                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{c.code}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.name}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500">
                                        {c.symbol}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

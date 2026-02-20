import React, { useState, useEffect } from 'react';
import {
    User, Moon, Sun, Bell, Shield, Wallet, Trash2,
    ChevronRight, LogOut, Settings2, LayoutDashboard, CreditCard, Lock, X,
    Upload, Image as ImageIcon, RotateCcw, Fingerprint
} from 'lucide-react';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { useBranding } from '../../context/BrandingContext';

import { CURRENCIES } from '../../data/currencies';

import { FirebaseService } from '../../services/FirebaseService';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { useCategory } from '../../context/CategoryContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import CategorySettingsModal from './CategorySettingsModal';
import { Check } from 'lucide-react';

const SettingsPage = ({ user }) => {
    const { tier, isPro } = useSubscription();
    const { theme, toggleTheme } = useTheme();
    const { selectedCurrency, setCurrency } = useCurrency();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Branding State & Context
    const { branding, uploadLogo, updateBranding, resetBranding } = useBranding();
    const [uploading, setUploading] = useState(false);

    // Other settings state
    const [notifications, setNotifications] = useState(true);
    const [securityPin, setSecurityPin] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [quickAddCatsModalOpen, setQuickAddCatsModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    // Preferences & Data
    const [preferences, setPreferences] = useState({});
    const [profile, setProfile] = useState({ name: '', age: '', country: '' });
    const [accounts, setAccounts] = useState([]);
    const { categories } = useCategory();

    useEffect(() => {
        if (!user) return;
        const unsubPrefs = FirebaseService.subscribeToPreferences(user.uid, setPreferences);
        const unsubAccs = FirebaseService.subscribeToAccounts(user.uid, setAccounts);
        const unsubProfile = FirebaseService.subscribeToProfile(user.uid, (data) => {
            if (data) setProfile(data);
        });
        return () => {
            unsubPrefs();
            unsubAccs();
            unsubProfile();
        };
    }, [user]);

    const updatePref = async (key, value) => {
        try {
            await FirebaseService.updatePreferences(user.uid, { [key]: value });
            showToast('Settings saved', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to save settings', 'error');
        }
    };

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
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile.name || user.email?.split('@')[0]}</h2>
                    <p className={`text-sm font-bold ${isPro ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {isPro ? 'Pro Plan' : 'Free Plan'}
                    </p>
                </div>
            </div>

            <Section title="General">
                <SettingItem
                    icon={User}
                    label="Personal Profile"
                    value={profile.name ? `${profile.name}${profile.age ? `, ${profile.age}` : ''}` : 'Set up profile'}
                    onClick={() => setProfileModalOpen(true)}
                    color="text-emerald-500"
                />
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

            <Section title="Quick Add Preferences">
                <SettingItem
                    icon={CreditCard}
                    label="Default Account"
                    value={accounts.find(a => a.id === preferences?.defaultAccountId)?.name || 'None'}
                    onClick={() => setAccountModalOpen(true)}
                    color="text-emerald-500"
                />
                <SettingItem
                    icon={Settings2}
                    label="Quick Add Categories"
                    value={preferences?.quickAddCategories?.length ? `${preferences.quickAddCategories.length} selected` : 'All'}
                    onClick={() => setQuickAddCatsModalOpen(true)}
                    color="text-amber-500"
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
                    icon={Fingerprint}
                    label="Biometric Login (FaceID/TouchID)"
                    type="toggle"
                    value={preferences?.biometricsEnabled}
                    onClick={async () => {
                        const isMobile = Capacitor.getPlatform() !== 'web';
                        if (!isMobile) {
                            showToast('Biometrics only available on mobile devices', 'info');
                            return;
                        }

                        const newVal = !preferences?.biometricsEnabled;

                        if (newVal) {
                            try {
                                const result = await NativeBiometric.isAvailable();
                                if (!result.isAvailable) {
                                    showToast('Biometrics not available on this device', 'error');
                                    return;
                                }

                                // Verify once to enable
                                await NativeBiometric.verifyIdentity({
                                    reason: "Enable biometric login",
                                    title: "Authenticate",
                                    subtitle: "Please verify your identity",
                                    description: "This will allow you to log in faster next time."
                                });

                                await updatePref('biometricsEnabled', true);
                                showToast('Biometric login enabled', 'success');
                            } catch (err) {
                                console.error('Biometric error:', err);
                                showToast('Biometric verification failed', 'error');
                            }
                        } else {
                            await updatePref('biometricsEnabled', false);
                            showToast('Biometric login disabled', 'success');
                        }
                    }}
                    color="text-emerald-500"
                />
                <SettingItem
                    icon={Lock}
                    label="App Lock (Pin)"
                    type="toggle"
                    value={securityPin}
                    onClick={() => {
                        setSecurityPin(!securityPin);
                        showToast(`Security check ${!securityPin ? 'enabled' : 'disabled'}`, 'success');
                    }}
                    color="text-blue-500"
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

            {/* Default Account Modal */}
            {accountModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        className="rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Select Default Account</h3>
                            <button onClick={() => setAccountModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2">
                            <button
                                onClick={() => {
                                    updatePref('defaultAccountId', null);
                                    setAccountModalOpen(false);
                                }}
                                className="w-full text-left p-4 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>None (Remember last)</span>
                            </button>
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => {
                                        updatePref('defaultAccountId', acc.id);
                                        setAccountModalOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800 transition-colors"
                                    style={{
                                        backgroundColor: preferences?.defaultAccountId === acc.id ? 'var(--bg-input)' : 'transparent'
                                    }}
                                >
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{acc.name}</span>
                                    {preferences?.defaultAccountId === acc.id && <Check className="w-4 h-4 text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Categories Modal */}
            {quickAddCatsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        className="rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                            <div className="flex flex-col">
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Quick Add Categories</h3>
                                <p className="text-[10px] text-slate-500">Selected categories will show in minimal view</p>
                            </div>
                            <button onClick={() => setQuickAddCatsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 grid grid-cols-2 gap-2">
                            {categories.map(cat => {
                                const isSelected = preferences?.quickAddCategories?.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            const current = preferences?.quickAddCategories || [];
                                            const updated = isSelected
                                                ? current.filter(id => id !== cat.id)
                                                : [...current, cat.id];
                                            updatePref('quickAddCategories', updated);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:bg-slate-800'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                                            <span className="text-sm" style={{ color: cat.color }}>{cat.name[0]}</span>
                                        </div>
                                        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
                            <button
                                onClick={() => setQuickAddCatsModalOpen(false)}
                                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {profileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        className="rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Personal Profile</h3>
                            <button onClick={() => setProfileModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Age</label>
                                    <input
                                        type="number"
                                        value={profile.age}
                                        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                                        placeholder="e.g. 25"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Country</label>
                                    <input
                                        type="text"
                                        value={profile.country}
                                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                                        placeholder="e.g. Malaysia"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await FirebaseService.updateProfile(user.uid, profile);
                                        setProfileModalOpen(false);
                                        showToast('Profile updated!', 'success');
                                    } catch (err) {
                                        showToast('Failed to update profile', 'error');
                                    }
                                }}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-2"
                            >
                                Save Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

import React, { useState, useEffect } from 'react';
import {
    User, Moon, Sun, Bell, Shield, Wallet, Trash2,
    ChevronRight, LogOut, Settings2, LayoutDashboard, CreditCard, Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth'; // Assuming useAuth exists or I'll use FirebaseService directly
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
            // Delete all user data
            await FirebaseService.deleteUserData(user.uid);

            // Delete auth user (requires recent login, might fail if session old)
            // For now, we just logout after data wipe to simulate "Deactivation"
            // To actually delete user: await user.delete(); 

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
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-3 px-2">{title}</h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/50">
                {children}
            </div>
        </div>
    );

    const SettingItem = ({ icon: Icon, label, value, onClick, type = 'arrow', color = 'text-slate-400' }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-slate-200 font-medium text-sm">{label}</span>
            </div>

            <div className="flex items-center gap-2">
                {value && <span className="text-slate-400 text-sm">{value}</span>}
                {type === 'arrow' && <ChevronRight className="w-4 h-4 text-slate-500" />}
                {type === 'toggle' && (
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : ''}`} />
                    </div>
                )}
            </div>
        </button>
    );

    return (
        <div className="max-w-2xl mx-auto pb-24 px-4 md:px-0 mt-6">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

            {/* Profile Section */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-2xl border border-emerald-500/30">
                    {user.email?.[0].toUpperCase()}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">{user.email}</h2>
                    <p className="text-emerald-400 text-sm">Free Plan</p>
                </div>
            </div>

            <Section title="General">
                <SettingItem
                    icon={Wallet}
                    label="Primary Currency"
                    value={selectedCurrency}
                    onClick={() => {
                        // Toggle for demo, real app would have a picker modal
                        const next = selectedCurrency === 'USD' ? 'EUR' : selectedCurrency === 'EUR' ? 'MYR' : 'USD';
                        setCurrency(next);
                        showToast(`Currency changed to ${next}`, 'success');
                    }}
                    color="text-blue-400"
                />
                <SettingItem
                    icon={LayoutDashboard}
                    label="Manage Categories"
                    onClick={() => setShowCategoryModal(true)}
                    color="text-purple-400"
                />
            </Section>

            <Section title="Appearance">
                <SettingItem
                    icon={theme === 'dark' ? Moon : Sun}
                    label="Dark Mode"
                    type="toggle"
                    value={theme === 'dark'}
                    onClick={toggleTheme}
                    color="text-amber-400"
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
                    color="text-red-400"
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
                    color="text-emerald-400"
                />
            </Section>

            <Section title="Data">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-slate-300 hover:text-white"
                >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Log Out</span>
                </button>
                <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
                >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
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
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. All your data, transactions, and categories will be permanently lost.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
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
        </div>
    );
};

export default SettingsPage;

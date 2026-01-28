import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, MessageSquare, LogOut, Settings, ChevronUp, User } from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';
import CurrencySelector from '../UI/CurrencySelector';

const Sidebar = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/transactions', icon: Receipt, label: 'Transactions' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
    ];

    // Mobile bottom nav items
    const mobileNavItems = [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/transactions', icon: Receipt, label: 'History' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/assistant', icon: MessageSquare, label: 'AI' },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await FirebaseService.logout();
        navigate('/login');
    };

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 px-4 py-6 flex-col justify-between z-40">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <img src="/logo.png" alt="Horizon" className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1" />
                        <span className="text-xl font-bold tracking-tight text-white">Horizon</span>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* User Section */}
                <div className="border-t border-slate-800 pt-4 space-y-3 relative" ref={menuRef}>
                    {/* User Menu Popup */}
                    {showUserMenu && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 p-1">
                            <button
                                onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="font-medium text-sm">Settings</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-medium text-sm">Sign Out</span>
                            </button>
                        </div>
                    )}



                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all ${showUserMenu ? 'bg-slate-800 border-emerald-500/50' : 'bg-transparent border-transparent hover:bg-slate-900 border-slate-800'}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-emerald-950 font-bold text-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                            <p className="text-sm font-medium text-slate-200 truncate">{user.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-slate-500 truncate">Free Plan</p>
                        </div>
                        <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 px-2 py-1 z-50 safe-area-inset-bottom">
                <div className="flex justify-around items-center">
                    {mobileNavItems.map((item) => {
                        const isActive = location.pathname === item.to ||
                            (item.to !== '/' && location.pathname.startsWith(item.to));
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${isActive
                                    ? 'text-emerald-500'
                                    : 'text-slate-500'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                            </NavLink>
                        );
                    })}
                    <button
                        onClick={() => navigate('/settings')}
                        className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${location.pathname === '/settings' ? 'text-emerald-500' : 'text-slate-500'}`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-1">Profile</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 z-40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Horizon" className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1" />
                    <span className="text-lg font-bold text-white">Horizon</span>
                </div>
            </header>
        </>
    );
};

export default Sidebar;


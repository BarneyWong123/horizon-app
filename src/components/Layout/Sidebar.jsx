import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    MessageSquare,
    LogOut,
    Settings,
    ChevronUp,
    User,
    ChevronDown,
    PanelLeftClose,
    PanelLeftOpen,
    Crown
} from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { FirebaseService } from '../../services/FirebaseService';

const Sidebar = ({ user, isCollapsed, onToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { branding } = useBranding();
    const { isPro, tier } = useSubscription();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);

    const logoStyle = {
        transform: `scale(${branding.zoom})`,
        objectPosition: `${branding.posX}% ${branding.posY}%`,
        objectFit: 'cover'
    };

    const logoSrc = branding.logoUrl || "/horizon_logo.png";

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
            <aside
                className={`hidden md:flex fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out px-4 py-6 flex-col justify-between z-40 border-r ${isCollapsed ? 'w-20' : 'w-64'}`}
                style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)'
                }}
            >
                <div>
                    {/* Logo Section */}
                    <div className={`flex items-center mb-8 px-2 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className={`rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm flex-shrink-0 ${isCollapsed ? 'w-10 h-10' : 'w-14 h-14'}`} style={{ backgroundColor: branding.logoUrl ? 'var(--bg-card)' : 'var(--bg-input)' }}>
                            <img
                                src={logoSrc}
                                alt="Horizon"
                                className="w-full h-full transition-transform"
                                style={logoStyle}
                            />
                        </div>
                        {!isCollapsed && <span className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-4" style={{ color: 'var(--text-primary)' }}>Horizon</span>}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'} ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : ''
                                    }`
                                }
                                title={isCollapsed ? item.label : ''}
                                style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">{item.label}</span>}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Toggle Button */}
                    <button
                        onClick={onToggle}
                        className={`flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : (
                            <div className="flex items-center gap-3 w-full px-1">
                                <PanelLeftClose className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Collapse</span>
                            </div>
                        )}
                    </button>

                    {/* User Section */}
                    <div className="pt-4 space-y-3 relative border-t" style={{ borderColor: 'var(--border-default)' }} ref={menuRef}>
                        {/* User Menu Popup */}
                        {showUserMenu && (
                            <div
                                className={`absolute bottom-full left-0 mb-2 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 p-1 ${isCollapsed ? 'w-48 -left-2' : 'w-full'}`}
                                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                            >
                                <button
                                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left hover:bg-emerald-500/10"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="font-medium text-sm">Settings</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-medium text-sm">Sign Out</span>
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`flex items-center rounded-xl border transition-all duration-300 ${isCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2 w-full'}`}
                            style={{
                                backgroundColor: showUserMenu ? 'var(--bg-input)' : 'transparent',
                                borderColor: showUserMenu ? '#10b981' : 'var(--border-default)'
                            }}
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 overflow-hidden text-left">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <p className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>{user.email?.split('@')[0]}</p>
                                            {isPro && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                                        </div>
                                        <p className="text-[10px] truncate" style={{ color: isPro ? '#fbbf24' : 'var(--text-muted)' }}>
                                            {isPro ? 'Pro Plan' : 'Free Plan'}
                                        </p>
                                    </div>
                                    <ChevronUp className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 px-2 py-1 z-50 safe-area-inset-bottom border-t"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
                <div className="flex justify-around items-center">
                    {mobileNavItems.map((item) => {
                        const isActive = location.pathname === item.to ||
                            (item.to !== '/' && location.pathname.startsWith(item.to));
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${isActive ? 'text-emerald-500' : 'text-slate-500'
                                    }`}
                                style={isActive ? {} : { color: 'var(--text-muted)' }}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                            </NavLink>
                        );
                    })}
                    <button
                        onClick={() => navigate('/settings')}
                        className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${location.pathname === '/settings' ? 'text-emerald-500' : 'text-slate-500'
                            }`}
                        style={location.pathname === '/settings' ? {} : { color: 'var(--text-muted)' }}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-1">Profile</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Header */}
            <header
                className="md:hidden fixed top-0 left-0 right-0 backdrop-blur-sm px-4 py-3 z-40 flex items-center justify-between border-b"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm" style={{ backgroundColor: branding.logoUrl ? 'var(--bg-card)' : 'var(--bg-input)' }}>
                        <img
                            src={logoSrc}
                            alt="Horizon"
                            className="w-full h-full"
                            style={logoStyle}
                        />
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Horizon</span>
                </div>
            </header>
        </>
    );
};

export default Sidebar;

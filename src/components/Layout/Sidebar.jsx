import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Scan, Receipt, Wallet, MessageSquare, LogOut, Compass } from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';

const Sidebar = ({ user }) => {
    const location = useLocation();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/transactions', icon: Receipt, label: 'Transactions' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/scan', icon: Scan, label: 'Scan Receipt' },
        { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
    ];

    // Mobile bottom nav items (fewer items for cleaner mobile UX)
    const mobileNavItems = [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/transactions', icon: Receipt, label: 'History' },
        { to: '/scan', icon: Scan, label: 'Scan' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/assistant', icon: MessageSquare, label: 'AI' },
    ];

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 px-4 py-6 flex-col justify-between z-40">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <Compass className="text-white w-6 h-6" />
                        </div>
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
                <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-3 px-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <span className="text-xs font-bold text-slate-400">
                                {user.email?.[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-slate-200 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => FirebaseService.logout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium text-sm">Sign Out</span>
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
                </div>
            </nav>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 z-40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Compass className="text-white w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-white">Horizon</span>
                </div>
                <button
                    onClick={() => FirebaseService.logout()}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>
        </>
    );
};

export default Sidebar;


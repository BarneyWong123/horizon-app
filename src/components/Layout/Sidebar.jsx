import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scan, Receipt, Wallet, MessageSquare, LogOut, Compass } from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';

const Sidebar = ({ user }) => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/transactions', icon: Receipt, label: 'Transactions' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/scan', icon: Scan, label: 'Scan Receipt' },
        { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 px-4 py-6 flex flex-col justify-between">
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
    );
};

export default Sidebar;

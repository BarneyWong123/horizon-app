import React, { useState, useEffect } from 'react';
import { Users, Crown, Shield, Search, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { FirebaseService } from '../../services/FirebaseService';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ user }) => {
    const { isAdmin } = useSubscription();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUser, setUpdatingUser] = useState(null);

    // Redirect non-admins
    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
        }
    }, [isAdmin, navigate]);

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const allUsers = await FirebaseService.getAllUsers();
                setUsers(allUsers);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                showToast('Failed to load users', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const handleTierChange = async (targetUid, newTier) => {
        setUpdatingUser(targetUid);
        try {
            await FirebaseService.updateUserTier(targetUid, newTier);
            setUsers(prev => prev.map(u =>
                u.uid === targetUid
                    ? { ...u, subscription: { ...u.subscription, tier: newTier } }
                    : u
            ));
            showToast(`User tier updated to ${newTier}`, 'success');
        } catch (err) {
            console.error('Failed to update tier:', err);
            showToast('Failed to update user tier', 'error');
        } finally {
            setUpdatingUser(null);
        }
    };

    const refreshUsers = async () => {
        setLoading(true);
        try {
            const allUsers = await FirebaseService.getAllUsers();
            setUsers(allUsers);
            showToast('User list refreshed', 'success');
        } catch (err) {
            showToast('Failed to refresh', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase();
        return (
            u.email?.toLowerCase().includes(query) ||
            u.displayName?.toLowerCase().includes(query) ||
            u.uid.toLowerCase().includes(query)
        );
    });

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                        <p className="text-slate-400 text-sm">Manage users and subscription tiers</p>
                    </div>
                </div>
                <button
                    onClick={refreshUsers}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wide font-bold">Total Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wide font-bold">Pro Users</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">
                        {users.filter(u => u.subscription?.tier === 'pro').length}
                    </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wide font-bold">Free Users</p>
                    <p className="text-2xl font-bold text-slate-300 mt-1">
                        {users.filter(u => u.subscription?.tier !== 'pro').length}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search by email, name, or UID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
            </div>

            {/* User List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {filteredUsers.map((u) => (
                            <div key={u.uid} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold">
                                            {(u.email || u.displayName || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-medium truncate">
                                            {u.displayName || u.email || 'Unknown User'}
                                        </p>
                                        <p className="text-slate-500 text-xs truncate">
                                            {u.email || u.uid}
                                        </p>
                                    </div>
                                </div>

                                {/* Tier Selector */}
                                <div className="flex items-center gap-3">
                                    {u.subscription?.tier === 'pro' && (
                                        <Crown className="w-4 h-4 text-amber-500" />
                                    )}
                                    <div className="relative">
                                        <select
                                            value={u.subscription?.tier || 'free'}
                                            onChange={(e) => handleTierChange(u.uid, e.target.value)}
                                            disabled={updatingUser === u.uid}
                                            className={`appearance-none bg-slate-800 border rounded-lg px-4 py-2 pr-8 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${u.subscription?.tier === 'pro'
                                                    ? 'border-amber-500/50 text-amber-400'
                                                    : 'border-slate-700 text-slate-300'
                                                }`}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                        </select>
                                        {updatingUser === u.uid ? (
                                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                                        ) : (
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Note */}
            <p className="text-center text-slate-600 text-xs">
                Logged in as Super Admin • {user?.email}
            </p>
        </div>
    );
};

export default AdminPanel;

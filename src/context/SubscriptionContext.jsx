import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseService } from '../services/FirebaseService';
import { isAdminEmail } from '../config/adminConfig';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider = ({ children, user }) => {
    const [tier, setTier] = useState('free'); // 'free' | 'pro'
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!user) {
            setTier('free');
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        // Check if user is a Super Admin
        const adminStatus = isAdminEmail(user.email);
        setIsAdmin(adminStatus);

        // Subscribe to user settings/profile to get subscription status
        const unsubscribe = FirebaseService.subscribeToUserSettings(user.uid, (settings) => {
            if (settings && settings.subscription) {
                setTier(settings.subscription.tier || 'free');
            } else {
                setTier('free');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Super admins always get Pro access
    const isPro = isAdmin || tier === 'pro';

    const value = {
        tier,
        isPro,
        isAdmin,
        loading
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

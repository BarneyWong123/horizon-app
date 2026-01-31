import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseService } from '../services/FirebaseService';

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

    useEffect(() => {
        if (!user) {
            setTier('free');
            setLoading(false);
            return;
        }

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

    const isPro = tier === 'pro';

    const value = {
        tier,
        isPro,
        loading
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

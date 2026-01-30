import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseService } from '../services/FirebaseService';

const BrandingContext = createContext();

export const BrandingProvider = ({ children, user }) => {
    const [branding, setBranding] = useState({
        logoUrl: null,
        zoom: 1,
        posX: 50,
        posY: 50,
        isDefault: true
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setBranding({
                logoUrl: null,
                zoom: 1,
                posX: 0,
                posY: 0,
                isDefault: true
            });
            setLoading(false);
            return;
        }

        const unsubscribe = FirebaseService.subscribeToBranding(user.uid, (data) => {
            if (data) {
                setBranding({
                    ...data,
                    isDefault: false
                });
            } else {
                setBranding({
                    logoUrl: null,
                    zoom: 1,
                    posX: 0,
                    posY: 0,
                    isDefault: true
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateBranding = async (newData) => {
        if (!user) return;
        try {
            await FirebaseService.updateBranding(user.uid, newData);
        } catch (error) {
            console.error("Error updating branding:", error);
            throw error;
        }
    };

    const uploadLogo = async (file) => {
        if (!user) return;
        try {
            const url = await FirebaseService.uploadLogo(user.uid, file);
            await updateBranding({ logoUrl: url });
            return url;
        } catch (error) {
            console.error("Error uploading logo:", error);
            throw error;
        }
    };

    const resetBranding = async () => {
        if (!user) return;
        await FirebaseService.updateBranding(user.uid, {
            logoUrl: null,
            zoom: 1,
            posX: 0,
            posY: 0
        });
    };

    return (
        <BrandingContext.Provider value={{
            branding,
            updateBranding,
            uploadLogo,
            resetBranding,
            loading
        }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};

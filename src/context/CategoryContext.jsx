import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseService } from '../services/FirebaseService';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/categories';

const CategoryContext = createContext();

export const useCategory = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategory must be used within a CategoryProvider');
    }
    return context;
};

export const CategoryProvider = ({ children, user }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setCategories([]);
            setLoading(false);
            return;
        }

        const unsubscribe = FirebaseService.subscribeToCategories(user.uid, async (data) => {
            if (data.length === 0 && !localStorage.getItem(`categories_initialized_${user.uid}`)) {
                // Seed default categories if none exist and not yet initialized
                console.log('Seeding default categories...');
                try {
                    const promises = DEFAULT_CATEGORIES.map(cat =>
                        FirebaseService.addCategory(user.uid, cat)
                    );
                    await Promise.all(promises);
                    localStorage.setItem(`categories_initialized_${user.uid}`, 'true');
                } catch (error) {
                    console.error("Error seeding categories:", error);
                }
            } else {
                setCategories(data);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCategory = async (categoryData) => {
        return FirebaseService.addCategory(user.uid, categoryData);
    };

    const updateCategory = async (categoryId, data) => {
        return FirebaseService.updateCategory(user.uid, categoryId, data);
    };

    const deleteCategory = async (categoryId) => {
        return FirebaseService.deleteCategory(user.uid, categoryId);
    };

    const getCategoryById = (id) => {
        return categories.find(c => c.id === id) ||
            categories.find(c => c.id === 'other') ||
            DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]; // Fallback
    };

    const value = {
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};

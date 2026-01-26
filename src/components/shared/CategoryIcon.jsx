import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getCategoryById } from '../../data/categories';

const CategoryIcon = ({ categoryId, size = 'md', showLabel = false }) => {
    const category = getCategoryById(categoryId);
    const IconComponent = LucideIcons[category.icon] || LucideIcons.CircleDot;

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <div className="flex items-center gap-2">
            <div
                className={`${sizeClasses[size]} rounded-xl flex items-center justify-center`}
                style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
            >
                <IconComponent
                    className={iconSizes[size]}
                    style={{ color: category.color }}
                />
            </div>
            {showLabel && (
                <span className="text-sm font-medium text-slate-300">{category.name}</span>
            )}
        </div>
    );
};

export default CategoryIcon;

// Category definitions with icons and colors
// Icons are from lucide-react

export const CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#f59e0b' },
    { id: 'transport', name: 'Transport', icon: 'Car', color: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
    { id: 'bills', name: 'Bills & Utilities', icon: 'FileText', color: '#8b5cf6' },
    { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: '#10b981' },
    { id: 'health', name: 'Health & Fitness', icon: 'Heart', color: '#ef4444' },
    { id: 'travel', name: 'Travel', icon: 'Plane', color: '#06b6d4' },
    { id: 'income', name: 'Income', icon: 'TrendingUp', color: '#22c55e' },
    { id: 'transfer', name: 'Transfer', icon: 'ArrowLeftRight', color: '#6366f1' },
    { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#6b7280' },
];

export const ACCOUNT_TYPES = [
    { id: 'cash', name: 'Cash', icon: 'Wallet', color: '#10b981' },
    { id: 'bank', name: 'Bank Account', icon: 'Building2', color: '#3b82f6' },
    { id: 'credit', name: 'Credit Card', icon: 'CreditCard', color: '#ef4444' },
    { id: 'savings', name: 'Savings', icon: 'PiggyBank', color: '#f59e0b' },
    { id: 'investment', name: 'Investment', icon: 'TrendingUp', color: '#8b5cf6' },
];

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
export const getAccountTypeById = (id) => ACCOUNT_TYPES.find(a => a.id === id) || ACCOUNT_TYPES[0];

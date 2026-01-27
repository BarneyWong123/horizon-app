export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
];

export const getCurrencyByCode = (code) => {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
    const currency = getCurrencyByCode(currencyCode);
    const formattedNumber = Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${amount < 0 ? '-' : ''}${currency.symbol}${formattedNumber}`;
};

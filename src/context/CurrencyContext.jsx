import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CURRENCIES, getCurrencyByCode } from '../data/currencies';
import { OpenAIService } from '../services/OpenAIService';

const CurrencyContext = createContext();

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const STORAGE_KEY = 'horizon_currency_preference';
const RATES_CACHE_KEY = 'horizon_exchange_rates';

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [selectedCurrency, setSelectedCurrency] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved || 'USD';
    });

    const [exchangeRates, setExchangeRates] = useState(() => {
        const cached = localStorage.getItem(RATES_CACHE_KEY);
        if (cached) {
            const { rates, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return rates;
            }
        }
        return { USD: 1 }; // Default base rates
    });

    const [isLoadingRates, setIsLoadingRates] = useState(false);

    // Fetch exchange rates from OpenAI
    const fetchExchangeRates = useCallback(async () => {
        if (isLoadingRates) return;

        setIsLoadingRates(true);
        try {
            const rates = await OpenAIService.getExchangeRates();
            setExchangeRates(rates);
            localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
                rates,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
        } finally {
            setIsLoadingRates(false);
        }
    }, [isLoadingRates]);

    // Fetch rates on mount if cache is stale
    useEffect(() => {
        const cached = localStorage.getItem(RATES_CACHE_KEY);
        if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp >= CACHE_DURATION) {
                fetchExchangeRates();
            }
        } else {
            fetchExchangeRates();
        }
    }, []);

    // Update currency preference
    const setCurrency = useCallback((currencyCode) => {
        setSelectedCurrency(currencyCode);
        localStorage.setItem(STORAGE_KEY, currencyCode);
    }, []);

    // Convert amount from one currency to another
    const convert = useCallback((amount, fromCurrency, toCurrency) => {
        const fromRate = exchangeRates[fromCurrency] || 1;
        const toRate = exchangeRates[toCurrency] || 1;
        // Convert to USD first (divide by fromRate), then to target (multiply by toRate)
        return (amount / fromRate) * toRate;
    }, [exchangeRates]);

    // Convert amount from USD to selected currency (legacy wrapper for backward usage)
    const convertAmount = useCallback((amountInUSD) => {
        return convert(amountInUSD, 'USD', selectedCurrency);
    }, [convert, selectedCurrency]);

    // Format amount with currency symbol
    const formatAmount = useCallback((amountInUSD) => {
        const converted = convertAmount(amountInUSD);
        const currency = getCurrencyByCode(selectedCurrency);
        const formattedNumber = Math.abs(converted).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${converted < 0 ? '-' : ''}${currency.symbol}${formattedNumber}`;
    }, [convertAmount, selectedCurrency]);

    // Get just the symbol
    const getCurrencySymbol = useCallback(() => {
        return getCurrencyByCode(selectedCurrency).symbol;
    }, [selectedCurrency]);

    const value = {
        selectedCurrency,
        setCurrency,
        currencies: CURRENCIES,
        exchangeRates,
        isLoadingRates,
        convert,
        convertAmount,
        formatAmount,
        getCurrencySymbol,
        refreshRates: fetchExchangeRates
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export default CurrencyContext;

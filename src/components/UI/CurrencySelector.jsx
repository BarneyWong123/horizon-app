import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const CurrencySelector = ({ compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const {
        selectedCurrency,
        setCurrency,
        currencies,
        isLoadingRates,
        refreshRates
    } = useCurrency();

    const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (compact) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                    <span className="text-lg">{currentCurrency.flag}</span>
                    <span className="text-slate-300 font-medium">{currentCurrency.code}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-2 max-h-64 overflow-y-auto">
                        {currencies.map(currency => (
                            <button
                                key={currency.code}
                                onClick={() => {
                                    setCurrency(currency.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-slate-700 flex items-center gap-3 transition-colors ${selectedCurrency === currency.code ? 'bg-slate-700/50' : ''
                                    }`}
                            >
                                <span className="text-xl">{currency.flag}</span>
                                <div className="flex-1">
                                    <span className={`font-medium ${selectedCurrency === currency.code ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {currency.code}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-2">{currency.symbol}</span>
                                </div>
                            </button>
                        ))}
                        <div className="border-t border-slate-700 mt-2 pt-2 px-2">
                            <button
                                onClick={() => {
                                    refreshRates();
                                    setIsOpen(false);
                                }}
                                disabled={isLoadingRates}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-xs hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-3 h-3 ${isLoadingRates ? 'animate-spin' : ''}`} />
                                {isLoadingRates ? 'Updating...' : 'Refresh Rates'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
                <span className="text-2xl">{currentCurrency.flag}</span>
                <div className="flex-1 text-left">
                    <p className="text-slate-200 font-medium">{currentCurrency.name}</p>
                    <p className="text-slate-500 text-sm">{currentCurrency.code} ({currentCurrency.symbol})</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-2 max-h-64 overflow-y-auto">
                    {currencies.map(currency => (
                        <button
                            key={currency.code}
                            onClick={() => {
                                setCurrency(currency.code);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-slate-700 flex items-center gap-3 transition-colors ${selectedCurrency === currency.code ? 'bg-slate-700/50' : ''
                                }`}
                        >
                            <span className="text-xl">{currency.flag}</span>
                            <div className="flex-1">
                                <span className={`font-medium ${selectedCurrency === currency.code ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {currency.name}
                                </span>
                            </div>
                            <span className="text-slate-500 text-sm">{currency.symbol}</span>
                        </button>
                    ))}
                    <div className="border-t border-slate-700 mt-2 pt-2 px-2">
                        <button
                            onClick={() => {
                                refreshRates();
                                setIsOpen(false);
                            }}
                            disabled={isLoadingRates}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
                            {isLoadingRates ? 'Updating rates...' : 'Refresh Exchange Rates'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurrencySelector;

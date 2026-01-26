import React, { useState } from 'react';
import { X, Delete, Check } from 'lucide-react';

const CalculatorInput = ({ onApply, onClose, initialValue = '0' }) => {
    const [display, setDisplay] = useState(initialValue === '0.00' ? '0' : initialValue);
    const [equation, setEquation] = useState('');

    const handleDigit = (digit) => {
        setDisplay(prev => (prev === '0' || prev === '0.00') ? digit : prev + digit);
    };


    const handleOperator = (op) => {
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
    };

    const calculate = () => {
        try {
            // Basic calculation using new Function (safe for numeric only)
            const fullEquation = equation + display;
            const result = new Function('return ' + fullEquation.replace(/[^-+/*0-9.]/g, ''))();
            const formattedResult = Number(result).toFixed(2);
            onApply(formattedResult);
        } catch {
            setDisplay('Error');
        }
    };

    const backspace = () => {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    const buttons = [
        ['7', '8', '9', '/'],
        ['4', '5', '6', '*'],
        ['1', '2', '3', '-'],
        ['0', '.', '=', '+']
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="card w-full max-w-sm bg-slate-900 border-slate-800 shadow-2xl scale-in-center overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-slate-500 font-bold text-xs tracking-widest uppercase">Amount Calculator</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-slate-950/50 rounded-xl p-4 text-right border border-slate-800/50">
                        <p className="text-xs text-slate-600 font-mono h-4">{equation}</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter mt-1">{display}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {buttons.map((row) => (
                            row.map((btn) => (
                                <button
                                    key={btn}
                                    onClick={() => {
                                        if (btn === '=') calculate();
                                        else if (['+', '-', '*', '/'].includes(btn)) handleOperator(btn);
                                        else handleDigit(btn);
                                    }}
                                    className={`py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${['+', '-', '*', '/', '='].includes(btn)
                                        ? 'bg-brand-emerald text-black shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]'
                                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                        }`}
                                >
                                    {btn}
                                </button>
                            ))
                        ))}
                        <button
                            onClick={() => setDisplay('0')}
                            className="col-span-2 py-4 bg-slate-800/50 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800"
                        >
                            Clear
                        </button>
                        <button
                            onClick={backspace}
                            className="col-span-1 py-4 bg-slate-800/50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-800"
                        >
                            <Delete className="w-5 h-5" />
                        </button>
                        <button
                            onClick={calculate}
                            className="col-span-1 py-4 bg-brand-emerald text-black rounded-xl flex items-center justify-center shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]"
                        >
                            <Check className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculatorInput;

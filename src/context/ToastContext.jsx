import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const Toast = ({ id, message, type, onClose }) => {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        info: 'bg-blue-500/10 border-blue-500/30'
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 ${bgColors[type] || bgColors.info}`}
        >
            {icons[type] || icons.info}
            <span className="text-white text-sm font-medium flex-1">{message}</span>
            <button
                onClick={() => onClose(id)}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const hideToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 left-4 md:left-auto md:w-80 z-[100] space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast {...toast} onClose={hideToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastContext;

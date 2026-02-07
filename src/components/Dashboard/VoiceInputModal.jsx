import React from 'react';
import { X } from 'lucide-react';
import VoiceInput from './VoiceInput';

const VoiceInputModal = ({ isOpen, onClose, onParsedTransaction }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white">Voice Entry</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-400 text-sm mb-6 text-center">
                        Describe your expense (e.g., "Spent 50 RM on groceries at Jaya Grocer today")
                    </p>

                    <VoiceInput
                        onParsedTransaction={(parsed) => {
                            onParsedTransaction(parsed);
                            onClose();
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/30 text-center">
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceInputModal;

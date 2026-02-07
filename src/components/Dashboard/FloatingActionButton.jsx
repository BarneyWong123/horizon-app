import React, { useState } from 'react';
import { Plus, Camera, Keyboard, Mic, X } from 'lucide-react';

const FloatingActionButton = ({ onQuickAdd, onScan, onVoice }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
            {/* Sub-buttons */}
            <div className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                {/* Voice Button */}
                <button
                    onClick={() => { onVoice(); setIsOpen(false); }}
                    className="w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all"
                    title="Voice Entry"
                >
                    <Mic className="w-5 h-5 text-white" />
                </button>
                {/* Scan Button */}
                <button
                    onClick={() => { onScan(); setIsOpen(false); }}
                    className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all"
                    title="Scan Receipt"
                >
                    <Camera className="w-5 h-5 text-white" />
                </button>
                {/* Quick Add Button */}
                <button
                    onClick={() => { onQuickAdd(); setIsOpen(false); }}
                    className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg transition-all"
                    title="Manual Entry"
                >
                    <Keyboard className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isOpen ? 'bg-slate-600 rotate-45' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
                <Plus className="w-7 h-7 text-white" />
            </button>
        </div>
    );
};

export default FloatingActionButton;


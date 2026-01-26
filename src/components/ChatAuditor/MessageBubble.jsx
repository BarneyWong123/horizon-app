import React from 'react';
import { Bot, User } from 'lucide-react';

const MessageBubble = ({ message }) => {
    const isBot = message.role === 'assistant';

    return (
        <div className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBot ? 'bg-brand-emerald/10 border border-brand-emerald/20' : 'bg-slate-800 border border-slate-700'
                }`}>
                {isBot ? <Bot className="w-5 h-5 text-brand-emerald" /> : <User className="w-5 h-5 text-slate-400" />}
            </div>

            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isBot
                    ? 'bg-slate-900 border border-slate-800 text-slate-200'
                    : 'bg-brand-emerald text-black font-medium'
                }`}>
                {message.content}
            </div>
        </div>
    );
};

export default MessageBubble;

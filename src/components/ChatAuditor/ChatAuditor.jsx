import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { OpenAIService } from '../../services/OpenAIService';
import { FirebaseService } from '../../services/FirebaseService';
import MessageBubble from './MessageBubble';

const ChatAuditor = ({ user }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m your financial assistant. Ask me anything about your spending, like "How much did I spend on food this month?" or "Show me my biggest expenses."' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [user.uid]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await OpenAIService.chatWithAuditor(
                [...messages, userMessage],
                transactions
            );
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I encountered a communication error with the core. Please retry." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 md:px-0">
            <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">AI Assistant</h1>
                <p className="text-slate-400 text-sm">Ask questions about your finances</p>
            </div>

            <div className="flex-1 card overflow-hidden flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, idx) => (
                        <MessageBubble key={idx} message={msg} />
                    ))}
                    {loading && (
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-brand-emerald" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-brand-emerald" />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 bg-slate-900/50 border-t border-slate-800">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            className="w-full bg-slate-800 border-slate-700 rounded-xl py-4 pl-4 pr-16 text-slate-200 focus:ring-2 focus:ring-brand-emerald focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                            placeholder="Ask about your spending... (e.g. 'How much did I spend on food?')"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 p-2 bg-brand-emerald hover:bg-brand-emerald-dark text-black rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatAuditor;

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { OpenAIService } from '../../services/OpenAIService';
import { FirebaseService } from '../../services/FirebaseService';
import MessageBubble from './MessageBubble';
import { useToast } from '../../context/ToastContext';

const ChatAuditor = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const { showToast } = useToast();
    const scrollRef = useRef(null);

    // Subscribe to Transactions
    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [user.uid]);

    // Subscribe to Chat History
    useEffect(() => {
        const unsubscribe = FirebaseService.subscribeToChat(user.uid, (data) => {
            setMessages(data);
        });
        return () => unsubscribe();
    }, [user.uid]);

    // Scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input;
        setInput('');
        setLoading(true);

        try {
            // 1. Save User Message
            await FirebaseService.addChatMessage(user.uid, {
                role: 'user',
                content: userText
            });

            // 2. Get AI Response
            // Construct history for API (remove IDs/timestamps)
            const apiHistory = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await OpenAIService.chatWithAuditor(
                [...apiHistory, { role: 'user', content: userText }],
                transactions
            );

            // 3. Save AI Message
            await FirebaseService.addChatMessage(user.uid, {
                role: 'assistant',
                content: response
            });

        } catch (error) {
            console.error(error);
            showToast('Failed to get response', 'error');
            // Add temporary error message locally
            setMessages(prev => [...prev, { role: 'assistant', content: "I encountered a communication error with the core. Please retry." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Clear all chat history?')) return;
        try {
            await FirebaseService.clearChatHistory(user.uid);
            showToast('History cleared', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to clear history', 'error');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 md:px-0">
            <div className="mb-4 md:mb-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl md:text-2xl font-bold text-white">AI Assistant</h1>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                            GPT-4o-mini
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm">Ask questions about your finances</p>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Clear History"
                    >
                        <LucideIcons.Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex-1 card overflow-hidden flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Bot className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-white font-medium mb-2">How can I help you?</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                I can analyze your spending, find trends, or help you budget. Just ask!
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <MessageBubble key={msg.id || Math.random()} message={msg} />
                    ))}

                    {loading && (
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 bg-slate-900/50 border-t border-slate-800">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            className="w-full bg-slate-800 border-slate-700 rounded-xl py-4 pl-4 pr-16 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                            placeholder="Ask about your spending... (e.g. 'How much did I spend on food?')"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
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

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { ChatMessage } from '../types';
import { Bot, Send, HardDrive } from './icons';
import { startChatSession, sendMessageInChat } from '../services/geminiService';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`p-3 rounded-full ${isModel ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                {isModel ? <Bot className="w-6 h-6 text-indigo-400" /> : <div className="w-6 h-6 font-bold flex items-center justify-center">You</div>}
            </div>
            <div className={`p-4 rounded-xl max-w-xl ${isModel ? 'bg-slate-800' : 'bg-indigo-600 text-white'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

const ChatView: React.FC = () => {
    const { knowledgeBases, documents } = useContext(AppContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedKbId, setSelectedKbId] = useState<string>(knowledgeBases[0]?.id || '');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
        // Start a new chat session when the knowledge base changes
        if (selectedKbId) {
            const kb = knowledgeBases.find(k => k.id === selectedKbId);
            if(kb) {
                startChatSession(kb.name);
                setMessages([{ id: 'init', role: 'model', content: `Chat session started. I'm ready to answer questions about the "${kb.name}" knowledge base.`}]);
            }
        } else {
             setMessages([]);
        }
    }, [selectedKbId, knowledgeBases]);

    const handleSend = useCallback(async () => {
        console.log('🚀 AIVECTORVAULT ChatView handleSend called! 🚀');
        if (!input.trim() || isLoading || !selectedKbId) return;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await sendMessageInChat(input, selectedKbId, documents);
            const modelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', content: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { id: `error-${Date.now()}`, role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedKbId, documents]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-3xl font-bold text-white">Chat</h2>
                 <div className="flex items-center space-x-2">
                     <HardDrive className="w-5 h-5 text-slate-400" />
                     <select 
                        value={selectedKbId}
                        onChange={e => setSelectedKbId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-md py-1.5 px-3 text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label="Select a knowledge base to chat with"
                        disabled={knowledgeBases.length === 0}
                    >
                         {knowledgeBases.length > 0 ? (
                            knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)
                         ) : (
                            <option>Create a knowledge base first</option>
                         )}
                    </select>
                 </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-800/50 rounded-lg">
                {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-3 rounded-full bg-slate-700">
                             <Bot className="w-6 h-6 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="p-4 rounded-xl max-w-xl bg-slate-800">
                            <p className="text-sm text-slate-400">Thinking...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={selectedKbId ? `Ask about ${knowledgeBases.find(k=>k.id===selectedKbId)?.name || '...'} ` : 'Select a knowledge base to begin'}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-4 pr-14 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        disabled={isLoading || !selectedKbId}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !selectedKbId}
                        className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                    >
                       <Send className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatView;

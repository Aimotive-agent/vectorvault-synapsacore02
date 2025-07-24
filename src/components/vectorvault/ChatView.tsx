import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { AppContext } from './contexts/AppContext';
import { ChatMessage } from './types';
import { BotIcon, SendIcon, DatabaseIcon } from './CustomIcons';
import vectorRetrievalService from '../../services/vectorRetrievalService';
import vectorVaultService from '../../services/vectorVaultService';
import geminiService from './services/geminiService';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`p-3 rounded-full ${isModel ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                {isModel ? <BotIcon className="w-6 h-6 text-indigo-400" /> : <div className="w-6 h-6 font-bold flex items-center justify-center">You</div>}
            </div>
            <div className={`p-4 rounded-xl max-w-xl ${isModel ? 'bg-slate-800' : 'bg-indigo-600 text-white'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

const ChatView: React.FC = () => {
    const { knowledgeBases } = useContext(AppContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedKbId, setSelectedKbId] = useState<string>('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!selectedKbId && knowledgeBases.length > 0) {
            setSelectedKbId(knowledgeBases[0].id);
        }
    }, [knowledgeBases, selectedKbId]);

    const handleSend = useCallback(async () => {
        console.log('ChatView: handleSend called with:', { input: input.trim(), isLoading, selectedKbId });
        if (!input.trim() || isLoading || !selectedKbId) {
            console.log('ChatView: handleSend early return due to validation');
            return;
        }

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            let finalPrompt = currentInput;
            
            // Check if there are any documents in the selected knowledge base
            const allDocuments = await vectorVaultService.getDocuments();
            const kbDocuments = allDocuments.filter(doc => doc.knowledgeBaseId === selectedKbId);
            console.log('ChatView: Found', kbDocuments.length, 'documents in knowledge base', selectedKbId);
            if (kbDocuments.length > 0) {
                console.log('ChatView: Sample document:', { name: kbDocuments[0].name, hasContent: !!kbDocuments[0].content, hasVectorData: !!kbDocuments[0].vectorData });
            }
            
            // Try to get RAG-enhanced prompt with comprehensive fallback
            console.log('ChatView: Starting RAG prompt generation with:', { selectedKbId, currentInput });
            
            if (kbDocuments.length > 0) {
                try {
                    finalPrompt = await vectorRetrievalService.generateRAGPrompt(
                        'You are a helpful AI assistant. Answer the question based on the provided context.',
                        selectedKbId, 
                        currentInput
                    );
                    console.log('ChatView: Successfully generated RAG prompt, length:', finalPrompt.length);
                    console.log('ChatView: RAG prompt preview:', finalPrompt.substring(0, 200) + '...');
                } catch (ragError) {
                    console.error('ChatView: RAG prompt generation failed, using document content directly:', ragError);
                    
                    // Fallback: Create prompt with document content directly
                    const documentContext = kbDocuments
                        .slice(0, 3) // Use top 3 documents
                        .map(doc => `Document: ${doc.name}\nContent: ${doc.content || 'No content available'}`)
                        .join('\n\n');
                    
                    finalPrompt = `You are a helpful AI assistant. Answer the following question based on the provided context.

Context:
${documentContext}

Question: ${currentInput}

Please provide a helpful answer based on the context above.`;
                    
                    console.log('ChatView: Using direct document fallback prompt, length:', finalPrompt.length);
                }
            } else {
                console.log('ChatView: No documents found, using basic prompt');
                finalPrompt = `You are a helpful AI assistant. The user asked: "${currentInput}". Please provide a helpful response. Note: No specific documents were found in the knowledge base to provide context.`;
            }
            
            console.log('ChatView: Final prompt length:', finalPrompt.length);

            const responseText = await geminiService.generateResponse(finalPrompt);
            
            const modelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', content: responseText };
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'model',
                content: `ERROR DETAILS: ${(error as Error).message || error}`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedKbId, knowledgeBases]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Chat</h2>
                <div className="flex items-center space-x-2">
                    <DatabaseIcon className="w-5 h-5 text-slate-400" />
                    <select 
                        value={selectedKbId}
                        onChange={e => setSelectedKbId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="" disabled>Select a knowledge base</option>
                        {knowledgeBases.map(kb => (
                            <option key={kb.id} value={kb.id}>{kb.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-800/50 rounded-lg">
                {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-3 rounded-full bg-slate-700">
                            <BotIcon className="w-6 h-6 text-indigo-400 animate-pulse" />
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
                       <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatView;

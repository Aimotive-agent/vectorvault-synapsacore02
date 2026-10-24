import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { AppContext } from './contexts/AppContext';
import { ChatMessage } from './types';
import { BotIcon, SendIcon, DatabaseIcon } from './CustomIcons';
import vectorVaultService from '../../services/vectorVaultService';
import aiProviderService from '@/services/aiProviderService';
import { useAISettings } from '@/hooks/useAISettings';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`p-3 rounded-full ${isModel ? 'bg-white border border-line' : 'bg-navy'}`}>
                {isModel ? <BotIcon className="w-6 h-6 text-gold" /> : <div className="w-6 h-6 font-bold flex items-center justify-center text-paper">You</div>}
            </div>
            <div className={`p-4 rounded-xl max-w-xl ${isModel ? 'bg-white border border-line text-ink' : 'bg-navy text-white'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

const ChatView: React.FC = () => {
    const { knowledgeBases } = useContext(AppContext);
    const { settings } = useAISettings();
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
            
            // DIRECT FIX: Always include document context in the prompt
            console.log('ChatView: Building prompt with document context for:', { selectedKbId, currentInput, documentCount: kbDocuments.length });
            
            if (kbDocuments.length > 0) {
                // Always use direct document content to ensure context is included
                const documentContext = kbDocuments
                    .slice(0, 5) // Use top 5 documents
                    .map(doc => {
                        const content = doc.content || doc.name || 'No content available';
                        return `Document: ${doc.name}\nContent: ${content.substring(0, 1000)}`; // Limit content length
                    })
                    .join('\n\n');
                
                finalPrompt = `You are a helpful AI assistant. Answer the following question based on the provided context from the knowledge base.

Context from Knowledge Base:
${documentContext}

User Question: ${currentInput}

Please provide a detailed answer based on the context above. If the context doesn't contain relevant information, please say so and provide a general response.`;
                
                console.log('ChatView: Created prompt with document context, length:', finalPrompt.length);
            } else {
                finalPrompt = `You are a helpful AI assistant. The user asked: "${currentInput}". Please provide a helpful response. Note: No documents were found in the selected knowledge base.`;
                console.log('ChatView: No documents found, using basic prompt, length:', finalPrompt.length);
            }
            
            console.log('ChatView: Final prompt length:', finalPrompt.length);

            // Route through the provider-aware chat service (BYOK or homelab gateway)
            console.log('ChatView: Sending prompt to AI provider, length:', finalPrompt.length);

            const responseText = await aiProviderService.chat(
                [{ role: 'user', content: finalPrompt }],
                settings
            );
            
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
                <h2 className="text-3xl font-bold text-ink">Chat</h2>
                <div className="flex items-center space-x-2">
                    <DatabaseIcon className="w-5 h-5 text-muted-foreground" />
                    <select 
                        value={selectedKbId}
                        onChange={e => setSelectedKbId(e.target.value)}
                        className="bg-white border border-line rounded-md px-3 py-2 text-ink focus:ring-2 focus:ring-navy focus:outline-none"
                    >
                        <option value="" disabled>Select a knowledge base</option>
                        {knowledgeBases.map(kb => (
                            <option key={kb.id} value={kb.id}>{kb.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-paper-2 border border-line rounded-lg">
                {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-3 rounded-full bg-white border border-line">
                            <BotIcon className="w-6 h-6 text-gold animate-pulse" />
                        </div>
                        <div className="p-4 rounded-xl max-w-xl bg-white border border-line">
                            <p className="text-sm text-muted-foreground">Thinking...</p>
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
                        className="w-full bg-white border border-line rounded-lg py-3 pl-4 pr-14 text-ink focus:ring-2 focus:ring-navy focus:outline-none transition"
                        disabled={isLoading || !selectedKbId}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !selectedKbId}
                        className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-navy text-white hover:bg-navy-deep disabled:bg-line disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
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

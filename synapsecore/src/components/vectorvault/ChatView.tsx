import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { AppContext } from './contexts/AppContext';
import { ChatMessage } from './types';
import { BotIcon, SendIcon, DatabaseIcon } from './CustomIcons';
import vectorRetrievalService from '../../services/vectorRetrievalService';
import { vectorVaultService } from '../../services/vectorVaultService';
import geminiService from './services/geminiService';
import { useMCPServers } from '../../hooks/useMCPServers';
import { MCPTool } from '../../types/mcp';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`p-3 rounded-full flex-shrink-0 ${isModel ? 'bg-gray-700' : 'bg-brand-purple'}`}>
                {isModel ? <BotIcon className="w-6 h-6 text-white" /> : <div className="w-6 h-6 font-bold flex items-center justify-center text-white">U</div>}
            </div>
            <div className={`p-4 rounded-xl max-w-2xl ${isModel ? 'bg-gray-800 text-gray-300' : 'bg-brand-purple text-white'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

const ChatView: React.FC = () => {
    const { knowledgeBases } = useContext(AppContext);
    const { servers } = useMCPServers();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedKbId, setSelectedKbId] = useState<string>('');
    const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Aggregate tools from all connected servers
    useEffect(() => {
        const allTools: MCPTool[] = [];
        servers.forEach(server => {
            if (server.tools && server.tools.length > 0) {
                const serverTools = server.tools.map(tool => ({
                    ...tool,
                    serverUrl: server.url,
                    serverId: server.id,
                    category: tool.category || 'utility'
                }));
                allTools.push(...serverTools);
            }
        });
        console.log('ChatView: Available tools for AI chat:', allTools.length);
        setAvailableTools(allTools);
    }, [servers]);

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
        console.log('🔥 SYNAPSECORE ChatView handleSend called! 🔥');
        if (!input.trim() || isLoading || !selectedKbId) return;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            console.log('ChatView: Starting RAG prompt generation with:', { selectedKbId, input });
            
            // Check if there are any documents in the selected knowledge base
            const allDocuments = await vectorVaultService.getDocuments();
            const kbDocuments = allDocuments.filter(doc => doc.knowledgeBaseId === selectedKbId);
            console.log('ChatView: Found', kbDocuments.length, 'documents in knowledge base', selectedKbId);
            if (kbDocuments.length > 0) {
                console.log('ChatView: Sample document:', { name: kbDocuments[0].name, hasContent: !!kbDocuments[0].content, hasVectorData: !!kbDocuments[0].vectorData });
            }
            
            // DIRECT FIX: Build prompt with document context directly
            let ragPrompt = input; // Start with user query
            
            if (kbDocuments.length > 0) {
                // Build context from documents
                const documentContext = kbDocuments.map(doc => {
                    return `Document: ${doc.name}\n${doc.content || 'No content available'}`;
                }).join('\n\n');
                
                // Build full prompt with context
                ragPrompt = `Context:\n${documentContext}\n\nQuestion: ${input}\n\nPlease answer the question based on the provided context. If the context doesn't contain relevant information, say so.`;
            }
            
            // Add available tools to the prompt
            if (availableTools.length > 0) {
                const toolsContext = availableTools.map(tool => 
                    `Tool: ${tool.name} - ${tool.description}`
                ).join('\n');
                
                ragPrompt += `\n\nAvailable Tools (${availableTools.length} tools):\n${toolsContext}\n\nYou can reference these tools in your response if they would be helpful for the user's question.`;
                console.log('ChatView: Added', availableTools.length, 'tools to AI prompt');
            }
            
            console.log('ChatView: Built prompt directly, length:', ragPrompt.length);
            console.log('ChatView: Prompt preview:', ragPrompt.substring(0, 200) + '...');
            
            const modelResponse = await geminiService.generateResponse(ragPrompt);
            const botMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', content: modelResponse };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error in chat response:', error);
            const errorMessage: ChatMessage = { id: `error-${Date.now()}`, role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedKbId]);

    return (
        <div className="bg-dark-card h-full flex flex-col p-6 rounded-lg shadow-lg border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <h2 className="text-2xl font-bold text-white">AI Chat</h2>
                <div className="flex items-center space-x-3">
                    <DatabaseIcon className="w-5 h-5 text-gray-400"/>
                    <select
                        value={selectedKbId}
                        onChange={e => setSelectedKbId(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                        disabled={knowledgeBases.length === 0}
                    >
                        {knowledgeBases.length > 0 ? (
                            knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)
                        ) : (
                            <option>No knowledge bases available</option>
                        )}
                    </select>
                    {availableTools.length > 0 && (
                        <div className="text-sm text-gray-400">
                            • {availableTools.length} tools available
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 my-4 bg-gray-900/50 rounded-lg">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-gray-500 pt-16">
                        <BotIcon className="w-16 h-16 mx-auto mb-4"/>
                        <p>Ask me anything about your documents.</p>
                    </div>
                )}
                {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-3 rounded-full bg-gray-700">
                            <BotIcon className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div className="p-4 rounded-xl max-w-xl bg-gray-800">
                            <p className="text-sm text-gray-400">Thinking...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="mt-auto">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={selectedKbId ? `Ask about ${knowledgeBases.find(k=>k.id===selectedKbId)?.name || '...'} ` : 'Select a knowledge base to begin'}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-4 pr-14 text-gray-200 focus:ring-2 focus:ring-brand-purple focus:outline-none transition"
                        disabled={isLoading || !selectedKbId}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !selectedKbId}
                        className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-brand-purple text-white hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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

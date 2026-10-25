
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import type { Document } from '../types';
import { DocumentStatus } from '../types';


// This function searches the vector database by scoring documents based on keyword relevance.
const findRelevantDocuments = (query: string, knowledgeBaseName: string, allDocs: Document[], kbId: string): Document[] => {
    console.log(`Searching for documents relevant to: "${query}" in knowledge base: "${knowledgeBaseName}"`);
    
    const kbDocs = allDocs.filter(doc => doc.knowledgeBaseId === kbId && doc.status === DocumentStatus.Indexed);

    if (kbDocs.length === 0) return [];

    // Use a Set to get unique, non-trivial words from the query.
    const queryWords = [...new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2))];

    // If the query is empty or trivial, we can't search effectively.
    if (queryWords.length === 0) {
        // As a fallback, return the 3 most recent documents.
        return kbDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).slice(0, 3);
    }

    const scoredDocs = kbDocs.map(doc => {
        const docContent = (doc.name + ' ' + (doc.content || '')).toLowerCase();
        let score = 0;
        // Increase score for each query word found in the document.
        for (const word of queryWords) {
            if (docContent.includes(word)) {
                score++;
            }
        }
        return { doc, score };
    })
    .filter(item => item.score > 0) // Only include documents that matched at least one word.
    .sort((a, b) => {
        // Sort primarily by score (descending), and secondarily by date (most recent first).
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return new Date(b.doc.uploadDate).getTime() - new Date(a.doc.uploadDate).getTime();
    });

    console.log(`Found ${scoredDocs.length} relevant documents, ranked by relevance.`);

    // Return the top 3 most relevant documents.
    return scoredDocs.map(item => item.doc).slice(0, 3);
};

// --- Gemini API Client ---

let ai: GoogleGenAI | null = null;

// Lazily initialize the Google Gemini API client on first use.
// This is wrapped in a try-catch to prevent app crashes if initialization fails.
const getAiClient = (): GoogleGenAI | null => {
    if (ai) {
        return ai;
    }
    try {
        // API key comes from the build environment — never hardcode keys here.
        const apiKey = import.meta.env?.VITE_GEMINI_API_KEY ?? '';
        if (!apiKey) {
            console.warn('Gemini API key not configured (VITE_GEMINI_API_KEY) — AI features disabled.');
            return null;
        }
        ai = new GoogleGenAI({ apiKey });
        return ai;
    } catch (error) {
        console.error("Fatal: Failed to initialize GoogleGenAI client. Check API_KEY.", error);
        // Return null if initialization fails. Callers must handle this.
        return null;
    }
};


// --- Standalone Query Function ---
export const queryKnowledgeBase = async (query: string, knowledgeBaseName: string, kbId: string, documentContext: Document[]): Promise<string> => {
    const client = getAiClient();
    if (!client) {
        return "The AI service is currently unavailable. Please check the configuration.";
    }

    try {
        const relevantDocs = findRelevantDocuments(query, knowledgeBaseName, documentContext, kbId);
        const contextText = relevantDocs.length > 0
            ? relevantDocs.map(doc => `Document: ${doc.name}\nContent: ${doc.content || 'No content available for this document.'}`).join('\n\n')
            : "No relevant documents were found in this knowledge base for your query.";

        const prompt = `
You are an intelligent assistant for the VectorVault knowledge base. 
Answer the user's question based ONLY on the provided document context from the "${knowledgeBaseName}" knowledge base. 
If the context doesn't contain the answer, state that the information is not available in that specific knowledge base. Do not use external knowledge.

Context from documents in "${knowledgeBaseName}":
---
${contextText}
---

User's Question: "${query}"
`;
        
        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;

    } catch (error) {
        console.error("Error querying Gemini API:", error);
        if (error instanceof Error) {
            return `An error occurred while querying the knowledge base: ${error.message}`;
        }
        return "An unknown error occurred while querying the knowledge base.";
    }
};

// --- Chat Service ---

let chatInstance: Chat | null = null;
let currentChatKbName: string = '';

export const startChatSession = (knowledgeBaseName: string) => {
    currentChatKbName = knowledgeBaseName;
    const client = getAiClient();
    
    if (!client) {
        console.error("Cannot start chat session, AI service is unavailable.");
        chatInstance = null; // Ensure chat instance is cleared
        return;
    }

    chatInstance = client.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a helpful AI assistant for VectorVault. You are currently focused on the "${knowledgeBaseName}" knowledge base. Answer user questions based on the context provided from documents within this base. If the information isn't in the context, say so. Do not use external knowledge.`
        }
    });
    console.log(`Chat session started for knowledge base: ${knowledgeBaseName}`);
};

export const sendMessageInChat = async (message: string, kbId: string, documentContext: Document[]): Promise<string> => {
    console.log('sendMessageInChat called with:', { message, kbId, documentCount: documentContext.length });
    console.log('Chat instance exists:', !!chatInstance, 'Current KB name:', currentChatKbName);
    
    if (!chatInstance || !currentChatKbName) {
        console.log('Chat session not started - returning error message');
        return "Chat session not started or AI service is unavailable. Please select a knowledge base first.";
    }

    try {
        const relevantDocs = findRelevantDocuments(message, currentChatKbName, documentContext, kbId);
        console.log('Found relevant documents:', relevantDocs.length);
        
        const contextText = relevantDocs.length > 0
            ? relevantDocs.map(doc => `Document: ${doc.name}\nContent: ${doc.content || 'No content available for this document.'}`).join('\n\n')
            : "No relevant documents were found for this query.";

        const fullMessage = `
Context from "${currentChatKbName}":
---
${contextText}
---

User Message: "${message}"
`;
        
        console.log('Full message length:', fullMessage.length);
        console.log('Full message preview:', fullMessage.substring(0, 200) + '...');
        
        const response: GenerateContentResponse = await chatInstance.sendMessage({ message: fullMessage });
        console.log('Received response from Gemini:', response.text);
        return response.text;

    } catch (error) {
        console.error("Error sending message to Gemini API:", error);
        if (error instanceof Error) {
            return `An error occurred during the chat: ${error.message}`;
        }
        return "An unknown error occurred during the chat.";
    }
};

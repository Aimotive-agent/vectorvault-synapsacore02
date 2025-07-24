import { ChatMessage as SynapseCoreChatMessage } from '@/types/mcp';

/**
 * Service for interacting with Google's Gemini API
 */
export class GeminiService {
  // Hardcoded API key for VectorVault app only
  private apiKey: string = 'REDACTED_GEMINI_API_KEY';
  private model = 'gemini-1.5-flash';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1/models';

  /**
   * Set the API key for Gemini API
   * @param key - The API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Check if API key is set
   * @returns boolean indicating if API key is available
   */
  hasApiKey(): boolean {
    return true; // Always return true since we have a hardcoded API key
  }

  /**
   * Generate a response from Gemini based on a query and context
   * @param payload - The user's query and context
   * @returns Promise with the generated text response
   */
  async generateResponse(prompt: string): Promise<string> {
    console.log('geminiService: Generating response for prompt:', prompt);
    try {
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      
      console.log('geminiService: Sending request to URL:', url);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
      
      console.log('geminiService: Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('geminiService: Response status:', response.status);
      console.log('geminiService: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('geminiService: API error response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('geminiService: Received response from API:', JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log('geminiService: Extracted response text:', responseText);
        return responseText;
      } else {
        console.warn('Received an empty or invalid response from the API:', data);
        return 'I apologize, but I received an empty response. Please try again.';
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Generate a chat response from a series of messages
   * @param messages - Array of chat messages
   * @returns Promise with the generated response
   */
  async generateChatResponse(messages: SynapseCoreChatMessage[]): Promise<string> {
    console.log('geminiService: Generating chat response for messages:', messages);

    const formattedMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    if (formattedMessages.length === 0) {
      return 'I need a message to respond to.';
    }

    try {
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents: formattedMessages }),
      });

      const responseBodyText = await response.text();
      console.log('Gemini API Response Status:', response.status);
      console.log('Gemini API Response Status Text:', response.statusText);
      console.log('Gemini API Raw Response Body:', responseBodyText);

      if (!response.ok) {
        console.error(`Error from Gemini API: ${response.status} ${response.statusText}`, responseBodyText);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = JSON.parse(responseBodyText);
      console.log('Parsed Gemini API Data:', data);

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error('Empty or malformed content in response from Gemini API:', data);
        return 'I apologize, but I received an empty response. Please try again.';
      }

      return content;
    } catch (error) {
      console.error('Error during Gemini API call:', error);
      throw new Error('Failed to generate response from Gemini API.');
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();
export default geminiService;

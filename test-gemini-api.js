// Simple test to verify Gemini API is working
const API_KEY = 'REDACTED_GEMINI_API_KEY';
const MODEL = 'gemini-1.5-flash-latest';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

async function testGeminiAPI() {
    console.log('Testing Gemini API...');
    
    try {
        const url = `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: "Hello, can you respond with a simple greeting?"
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
        
        console.log('Request URL:', url);
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response Status:', response.status);
        console.log('Response OK:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
            const responseText = data.candidates[0].content.parts[0].text;
            console.log('SUCCESS! Gemini API Response Text:', responseText);
        } else {
            console.log('ERROR: No valid response text found in API response');
        }
        
    } catch (error) {
        console.error('ERROR: Exception during API call:', error);
    }
}

testGeminiAPI();

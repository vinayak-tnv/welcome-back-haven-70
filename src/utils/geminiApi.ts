
/**
 * Gemini API utility for handling API interactions and error handling
 */

// API endpoint for Gemini Pro model
export const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

// Type for Gemini API response
export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message: string;
    code: number;
    status: string;
    details: any[];
  };
}

/**
 * Validates a Gemini API key format
 */
export const validateApiKey = (key: string): boolean => {
  return key.length >= 30;
};

/**
 * Sends a prompt to the Gemini API
 */
export const sendPromptToGemini = async (
  prompt: string,
  apiKey: string,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
    topK?: number;
    topP?: number;
  } = {}
): Promise<string> => {
  if (!validateApiKey(apiKey)) {
    throw new Error("Invalid API key format. Please provide a valid Gemini API key.");
  }

  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature || 0.4,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 500,
        },
      }),
    });

    const data: GeminiResponse = await response.json();

    if (!response.ok) {
      // Handle expired API key specifically
      if (data.error?.message?.includes("API key expired")) {
        throw new Error(
          "Your Gemini API key has expired. Please obtain a new key from Google AI Studio: https://aistudio.google.com/app/apikey"
        );
      }
      
      // Handle other API errors
      throw new Error(
        data.error?.message || `Failed to communicate with Gemini API (${response.status})`
      );
    }

    // Extract and return the response text
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("Received empty response from Gemini API");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while communicating with Gemini API");
  }
};

/**
 * Gets the stored API key from localStorage or returns empty string
 */
export const getStoredApiKey = (): string => {
  return localStorage.getItem('geminiApiKey') || '';
};

/**
 * Stores the API key in localStorage
 */
export const storeApiKey = (apiKey: string): void => {
  localStorage.setItem('geminiApiKey', apiKey);
};


import { GoogleGenAI, GenerateContentResponse, Part, FunctionDeclaration, Type } from "@google/genai";
import { GroundingSource, FunctionCall } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Default system instruction for the Crypto Bot persona
const SYSTEM_INSTRUCTION = `You are CryptoSage, an elite financial market analyst and trading assistant specializing in Cryptocurrency. 
Your goal is to provide accurate, data-backed advice on whether to BUY, SELL, or HOLD specific assets based on current market conditions.

Capabilities:
1. Analyze market trends using real-time data (via Google Search).
2. Advanced Chart Analysis: precision detection of candlestick patterns (Doji, Hammer, Engulfing, Morning/Evening Star), chart formations (Head & Shoulders, Flags, Triangles, Wedges), and technical indicators (RSI divergence, MACD crossovers, Moving Averages) from user-uploaded images.
3. Perform deep reasoning for complex strategies when 'Thinking Mode' is active.
4. EXECUTE TRADES: You have direct access to the user's trading terminal. You can buy, sell, and set stop losses for Crypto (e.g., BTC, ETH) when explicitly instructed.

Guidelines:
- ALWAYS check for the latest news and prices using Google Search when asked about current market status.
- Be concise but insightful.
- Use technical terminology (RSI, MACD, Support/Resistance) where appropriate but explain it simply.
- IMAGE ANALYSIS: When an image is provided, you MUST perform a structured technical analysis:
  1. Identify the Asset and Timeframe (if visible).
  2. List key Support and Resistance levels.
  3. Detect specific Candlestick Patterns (e.g., "Bullish Engulfing detected at support").
  4. Identify Chart Patterns (e.g., "Ascending Triangle formation").
  5. Provide a specific directional bias (Bullish/Bearish/Neutral) based ONLY on the visual evidence.
- TRADING: If a user asks you to buy or sell, use the 'execute_trade' tool. If they ask to set a stop loss, use 'set_stop_loss'. ALWAYS confirm the action in text after calling the tool.
- Disclaimer: Always include a brief reminder that this is financial opinion, not guaranteed advice.
`;

// Define Tools
const tradeFunction: FunctionDeclaration = {
  name: "execute_trade",
  description: "Execute a buy or sell order for a cryptocurrency.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The symbol of the asset (e.g., BTC, ETH).",
      },
      action: {
        type: Type.STRING,
        description: "The action to perform: 'buy' or 'sell'.",
        enum: ["buy", "sell"]
      },
      amount: {
        type: Type.NUMBER,
        description: "The amount of assets to trade.",
      }
    },
    required: ["symbol", "action", "amount"]
  }
};

const stopLossFunction: FunctionDeclaration = {
  name: "set_stop_loss",
  description: "Set a stop loss price for a specific holding.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The symbol of the asset (e.g., BTC).",
      },
      price: {
        type: Type.NUMBER,
        description: "The price at which to trigger the stop loss.",
      }
    },
    required: ["symbol", "price"]
  }
};

interface SendMessageOptions {
  message: string;
  image?: string; // base64
  useThinking: boolean;
  previousHistory?: { role: string; parts: Part[] }[];
}

export const sendMessageToGemini = async ({
  message,
  image,
  useThinking,
  previousHistory = []
}: SendMessageOptions): Promise<{ text: string; sources: GroundingSource[]; functionCalls: FunctionCall[] }> => {
  
  try {
    const modelId = 'gemini-3-pro-preview';
    
    // Prepare parts
    const parts: Part[] = [];
    
    if (image) {
      // Dynamically detect mimeType if present in base64 string
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      let mimeType = 'image/jpeg'; // default
      let data = image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      } else {
        // Fallback for raw base64 without header
        data = image.split(',')[1] || image;
      }

      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }
    
    parts.push({ text: message });

    // Prepare content history for context
    const history = previousHistory.map(h => ({
      role: h.role,
      parts: h.parts
    }));

    // Generate
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        ...history,
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Combine Search and Function Calling
        tools: [
            { googleSearch: {} },
            { functionDeclarations: [tradeFunction, stopLossFunction] }
        ], 
        // Logic for Thinking Mode
        ...(useThinking ? {
          thinkingConfig: {
             thinkingBudget: 32768 
          }
        } : {}),
      }
    });

    const text = response.text || "";
    
    // Extract grounding chunks (sources)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({
        uri: web.uri,
        title: web.title
      }));

    // Extract function calls
    const functionCalls: FunctionCall[] = [];
    const candidate = response.candidates?.[0];
    if (candidate && candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.functionCall) {
                functionCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args as Record<string, any>
                });
            }
        }
    }

    return { text, sources, functionCalls };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

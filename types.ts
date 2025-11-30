
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  image?: string; // base64 string
  isThinking?: boolean;
  groundingSources?: GroundingSource[];
  functionCalls?: FunctionCall[];
  usage?: {
    totalTokens: number;
  };
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  thinkingMode: boolean; // User toggle for Thinking Budget
}

// User & Auth
export interface User {
  email: string;
  name?: string;
}

// Trading / Portfolio Types

export interface Trade {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  coinId: string;
  coinSymbol: string;
  amount: number;
  price: number;
  totalValue: number;
}

export interface Holding {
  coinId: string;
  symbol: string;
  amount: number;
  averageBuyPrice: number;
  stopLossPrice?: number; // New field for Stop Loss
}

export interface PerformancePoint {
  timestamp: number;
  value: number;
}

export interface Portfolio {
  usdtBalance: number;
  holdings: Record<string, Holding>;
  tradeHistory: Trade[];
  performanceHistory: PerformancePoint[];
}

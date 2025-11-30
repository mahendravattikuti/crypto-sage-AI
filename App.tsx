
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, BrainCircuit, Sparkles, AlertCircle, LogOut, User as UserIcon, MessageSquare, Menu, ChevronRight } from 'lucide-react';
import { Ticker } from './components/Ticker';
import { MessageBubble } from './components/MessageBubble';
import { TradingPanel } from './components/TradingPanel';
import { AuthScreen } from './components/AuthScreen';
import { sendMessageToGemini } from './services/geminiService';
import { storageService } from './services/storageService';
import { Message, MessageRole, Portfolio, Trade, User } from './types';
import { useCryptoPrices } from './hooks/useCryptoPrices';

// Helper for generating IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State
  const { prices, loading: pricesLoading } = useCryptoPrices();
  const [portfolio, setPortfolio] = useState<Portfolio>({ usdtBalance: 0, holdings: {}, tradeHistory: [], performanceHistory: [] });
  
  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true); // For mobile sidebar toggle
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize: Check for previous session
  useEffect(() => {
    const lastEmail = storageService.getLastUser();
    if (lastEmail) {
      handleLogin(lastEmail);
    }
  }, []);

  const handleLogin = (email: string) => {
    const user = { email };
    setCurrentUser(user);
    storageService.setLastUser(email);
    
    // Load persisted data
    const loadedPortfolio = storageService.loadPortfolio(email);
    setPortfolio(loadedPortfolio);

    // Reset Chat for new session appearance
    setMessages([
        {
          id: generateId(),
          role: MessageRole.MODEL,
          text: `Welcome back, **${email.split('@')[0]}**. \n\nI'm ready to manage your trades. You can ask me to "Buy 1 ETH" or "Set a stop loss for BTC at 95000".`,
          timestamp: Date.now()
        }
    ]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    storageService.setLastUser(null);
    setMessages([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- TRADING LOGIC ---
  const handleTrade = (coinId: string, amount: number, isBuy: boolean) => {
    if (!currentUser) return false;

    const coin = prices.find(p => p.id === coinId);
    if (!coin) return false;

    const price = coin.current_price;
    const totalValue = amount * price;

    let success = false;

    setPortfolio(prev => {
      let newUsdt = prev.usdtBalance;
      let newHoldings = { ...prev.holdings };
      const currentHolding = newHoldings[coinId] || { coinId, symbol: coin.symbol, amount: 0, averageBuyPrice: 0 };

      if (isBuy) {
        if (newUsdt < totalValue) return prev; // Insufficient funds
        
        const totalCostOld = currentHolding.amount * currentHolding.averageBuyPrice;
        const totalCostNew = totalCostOld + totalValue;
        const newAmount = currentHolding.amount + amount;
        
        currentHolding.averageBuyPrice = totalCostNew / newAmount;
        currentHolding.amount = newAmount;
        newUsdt -= totalValue;
        success = true;
      } else {
        if (currentHolding.amount < amount) return prev; // Insufficient assets
        currentHolding.amount -= amount;
        newUsdt += totalValue;
        
        if (currentHolding.amount <= 0.000001) {
          delete newHoldings[coinId];
        } else {
            newHoldings[coinId] = currentHolding;
        }
        success = true;
      }

      if (isBuy || (!isBuy && currentHolding.amount > 0)) {
         newHoldings[coinId] = currentHolding;
      }

      if (!success) return prev;

      const newTrade: Trade = {
        id: generateId(),
        timestamp: Date.now(),
        type: isBuy ? 'buy' : 'sell',
        coinId,
        coinSymbol: coin.symbol,
        amount,
        price,
        totalValue
      };

      // Calculate new total Portfolio Value for history
      // Note: This uses the *current* prices for all assets to determine net worth at this moment
      const currentHoldingsValue = Object.values(newHoldings).reduce((acc, h) => {
          // If we just modified this coin, its amount is already updated in newHoldings
          // We need to look up current prices for ALL holdings
          const p = prices.find(pr => pr.id === h.coinId);
          return acc + (h.amount * (p ? p.current_price : 0));
      }, 0);

      const newTotalNetWorth = newUsdt + currentHoldingsValue;
      const newHistoryPoint = { timestamp: Date.now(), value: newTotalNetWorth };
      const updatedHistory = [...(prev.performanceHistory || []), newHistoryPoint];

      return {
        usdtBalance: newUsdt,
        holdings: newHoldings,
        tradeHistory: [...prev.tradeHistory, newTrade],
        performanceHistory: updatedHistory
      };
    });
    
    return success;
  };

  const handleSetStopLoss = (coinId: string, price: number | undefined) => {
      setPortfolio(prev => {
          const newHoldings = { ...prev.holdings };
          if (newHoldings[coinId]) {
              newHoldings[coinId] = {
                  ...newHoldings[coinId],
                  stopLossPrice: price
              };
          }
          return {
              ...prev,
              holdings: newHoldings
          };
      });
  };

  const handleResetPortfolio = () => {
    if (currentUser) {
        const resetData: Portfolio = {
            usdtBalance: 50000,
            holdings: {},
            tradeHistory: [],
            performanceHistory: [{ timestamp: Date.now(), value: 50000 }]
        };
        setPortfolio(resetData);
    }
  };

  // Sync Portfolio to Storage
  useEffect(() => {
    if (currentUser && portfolio) {
      storageService.savePortfolio(currentUser.email, portfolio);
    }
  }, [portfolio, currentUser]);


  // --- CHAT LOGIC ---

  const executeFunctionCall = (name: string, args: any) => {
    let resultMessage = '';

    if (name === 'execute_trade') {
        const { symbol, action, amount } = args;
        const coin = prices.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
        
        if (!coin) {
            resultMessage = `❌ Error: Could not find asset with symbol ${symbol}.`;
        } else {
            const isBuy = action.toLowerCase() === 'buy';
            const success = handleTrade(coin.id, parseFloat(amount), isBuy);
            if (success) {
                resultMessage = `✅ Trade Executed: ${isBuy ? 'Bought' : 'Sold'} ${amount} ${coin.symbol} @ ${coin.current_price.toLocaleString()}`;
            } else {
                resultMessage = `❌ Trade Failed: Insufficient funds or assets to ${action} ${amount} ${coin.symbol}.`;
            }
        }
    } 
    else if (name === 'set_stop_loss') {
        const { symbol, price } = args;
        const coin = prices.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
        if (!coin) {
             resultMessage = `❌ Error: Unknown asset ${symbol}.`;
        } else {
             handleSetStopLoss(coin.id, parseFloat(price));
             resultMessage = `🛡️ Stop Loss Set: ${symbol} @ ${price}`;
        }
    }

    if (resultMessage) {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: MessageRole.SYSTEM,
            text: resultMessage,
            timestamp: Date.now()
        }]);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userMessageId = generateId();
    const currentImage = selectedImage;
    const currentText = inputText;

    // 1. Add User Message
    const newMessage: Message = {
      id: userMessageId,
      role: MessageRole.USER,
      text: currentText,
      image: currentImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 2. Call API
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        parts: [{ text: m.text }] 
      }));

      // Augment context with portfolio
      const portfolioContext = `Current Portfolio:
      - USDT Balance: $${portfolio.usdtBalance.toFixed(2)}
      - Holdings: ${Object.values(portfolio.holdings).map(h => `${h.amount} ${h.symbol} (Avg: $${h.averageBuyPrice.toFixed(2)}${h.stopLossPrice ? `, SL: $${h.stopLossPrice}` : ''})`).join(', ') || 'None'}
      `;
      
      const response = await sendMessageToGemini({
        message: `${portfolioContext}\nUser Query: ${currentText}`,
        image: currentImage || undefined,
        useThinking: thinkingMode,
        previousHistory: history
      });

      // 3. Add Model Response
      const botMessage: Message = {
        id: generateId(),
        role: MessageRole.MODEL,
        text: response.text,
        timestamp: Date.now(),
        groundingSources: response.sources,
        isThinking: thinkingMode
      };
      setMessages(prev => [...prev, botMessage]);

      // 4. Handle Function Calls (Trades)
      if (response.functionCalls && response.functionCalls.length > 0) {
          response.functionCalls.forEach(fc => {
              executeFunctionCall(fc.name, fc.args);
          });
      }

    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: MessageRole.MODEL,
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Condition 1: Not Logged In
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Condition 2: Logged In (Main App)
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* Header & Ticker (Fixed Top) */}
      <div className="flex-none z-30 bg-slate-950 shadow-md">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                CryptoSage AI
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                <UserIcon size={14} className="text-slate-400" />
                <span className="text-xs text-slate-300">{currentUser.email}</span>
            </div>

            <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                title="Logout"
            >
                <LogOut size={18} />
            </button>

            <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`lg:hidden p-2 rounded-lg border ${isChatOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
            >
                <MessageSquare size={18} />
            </button>
          </div>
        </header>
        <Ticker prices={prices} loading={pricesLoading} />
      </div>

      {/* Main Content Area: Split View */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side: Trading Panel (Main) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative z-10">
           <TradingPanel 
             prices={prices} 
             portfolio={portfolio} 
             onTrade={handleTrade} 
             onSetStopLoss={handleSetStopLoss}
             onReset={handleResetPortfolio}
             className="w-full h-full"
           />
        </div>

        {/* Right Side: Chat Sidebar */}
        <div 
            className={`
                fixed lg:relative top-[115px] lg:top-0 right-0 h-[calc(100vh-115px)] lg:h-full z-20 
                w-full md:w-[400px] lg:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300
                ${isChatOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
             <div className="flex items-center gap-2">
                 <BrainCircuit className="text-indigo-400" size={20} />
                 <span className="font-bold text-slate-200">AI Assistant</span>
             </div>
             <label className={`
                flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border transition-all duration-300
                ${thinkingMode 
                  ? 'bg-purple-900/30 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'}
              `}>
              <input 
                type="checkbox" 
                checked={thinkingMode} 
                onChange={() => setThinkingMode(!thinkingMode)}
                className="hidden"
              />
              <span className="text-xs font-medium">Thinking Mode</span>
            </label>
            <button onClick={() => setIsChatOpen(false)} className="lg:hidden text-slate-500">
                <X size={20}/>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col h-[calc(100%-130px)]">
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs text-slate-400">Processing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
             </div>
          </div>

          {/* Chat Input */}
          <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900 border-t border-slate-800">
              {selectedImage && (
                <div className="flex items-center gap-2 mb-2 bg-slate-800 w-fit px-2 py-1 rounded border border-slate-700">
                  <span className="text-xs text-slate-300 max-w-[150px] truncate">Image attached</span>
                  <button onClick={() => setSelectedImage(null)} className="text-slate-500 hover:text-white"><X size={12}/></button>
                </div>
              )}
              <div className="flex gap-2">
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                >
                  <ImageIcon size={20} />
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask to buy, sell, or analyze..."
                    className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-sm px-4 rounded-lg border border-slate-800 focus:border-indigo-500 outline-none"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputText.trim() && !selectedImage)}
                  className={`p-3 rounded-lg flex items-center justify-center transition-all ${
                      (inputText.trim() || selectedImage) && !isLoading ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;

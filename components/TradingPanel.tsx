
import React, { useState } from 'react';
import { CryptoPrice, Portfolio, Trade, Holding } from '../types';
import { Wallet, ArrowUpRight, ArrowDownLeft, PieChart, RefreshCcw, ShieldAlert } from 'lucide-react';
import { PriceChart } from './PriceChart';
import { PortfolioChart } from './PortfolioChart';

interface Props {
  prices: CryptoPrice[];
  portfolio: Portfolio;
  onTrade: (coinId: string, amount: number, isBuy: boolean) => void;
  onSetStopLoss: (coinId: string, price: number | undefined) => void;
  onReset: () => void;
  className?: string;
}

export const TradingPanel: React.FC<Props> = ({ prices, portfolio, onTrade, onSetStopLoss, onReset, className = '' }) => {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  
  // Initialize selection once prices load
  React.useEffect(() => {
    if (!selectedCoinId && prices.length > 0) {
        setSelectedCoinId(prices[0].id);
    }
  }, [prices, selectedCoinId]);

  const selectedCoin = prices.find(p => p.id === selectedCoinId) || prices[0];
  const [amount, setAmount] = useState<string>('');
  const [stopLossInput, setStopLossInput] = useState<string>('');

  const holding = portfolio.holdings[selectedCoin?.id];
  
  if (!selectedCoin) return <div className="p-4 text-slate-400">Loading market data...</div>;

  const handleTrade = (isBuy: boolean) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    onTrade(selectedCoin.id, numAmount, isBuy);
    setAmount('');
  };

  const handleSetStopLoss = () => {
      const price = parseFloat(stopLossInput);
      if (isNaN(price)) {
          onSetStopLoss(selectedCoin.id, undefined); // Remove stop loss
      } else {
          onSetStopLoss(selectedCoin.id, price);
      }
      setStopLossInput('');
  }

  // Calculations
  const totalHoldingsValue = Object.values(portfolio.holdings).reduce((acc, holding: Holding) => {
    const price = prices.find(p => p.id === holding.coinId)?.current_price || 0;
    return acc + (holding.amount * price);
  }, 0);
  
  const totalBalance = portfolio.usdtBalance + totalHoldingsValue;
  const currentPrice = selectedCoin.current_price;
  const numAmount = parseFloat(amount) || 0;
  const totalCost = numAmount * currentPrice;

  // Validation
  const canBuy = numAmount > 0 && totalCost <= portfolio.usdtBalance;
  const canSell = numAmount > 0 && holding && numAmount <= holding.amount;

  // Theme
  const isPositive = selectedCoin.price_change_percentage_24h >= 0;

  return (
    <div className={`flex flex-col h-full bg-slate-950 overflow-y-auto ${className}`}>
      {/* Top Header Section */}
      <div className="flex-none p-6 border-b border-slate-800 bg-slate-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Wallet className="text-emerald-500" size={28} />
                        Trading Terminal
                    </h2>
                     <div className="flex items-center gap-4">
                         <div className="text-right hidden md:block">
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Liquid Funds</div>
                            <div className="font-mono text-lg text-white">${portfolio.usdtBalance.toLocaleString()}</div>
                        </div>
                        <button onClick={onReset} className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 transition-colors border border-slate-700">
                            <RefreshCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6">
                    <div className="flex-shrink-0">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-mono font-bold text-emerald-400 tracking-tight">
                            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <span className="text-sm text-slate-500">Total Net Worth (USDT + Assets)</span>
                    </div>
                    {/* Embedded Portfolio Chart */}
                    <div className="flex-1 w-full sm:w-auto h-16 opacity-80 hover:opacity-100 transition-opacity">
                        <PortfolioChart data={portfolio.performanceHistory} height={64} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        
        {/* Main Chart Section */}
        <div className="w-full h-[500px] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <select 
                    value={selectedCoinId} 
                    onChange={(e) => setSelectedCoinId(e.target.value)}
                    className="bg-slate-800 text-white text-lg font-bold py-2 px-4 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none cursor-pointer hover:bg-slate-750 transition-colors"
                >
                    {prices.map(p => (
                    <option key={p.id} value={p.id}>{p.symbol} / USDT</option>
                    ))}
                </select>

                <div className={`flex items-center gap-2 font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className="text-2xl font-bold">${currentPrice.toLocaleString()}</span>
                    <span className="text-sm font-bold px-2 py-1 bg-slate-800 rounded">
                        {isPositive ? '+' : ''}{selectedCoin.price_change_percentage_24h.toFixed(2)}%
                    </span>
                </div>
            </div>
            
            <PriceChart symbol={selectedCoin.symbol} />
        </div>

        {/* Bottom Section: Grid Layout for Orders and Portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            
            {/* Order Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ArrowUpRight className="text-emerald-500" /> Execute Order
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Amount ({selectedCoin.symbol})</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-950 text-white p-4 rounded-xl border border-slate-700 focus:border-emerald-500 outline-none font-mono text-lg"
                        />
                         <div className="flex justify-between text-xs text-slate-500 px-1">
                            <span>Value: ${totalCost.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                            <span>Max Buy: {Math.floor(portfolio.usdtBalance / currentPrice * 1000) / 1000} {selectedCoin.symbol}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button 
                            onClick={() => handleTrade(true)}
                            disabled={!canBuy}
                            className={`
                            flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all
                            ${canBuy 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-95' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                            `}
                        >
                            Buy
                        </button>
                        <button 
                            onClick={() => handleTrade(false)}
                            disabled={!canSell}
                            className={`
                            flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all
                            ${canSell 
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 active:scale-95' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                            `}
                        >
                            Sell
                        </button>
                    </div>
                </div>

                {/* Stop Loss Config (Visual Only for now) */}
                 {holding && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                                <ShieldAlert size={12} /> Stop Loss Trigger
                            </label>
                            {holding.stopLossPrice && (
                                <span className="text-xs text-rose-400 font-mono">Active @ ${holding.stopLossPrice}</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={stopLossInput}
                                onChange={(e) => setStopLossInput(e.target.value)}
                                placeholder={holding.stopLossPrice ? `${holding.stopLossPrice}` : "Price (USD)"}
                                className="flex-1 bg-slate-950 text-white p-2 rounded-lg border border-slate-700 focus:border-rose-500 outline-none font-mono text-sm"
                            />
                            <button 
                                onClick={handleSetStopLoss}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 rounded-lg text-sm border border-slate-700"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Holdings & History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <PieChart className="text-purple-500" /> Current Holdings
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[300px]">
                    {Object.values(portfolio.holdings).length === 0 ? (
                        <div className="text-center py-10 text-slate-600">
                            No assets in portfolio
                        </div>
                    ) : (
                        Object.values(portfolio.holdings).map((h: Holding) => {
                            const curP = prices.find(p => p.id === h.coinId)?.current_price || 0;
                            const val = h.amount * curP;
                            const pnl = (curP - h.averageBuyPrice) * h.amount;
                            return (
                                <div key={h.coinId} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="font-bold text-white">{h.symbol}</div>
                                        <div className="font-mono text-white">${val.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-slate-400">{h.amount.toLocaleString()} units</div>
                                        <div className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                            {pnl >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    {h.stopLossPrice && (
                                        <div className="mt-2 text-[10px] text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded w-fit border border-rose-900/30">
                                            SL: ${h.stopLossPrice}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

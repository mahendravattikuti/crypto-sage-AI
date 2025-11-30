
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoPrice } from '../types';

interface Props {
  prices: CryptoPrice[];
  loading: boolean;
}

export const Ticker: React.FC<Props> = ({ prices, loading }) => {
  if (loading && prices.length === 0) return <div className="h-10 bg-slate-900 w-full animate-pulse border-b border-slate-800"></div>;

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 overflow-hidden flex items-center h-10 select-none relative z-20">
      <div className="flex animate-scroll whitespace-nowrap min-w-full">
        {/* Triple the list for smoother seamless infinite scroll on wide screens */}
        {[...prices, ...prices, ...prices].map((coin, idx) => (
          <div key={`${coin.id}-${idx}`} className="flex items-center px-6 space-x-2 border-r border-slate-800/50">
            <span className="font-bold text-xs text-slate-400 uppercase">{coin.symbol}</span>
            <span className="font-mono text-sm text-slate-200">
                ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <div className={`flex items-center text-xs ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
};

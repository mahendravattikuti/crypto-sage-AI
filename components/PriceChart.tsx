
import React, { useEffect, useRef, memo } from 'react';

interface Props {
  symbol: string;
}

export const PriceChart: React.FC<Props> = memo(({ symbol }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget content to prevent duplicates
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // TradingView Widget Config
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `BINANCE:${symbol.toUpperCase()}USDT`,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com",
      "backgroundColor": "rgba(15, 23, 42, 1)", // Match slate-900
      "gridColor": "rgba(30, 41, 59, 1)" // Match slate-800
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative z-0" ref={container}>
       <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
       </div>
    </div>
  );
});

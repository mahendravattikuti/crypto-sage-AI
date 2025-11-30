
import { useState, useEffect, useCallback } from 'react';
import { CryptoPrice } from '../types';

// Crypto Config
export const COIN_CONFIG: Record<string, { symbol: string, name: string }> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  solana: { symbol: 'SOL', name: 'Solana' },
  binancecoin: { symbol: 'BNB', name: 'BNB' },
  ripple: { symbol: 'XRP', name: 'XRP' },
  cardano: { symbol: 'ADA', name: 'Cardano' },
  'avalanche-2': { symbol: 'AVAX', name: 'Avalanche' },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin' },
  tron: { symbol: 'TRX', name: 'Tron' },
  chainlink: { symbol: 'LINK', name: 'Chainlink' },
  polkadot: { symbol: 'DOT', name: 'Polkadot' },
  'shiba-inu': { symbol: 'SHIB', name: 'Shiba Inu' },
  litecoin: { symbol: 'LTC', name: 'Litecoin' },
  'bitcoin-cash': { symbol: 'BCH', name: 'Bitcoin Cash' },
  uniswap: { symbol: 'UNI', name: 'Uniswap' },
  stellar: { symbol: 'XLM', name: 'Stellar' },
  near: { symbol: 'NEAR', name: 'NEAR Protocol' },
  aptos: { symbol: 'APT', name: 'Aptos' }
};

const COIN_IDS = Object.keys(COIN_CONFIG).join(',');

const FALLBACK_ASSETS: CryptoPrice[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 96543, price_change_percentage_24h: 2.5 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 3450, price_change_percentage_24h: -1.2 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 185, price_change_percentage_24h: 5.4 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', current_price: 45.20, price_change_percentage_24h: 1.1 },
];

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`);
      const data = await response.json();
      
      const formatted: CryptoPrice[] = Object.keys(data).map(key => {
        const config = COIN_CONFIG[key] || { symbol: key.substring(0,3).toUpperCase(), name: key };
        return {
          id: key,
          symbol: config.symbol,
          name: config.name,
          current_price: data[key].usd,
          price_change_percentage_24h: data[key].usd_24h_change
        };
      });
      
      // Sort by Market Cap proxy (roughly defined by order in config or price) 
      // or just keep original ID order for consistency
      const ordered = Object.keys(COIN_CONFIG)
        .map(id => formatted.find(item => item.id === id))
        .filter((item): item is CryptoPrice => item !== undefined);

      setPrices(ordered);
    } catch (e) {
      console.warn("API fetch failed, using fallback data", e);
      setPrices(FALLBACK_ASSETS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, refresh: fetchPrices };
};

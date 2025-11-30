
import { Portfolio } from "../types";

const INITIAL_PORTFOLIO: Portfolio = {
  usdtBalance: 50000,
  holdings: {},
  tradeHistory: [],
  performanceHistory: [{ timestamp: Date.now(), value: 50000 }]
};

// Simulate a database using LocalStorage
export const storageService = {
  
  // Load user's portfolio or return default
  loadPortfolio: (email: string): Portfolio => {
    try {
      const key = `crypto_sage_portfolio_${email.toLowerCase().trim()}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: Portfolio = JSON.parse(saved);
        // Migration for existing users who might lack performanceHistory
        if (!parsed.performanceHistory) {
            parsed.performanceHistory = [{ timestamp: Date.now(), value: parsed.usdtBalance }];
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load portfolio", e);
    }
    return INITIAL_PORTFOLIO;
  },

  // Save portfolio
  savePortfolio: (email: string, portfolio: Portfolio): void => {
    try {
      const key = `crypto_sage_portfolio_${email.toLowerCase().trim()}`;
      localStorage.setItem(key, JSON.stringify(portfolio));
    } catch (e) {
      console.error("Failed to save portfolio", e);
    }
  },

  // Persist last logged in user for convenience (optional)
  getLastUser: (): string | null => {
    return localStorage.getItem('crypto_sage_last_user');
  },

  setLastUser: (email: string | null): void => {
    if (email) {
      localStorage.setItem('crypto_sage_last_user', email);
    } else {
      localStorage.removeItem('crypto_sage_last_user');
    }
  }
};

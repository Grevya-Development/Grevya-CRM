import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
}

const defaultCurrencies: Currency[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1, isDefault: true, isActive: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 83.33, isDefault: false, isActive: true },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 90.91, isDefault: false, isActive: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 105.26, isDefault: false, isActive: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 22.68, isDefault: false, isActive: false },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchangeRate: 62.11, isDefault: false, isActive: false },
];

interface CurrencyContextType {
  currencies: Currency[];
  defaultCurrency: Currency;
  displayCurrency: Currency;
  autoConvert: boolean;
  isConverting: boolean;
  setCurrencies: (currencies: Currency[]) => void;
  setDefaultCurrency: (code: string) => void;
  setDisplayCurrency: (code: string) => void;
  setAutoConvert: (enabled: boolean) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatInDefaultCurrency: (amount: number) => string;
  formatAndConvert: (amount: number, fromCurrency?: string) => string;
  refreshExchangeRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const saved = localStorage.getItem('crm-currencies');
    return saved ? JSON.parse(saved) : defaultCurrencies;
  });

  const [displayCurrencyCode, setDisplayCurrencyCode] = useState<string>(() => {
    return localStorage.getItem('crm-display-currency') || 'INR';
  });

  const [autoConvert, setAutoConvertState] = useState<boolean>(() => {
    const saved = localStorage.getItem('crm-auto-convert');
    return saved ? JSON.parse(saved) : true;
  });

  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    localStorage.setItem('crm-currencies', JSON.stringify(currencies));
  }, [currencies]);

  useEffect(() => {
    localStorage.setItem('crm-display-currency', displayCurrencyCode);
  }, [displayCurrencyCode]);

  useEffect(() => {
    localStorage.setItem('crm-auto-convert', JSON.stringify(autoConvert));
  }, [autoConvert]);

  const defaultCurrency = currencies.find(c => c.isDefault) || currencies[0];
  const displayCurrency = currencies.find(c => c.code === displayCurrencyCode) || defaultCurrency;

  const setDefaultCurrency = (code: string) => {
    setCurrencies(prev => prev.map(c => ({
      ...c,
      isDefault: c.code === code
    })));
  };

  const setDisplayCurrency = (code: string) => {
    setIsConverting(true);
    setDisplayCurrencyCode(code);
    // Add small delay to show loading state
    setTimeout(() => setIsConverting(false), 300);
  };

  const setAutoConvert = (enabled: boolean) => {
    setAutoConvertState(enabled);
  };

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;

    const fromCurrency = currencies.find(c => c.code === from);
    const toCurrency = currencies.find(c => c.code === to);
    if (!fromCurrency || !toCurrency) return amount;

    // Convert to INR first (base), then to target currency
    const inrAmount = amount / fromCurrency.exchangeRate;
    const converted = inrAmount * toCurrency.exchangeRate;

    // Round to 2 decimal places to prevent precision issues
    return Math.round(converted * 100) / 100;
  };

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const code = currencyCode || displayCurrency.code;
    const currency = currencies.find(c => c.code === code);
    if (!currency) return `${displayCurrency.symbol}${amount.toLocaleString()}`;

    try {
      const formatter = new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      return formatter.format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency.symbol}${amount.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      })}`;
    }
  };

  const formatInDefaultCurrency = (amount: number): string => {
    return formatCurrency(amount, defaultCurrency.code);
  };

  // Main function to format and convert currency based on auto-convert setting
  const formatAndConvert = (amount: number, fromCurrency?: string): string => {
    const sourceCurrency = fromCurrency || defaultCurrency.code;

    if (!autoConvert) {
      // Just format in original currency
      return formatCurrency(amount, sourceCurrency);
    }

    // Convert to display currency
    const convertedAmount = convertCurrency(amount, sourceCurrency, displayCurrency.code);
    return formatCurrency(convertedAmount, displayCurrency.code);
  };

  const refreshExchangeRates = async (): Promise<void> => {
    // In a real app, this would fetch from an API
    // For now, we'll simulate an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate updated rates: 1 FOREIGN_CURRENCY = X INR
        const updatedRates = {
          USD: 83.33,  // 1 USD = 83.33 INR
          EUR: 90.91,  // 1 EUR = 90.91 INR
          GBP: 105.26, // 1 GBP = 105.26 INR
          AED: 22.68,  // 1 AED = 22.68 INR
          SGD: 62.11,  // 1 SGD = 62.11 INR
        };

        setCurrencies(prev => prev.map(c => ({
          ...c,
          exchangeRate: c.code === 'INR' ? 1 : (updatedRates[c.code as keyof typeof updatedRates] || c.exchangeRate)
        })));

        resolve();
      }, 1500);
    });
  };

  return (
    <CurrencyContext.Provider value={{
      currencies,
      defaultCurrency,
      displayCurrency,
      autoConvert,
      isConverting,
      setCurrencies,
      setDefaultCurrency,
      setDisplayCurrency,
      setAutoConvert,
      formatCurrency,
      convertCurrency,
      formatInDefaultCurrency,
      formatAndConvert,
      refreshExchangeRates,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

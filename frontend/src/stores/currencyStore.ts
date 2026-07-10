import { create } from 'zustand';

export interface Currency {
  code: string;
  symbol: string;
  flag: string;
  name: string;
}

interface CurrencyState {
  currencies: Currency[];
  activeCurrency: Currency;
  setActiveCurrency: (code: string) => void;
}

export const currencies: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee',   flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar',       flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro',            flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound',   flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen',    flag: '🇯🇵' },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin',         flag: '🟡'  },
];

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currencies,
  activeCurrency: currencies[0], // default INR
  setActiveCurrency: (code) =>
    set((state) => {
      const found = state.currencies.find((c) => c.code === code);
      return found ? { activeCurrency: found } : {};
    }),
}));

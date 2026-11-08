import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IndianRupee, DollarSign, Euro, PoundSterling } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  className,
  variant = 'default'
}) => {
  const { currencies, displayCurrency, setDisplayCurrency, isConverting } = useCurrency();

  const getCurrencyIcon = (code: string) => {
    switch (code) {
      case 'INR': return <IndianRupee className="h-4 w-4" />;
      case 'USD': return <DollarSign className="h-4 w-4" />;
      case 'EUR': return <Euro className="h-4 w-4" />;
      case 'GBP': return <PoundSterling className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const activeCurrencies = currencies.filter(c => c.isActive);

  if (variant === 'compact') {
    return (
      <Select value={displayCurrency.code} onValueChange={setDisplayCurrency} disabled={isConverting}>
        <SelectTrigger className={cn("w-[100px] h-9", className)}>
          <div className="flex items-center gap-2">
            {getCurrencyIcon(displayCurrency.code)}
            <span className="text-xs font-medium">{displayCurrency.code}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {activeCurrencies.map(currency => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                {getCurrencyIcon(currency.code)}
                <span>{currency.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={displayCurrency.code} onValueChange={setDisplayCurrency} disabled={isConverting}>
      <SelectTrigger className={cn("w-[180px]", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {getCurrencyIcon(displayCurrency.code)}
            <span>{displayCurrency.name} ({displayCurrency.code})</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {activeCurrencies.map(currency => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              {getCurrencyIcon(currency.code)}
              <div>
                <p className="font-medium">{currency.name}</p>
                <p className="text-xs text-muted-foreground">{currency.code}</p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  sourceCurrency?: string;
  className?: string;
  showOriginal?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  sourceCurrency,
  className,
  showOriginal = false
}) => {
  const { formatAndConvert, displayCurrency, autoConvert, formatCurrency, defaultCurrency } = useCurrency();

  const source = sourceCurrency || defaultCurrency.code;
  const displayValue = formatAndConvert(amount, source);

  if (!autoConvert || source === displayCurrency.code || !showOriginal) {
    return <span className={cn(className)}>{displayValue}</span>;
  }

  // Show both original and converted value
  const originalValue = formatCurrency(amount, source);

  return (
    <span className={cn(className)}>
      <span className="font-semibold">{displayValue}</span>
      {showOriginal && (
        <span className="text-xs text-muted-foreground ml-2">
          (≈ {originalValue})
        </span>
      )}
    </span>
  );
};

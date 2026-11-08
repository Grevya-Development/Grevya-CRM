import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
  RefreshCw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

export const CurrencySettings: React.FC = () => {
  const {
    currencies,
    setCurrencies,
    displayCurrency,
    setDisplayCurrency,
    setDefaultCurrency,
    autoConvert,
    setAutoConvert,
    formatCurrency,
    convertCurrency,
    refreshExchangeRates
  } = useCurrency();

  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCurrencyIcon = (code: string) => {
    switch (code) {
      case 'INR': return <IndianRupee className="h-4 w-4" />;
      case 'USD': return <DollarSign className="h-4 w-4" />;
      case 'EUR': return <Euro className="h-4 w-4" />;
      case 'GBP': return <PoundSterling className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const handleToggleCurrency = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    setCurrencies(currencies.map(c => 
      c.code === code ? { ...c, isActive: !c.isActive } : c
    ));
    toast.success(`Currency ${code} ${currency?.isActive ? 'disabled' : 'enabled'}`);
  };

  const handleSetDefault = (code: string) => {
    setDefaultCurrency(code);
    toast.success(`${code} set as default currency`);
  };

  const handleUpdateRate = (code: string, rate: number) => {
    setCurrencies(currencies.map(c =>
      c.code === code ? { ...c, exchangeRate: rate } : c
    ));
  };

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    toast.info('Fetching latest exchange rates...');
    try {
      await refreshExchangeRates();
      setLastUpdated(new Date().toLocaleString());
      toast.success('Exchange rates updated successfully');
    } catch (error) {
      toast.error('Failed to update exchange rates');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sample Leads for preview
  const sampleLeads = [
    { name: 'Enterprise License', originalValue: 15000000, currency: 'INR' },
    { name: 'Cloud Migration', originalValue: 250000, currency: 'USD' },
    { name: 'EU Expansion', originalValue: 180000, currency: 'EUR' },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Multi-Currency Settings
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshRates}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Rates'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Display Currency</Label>
              <Select value={displayCurrency.code} onValueChange={setDisplayCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.filter(c => c.isActive).map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        {getCurrencyIcon(currency.code)}
                        {currency.name} ({currency.code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All values will be displayed in this currency
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Convert Values</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically convert to display currency
                  </p>
                </div>
                <Switch checked={autoConvert} onCheckedChange={setAutoConvert} />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </CardContent>
      </Card>

      {/* Currency Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Currencies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Exchange Rate (to INR)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map(currency => (
                <TableRow key={currency.code}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCurrencyIcon(currency.code)}
                      <div>
                        <p className="font-medium">{currency.name}</p>
                        <p className="text-xs text-muted-foreground">{currency.code}</p>
                      </div>
                      {currency.isDefault && (
                        <Badge variant="default" className="ml-2">Default</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-lg">{currency.symbol}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">1 {currency.code} =</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={currency.exchangeRate.toFixed(2)}
                        onChange={(e) => handleUpdateRate(currency.code, parseFloat(e.target.value) || 1)}
                        className="w-24"
                        disabled={currency.code === 'INR'}
                      />
                      <span>INR</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={currency.isActive ? 'default' : 'secondary'}>
                      {currency.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleCurrency(currency.code)}
                        disabled={currency.isDefault}
                      >
                        {currency.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      {!currency.isDefault && currency.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(currency.code)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            See how Leads values appear in {displayCurrency.code}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leads</TableHead>
                <TableHead>Original Value</TableHead>
                <TableHead>Display Value ({displayCurrency.code})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleLeads.map((Leads, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{Leads.name}</TableCell>
                  <TableCell>
                    {formatCurrency(Leads.originalValue, Leads.currency)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Leads.currency})
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(
                      convertCurrency(Leads.originalValue, Leads.currency, displayCurrency.code),
                      displayCurrency.code
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

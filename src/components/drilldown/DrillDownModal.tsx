import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Building2,
  Calendar,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

interface DrillDownData {
  type: 'revenue' | 'Leads' | 'leads' | 'conversion' | 'pipeline' | 'contacts' | 'companies';
  title: string;
  value: string | number;
  breakdown: DrillDownItem[];
}

interface DrillDownItem {
  id: string;
  label: string;
  value: number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  details?: DrillDownDetail[];
  children?: DrillDownItem[];
}

interface DrillDownDetail {
  id: string;
  name: string;
  value: number;
  date?: string;
  status?: string;
  assignee?: string;
  contact?: string;
  company?: string;
}

interface DrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DrillDownData | null;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const { formatCurrency, displayCurrency } = useCurrency();
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState<DrillDownItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DrillDownItem | null>(null);

  React.useEffect(() => {
    if (data) {
      setCurrentLevel(data.breakdown);
      setBreadcrumbs([data.title]);
      setSelectedItem(null);
    }
  }, [data]);

  /* ---------------- HELPER: FORMAT VALUE BASED ON TYPE ---------------- */
  const formatValue = (val: string | number) => {
    if (!data) return val;
    if (data.type === 'conversion') return `${val}%`;
    if (data.type === 'revenue' || data.type === 'pipeline') return formatCurrency(Number(val));
    return val; // Counts like Leads, Contacts, etc.
  };

  const handleDrillDown = (item: DrillDownItem) => {
    if (item.children && item.children.length > 0) {
      setCurrentLevel(item.children);
      setBreadcrumbs(prev => [...prev, item.label]);
    } else if (item.details && item.details.length > 0) {
      setSelectedItem(item);
      setBreadcrumbs(prev => [...prev, item.label]);
    }
  };

  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
      setBreadcrumbs(prev => prev.slice(0, -1));
    } else if (breadcrumbs.length > 1) {
      setBreadcrumbs(prev => prev.slice(0, -1));
      // Navigate back to parent level
      if (data) {
        setCurrentLevel(data.breakdown);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'revenue': return DollarSign;
      case 'Leads': return Briefcase;
      case 'leads': return Users;
      case 'contacts': return Users;
      case 'companies': return Building2;
      default: return TrendingUp;
    }
  };

  if (!data) return null;

  const Icon = getIcon(data.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Drill-Down Analysis</DialogTitle>
          </div>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="h-4 w-4" />}
                <span className={cn(
                  idx === breadcrumbs.length - 1 && 'text-foreground font-medium'
                )}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          {selectedItem?.details ? (
            /* Detail View */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatValue(selectedItem.value)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Count</p>
                  <p className="text-2xl font-bold">{selectedItem.details.length}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <div className="flex items-center gap-2">
                    {selectedItem.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : selectedItem.trend === 'down' ? (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    ) : null}
                    <span className={cn(
                      'text-xl font-bold',
                      selectedItem.trend === 'up' && 'text-success',
                      selectedItem.trend === 'down' && 'text-destructive'
                    )}>
                      {selectedItem.trendValue || 'N/A'}
                    </span>
                  </div>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedItem.details.map((detail) => (
                    <TableRow key={detail.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{detail.name}</TableCell>
                      <TableCell>{formatValue(detail.value)}</TableCell>
                      <TableCell>{detail.contact || '-'}</TableCell>
                      <TableCell>{detail.company || '-'}</TableCell>
                      <TableCell>{detail.date || '-'}</TableCell>
                      <TableCell>
                        {detail.status && (
                          <Badge variant={
                            detail.status === 'won' ? 'default' :
                            detail.status === 'lost' ? 'destructive' : 'secondary'
                          }>
                            {detail.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Level View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentLevel.map((item) => {
                const getTrendColors = () => {
                  if (item.trend === 'up') {
                    return {
                      pillBg: 'bg-[#DCFCE7]',
                      pillText: 'text-[#16A34A]',
                    };
                  } else if (item.trend === 'down') {
                    return {
                      pillBg: 'bg-[#FFE4E6]',
                      pillText: 'text-[#E11D48]',
                    };
                  }
                  return {
                    pillBg: 'bg-gray-100',
                    pillText: 'text-gray-700',
                  };
                };

                const colors = getTrendColors();

                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl bg-white dark:bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer group"
                    onClick={() => handleDrillDown(item)}
                  >
                    {/* Subtle background decoration */}
                    <div className="absolute top-0 left-0 w-40 h-40 opacity-[0.06] pointer-events-none">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        <path
                          d="M0 0 L140 0 C110 30, 80 55, 0 120 Z"
                          fill="currentColor"
                          className="text-gray-900"
                        />
                      </svg>
                    </div>

                    {/* Content wrapper */}
                    <div className="relative px-5 py-4">
                      {/* Top section: Title and Main Value */}
                      <div className="flex items-start justify-between mb-3 gap-4">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-medium text-[#9CA3AF] dark:text-gray-400 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.label}
                          </p>
                          <p className="text-lg leading-tight font-bold text-[#1F2937] dark:text-foreground tracking-tight truncate">
                            {formatValue(item.value)}
                          </p>
                          {item.subValue && (
                            <p className="text-xs text-[#9CA3AF] dark:text-muted-foreground mt-1">
                              {item.subValue}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-[1px] bg-gradient-to-r from-gray-200 via-gray-100 to-transparent dark:from-border/40 dark:via-border/20 mb-3" />

                      {/* Bottom section: Trend value and arrow */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Pill badge with trend value */}
                          {item.trendValue && (
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold",
                                colors.pillBg,
                                colors.pillText
                              )}
                            >
                              {item.trendValue}
                            </span>
                          )}
                        </div>

                        {/* Arrow icon */}
                        {(item.children || item.details) && (
                          <ArrowRight
                            className="h-4 w-4 text-[#60A5FA] dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-200"
                            strokeWidth={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DrillDownModal;

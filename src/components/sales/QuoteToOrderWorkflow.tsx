import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { quotes, orderWorkflow } from '@/data/salesData';
import { CheckCircle, Clock, Circle, ArrowRight, RefreshCw, FileText, Database, CreditCard, Package, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
 
interface WorkflowStep {
  id: string;
  stage: string;
  status: 'completed' | 'in-progress' | 'pending';
  date: string | null;
  icon: React.ReactNode;
}
 
export function QuoteToOrderWorkflow() {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('4');
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([
    { id: '1', stage: 'Quote Created', status: 'completed', date: '2024-11-15', icon: <FileText className="h-5 w-5" /> },
    { id: '2', stage: 'Quote Approved', status: 'completed', date: '2024-11-20', icon: <CheckCircle className="h-5 w-5" /> },
    { id: '3', stage: 'Order Created', status: 'completed', date: '2024-11-25', icon: <FileText className="h-5 w-5" /> },
    { id: '4', stage: 'ERP Sync', status: 'completed', date: '2024-11-25', icon: <Database className="h-5 w-5" /> },
    { id: '5', stage: 'Invoice Generated', status: 'in-progress', date: '2024-12-01', icon: <CreditCard className="h-5 w-5" /> },
    { id: '6', stage: 'Payment Received', status: 'pending', date: null, icon: <CreditCard className="h-5 w-5" /> },
    { id: '7', stage: 'Order Fulfilled', status: 'pending', date: null, icon: <Truck className="h-5 w-5" /> },
  ]);
 
  const convertedQuotes = quotes.filter(q => q.status === 'converted' || q.status === 'approved');
 
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-6 w-6 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Circle className="h-6 w-6 text-muted-foreground" />;
      default:
        return null;
    }
  };
 
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'pending':
        return 'border-muted bg-muted/50';
      default:
        return 'border-muted';
    }
  };
 
  const handleAdvanceStep = (stepId: string) => {
    setWorkflow(prev => prev.map((step, index) => {
      if (step.id === stepId && step.status === 'in-progress') {
        return { ...step, status: 'completed' as const, date: new Date().toISOString().split('T')[0] };
      }
      if (index > 0 && prev[index - 1].id === stepId && step.status === 'pending') {
        return { ...step, status: 'in-progress' as const };
      }
      return step;
    }));
    toast({
      title: "Workflow Updated",
      description: "Step has been completed.",
    });
  };
 
  const handleSyncERP = () => {
    toast({
      title: "ERP Sync Initiated",
      description: "Order data is being synced with ERP system.",
    });
  };
 
  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
 
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Quote to Order Workflow</h3>
          <p className="text-sm text-muted-foreground">Track and manage the order fulfillment process</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a quote" />
            </SelectTrigger>
            <SelectContent>
              {convertedQuotes.map(quote => (
                <SelectItem key={quote.id} value={quote.id}>
                  {quote.quoteNumber} - {quote.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSyncERP} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync ERP
          </Button>
        </div>
      </div>
 
      {/* Quote Summary */}
      {selectedQuote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Quote Number</p>
                <p className="font-medium">{selectedQuote.quoteNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedQuote.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sales Person</p>
                <p className="font-medium">{selectedQuote.salesPersonName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="font-bold text-primary">{formatCurrency(selectedQuote.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
 
      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-muted" />
           
            <div className="space-y-6">
              {workflow.map((step, index) => (
                <div key={step.id} className="relative flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 ${getStatusColor(step.status)}`}>
                    {getStatusIcon(step.status)}
                  </div>
                 
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{step.stage}</p>
                        {step.date && (
                          <p className="text-sm text-muted-foreground">{step.date}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          step.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : step.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-muted text-muted-foreground'
                        }>
                          {step.status}
                        </Badge>
                        {step.status === 'in-progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceStep(step.id)}
                            className="gap-1"
                          >
                            Complete
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
 
      {/* ERP Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ERP Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Data Points</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">SAP ERP</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Connected
                  </Badge>
                </TableCell>
                <TableCell>2024-12-08 14:30</TableCell>
                <TableCell>Order, Customer, Invoice</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Sync
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tally Prime</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Connected
                  </Badge>
                </TableCell>
                <TableCell>2024-12-08 14:25</TableCell>
                <TableCell>Invoice, Payment</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Sync
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Inventory System</TableCell>
                <TableCell>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Pending
                  </Badge>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>Stock, Fulfillment</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Connect
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
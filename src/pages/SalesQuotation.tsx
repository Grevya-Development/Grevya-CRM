import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesOverview } from '@/components/sales/SalesOverview';
import { ProductCatalog } from '@/components/sales/ProductCatalog';
import { QuotesManagement } from '@/components/sales/QuotesManagement';
import { QuoteToOrderWorkflow } from '@/components/sales/QuoteToOrderWorkflow';
import { TerritoryQuoteManagement } from '@/components/sales/TerritoryQuoteManagement';
import { InvoicesManagement } from '@/components/sales/InvoicesManagement';
import { Package, FileText, ArrowRightLeft, MapPin, ReceiptText } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function SalesQuotation() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <div>
        <Header title="Sales & Quotation Management" subtitle="Manage products, generate quotes, and track order workflows" />
      </div>

      <Tabs defaultValue="overview" className="space-y-6 p-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-muted/50 rounded-lg border border-border shadow-sm">
          <TabsTrigger
            value="overview"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Product Catalog</span>
            <span className="sm:hidden">Products</span>
          </TabsTrigger>
          <TabsTrigger
            value="quotes"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Quotes</span>
            <span className="sm:hidden">Quotes</span>
          </TabsTrigger>
          <TabsTrigger
            value="workflow"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Quote to Order</span>
            <span className="sm:hidden">Workflow</span>
          </TabsTrigger>
          <TabsTrigger
            value="territory"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Territory Management</span>
            <span className="sm:hidden">Territory</span>
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all"
          >
            <ReceiptText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
            <span className="sm:hidden">Invoices</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SalesOverview />
        </TabsContent>

        <TabsContent value="products">
          <ProductCatalog />
        </TabsContent>

        <TabsContent value="quotes">
          <QuotesManagement />
        </TabsContent>

        <TabsContent value="workflow">
          <QuoteToOrderWorkflow />
        </TabsContent>

        <TabsContent value="territory">
          <TerritoryQuoteManagement />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
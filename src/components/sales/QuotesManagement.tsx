import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  quotes as initialQuotes,
  products,
  Quote,
  salesPersons,
} from "@/data/salesData";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Copy,
  Send,
  Check,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function QuotesManagement() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [territoryFilter, setTerritoryFilter] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "quoteNumber" | "total" | "status" | "validUntil"
  >("quoteNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, territoryFilter]);

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.salesPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.territory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || quote.status === statusFilter;
    const matchesTerritory =
      territoryFilter === "all" || quote.territory === territoryFilter;
    return matchesSearch && matchesStatus && matchesTerritory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted text-muted-foreground";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "converted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const getTerritoryColor = (territory: string) => {
    switch (territory) {
      case "North India":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "South India":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "East India":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "West India":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Central India":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };


  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  const paginatedQuotes = sortedQuotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "level1":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "level2":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "final":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const handleCreateQuote = () => {
    const newQuote: Quote = {
      id: String(quotes.length + 1),
      quoteNumber: `QT-2024-${String(quotes.length + 1).padStart(3, "0")}`,
      version: 1,
      status: "draft",
      customerId: "1",
      customerName: "New Customer",
      companyName: "New Company",
      salesPersonId: "1",
      salesPersonName: "Rahul Sharma",
      territory: "North India",
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      currency: "INR",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      approvalStatus: "pending",
      approvers: [],
      notes: "",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setQuotes([...quotes, newQuote]);
    toast({
      title: "Quote Created",
      description: `Quote ${newQuote.quoteNumber} has been created.`,
    });
    setIsCreateDialogOpen(false);
  };

  const navigateToNewQuotation = () => {
    navigate('/quotations/new');
  };

  const navigateToQuotation = (quoteId: string) => {
    navigate(`/quotations/${quoteId}`);
  };

  const handleDuplicateQuote = (quote: Quote) => {
    const newQuote: Quote = {
      ...quote,
      id: String(quotes.length + 1),
      quoteNumber: `QT-2024-${String(quotes.length + 1).padStart(3, "0")}`,
      version: 1,
      status: "draft",
      approvalStatus: "pending",
      approvers: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setQuotes([...quotes, newQuote]);
    toast({
      title: "Quote Duplicated",
      description: `Quote ${newQuote.quoteNumber} has been created from ${quote.quoteNumber}.`,
    });
  };

  const handleApproveQuote = (quoteId: string) => {
    setQuotes(
      quotes.map((q) =>
        q.id === quoteId
          ? {
            ...q,
            status: "approved" as const,
            approvalStatus: "final" as const,
          }
          : q
      )
    );
    toast({
      title: "Quote Approved",
      description: "The quote has been approved.",
    });
  };

  const handleRejectQuote = (quoteId: string) => {
    setQuotes(
      quotes.map((q) =>
        q.id === quoteId ? { ...q, status: "rejected" as const } : q
      )
    );
    toast({
      title: "Quote Rejected",
      description: "The quote has been rejected.",
    });
  };

  const handleConvertToOrder = (quoteId: string) => {
    setQuotes(
      quotes.map((q) =>
        q.id === quoteId ? { ...q, status: "converted" as const } : q
      )
    );
    toast({
      title: "Quote Converted",
      description: "The quote has been converted to an order.",
    });
  };

  const stats = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    pending: quotes.filter((q) => q.status === "pending").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    converted: quotes.filter((q) => q.status === "converted").length,
    totalValue: quotes
      .filter((q) => ["approved", "converted"].includes(q.status))
      .reduce((sum, q) => sum + q.total, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {stats.draft}
            </p>
            <p className="text-xs text-muted-foreground">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.approved}
            </p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.converted}
            </p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-primary">
              {formatCurrency(stats.totalValue)}
            </p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="North India">North India</SelectItem>
              <SelectItem value="South India">South India</SelectItem>
              <SelectItem value="East India">East India</SelectItem>
              <SelectItem value="West India">West India</SelectItem>
              <SelectItem value="Central India">Central India</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={navigateToNewQuotation}>
              <Plus className="h-4 w-4" />
              Create Quote
            </Button>
          </DialogTrigger>
          <Button onClick={() => navigate('/quotations/landing')}>
            <Download className="h-4 w-4" />
            Import Records
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Quote</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        Sarah Johnson - TechCorp Inc.
                      </SelectItem>
                      <SelectItem value="2">
                        Michael Chen - Innovate.io
                      </SelectItem>
                      <SelectItem value="3">
                        Emily Rodriguez - GlobalTech
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sales Person</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesPersons.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Products</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Add products" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.basePrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Territory</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north">North India</SelectItem>
                      <SelectItem value="south">South India</SelectItem>
                      <SelectItem value="east">East India</SelectItem>
                      <SelectItem value="west">West India</SelectItem>
                      <SelectItem value="central">Central India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Add notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateQuote}>Create Quote</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quotes</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => {
                    setSortBy("quoteNumber");
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  }}
                >
                  Quote #
                </TableHead>

                <TableHead>Customer</TableHead>
                <TableHead>Sales Person</TableHead>
                <TableHead className="text-center">Territory</TableHead>

                <TableHead
                  className="cursor-pointer"
                  onClick={() => {
                    setSortBy("total");
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  }}
                >
                  Total
                </TableHead>

                <TableHead
                  className="cursor-pointer"
                  onClick={() => {
                    setSortBy("status");
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  }}
                >
                  Status
                </TableHead>

                <TableHead
                  className="cursor-pointer"
                  onClick={() => {
                    setSortBy("validUntil");
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  }}
                >
                  Valid Until
                </TableHead>

                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{quote.quoteNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        v{quote.version}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{quote.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.companyName}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>{quote.salesPersonName}</TableCell>

                  <TableCell className="text-center min-w-[140px]">
                    <Badge
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getTerritoryColor(
                        quote.territory
                      )}`}
                    >
                      {quote.territory}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-medium">
                    {formatCurrency(quote.total)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                      {getApprovalStatusIcon(quote.approvalStatus)}
                    </div>
                  </TableCell>

                  <TableCell>{quote.validUntil}</TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateToQuotation(quote.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateQuote(quote)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {quote.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApproveQuote(quote.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRejectQuote(quote.id)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}

                      {quote.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConvertToOrder(quote.id)}
                        >
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* MAIN TABLE PAGINATION */}
          <div className="flex justify-end items-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(sortedQuotes.length / pageSize)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage * pageSize >= sortedQuotes.length}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quote Details Dialog */}
      {selectedQuote && (
        <Dialog
          open={!!selectedQuote}
          onOpenChange={() => setSelectedQuote(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedQuote.quoteNumber}</DialogTitle>
                <Badge className={getStatusColor(selectedQuote.status)}>
                  {selectedQuote.status}
                </Badge>
              </div>
            </DialogHeader>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Line Items</TabsTrigger>
                <TabsTrigger value="approval">Approval History</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">{selectedQuote.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedQuote.companyName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Sales Person
                    </Label>
                    <p className="font-medium">
                      {selectedQuote.salesPersonName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedQuote.territory}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{selectedQuote.createdAt}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Valid Until</Label>
                    <p>{selectedQuote.validUntil}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedQuote.notes || "No notes"}</p>
                </div>
              </TabsContent>
              <TabsContent value="items" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuote.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.discount}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(selectedQuote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-red-600">
                        -{formatCurrency(selectedQuote.discount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (18%)</span>
                      <span>{formatCurrency(selectedQuote.tax)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedQuote.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="approval" className="space-y-4">
                {selectedQuote.approvers.length > 0 ? (
                  <div className="space-y-4">
                    {selectedQuote.approvers.map((approver) => (
                      <Card key={approver.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{approver.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {approver.role}
                            </p>
                            {approver.comments && (
                              <p className="text-sm mt-1 italic">
                                "{approver.comments}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {approver.date && (
                              <span className="text-sm text-muted-foreground">
                                {approver.date}
                              </span>
                            )}
                            <Badge
                              className={
                                approver.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : approver.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {approver.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No approval history yet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

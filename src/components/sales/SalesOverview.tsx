import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { quotes, products, salesPersons } from '@/data/salesData';
import { TrendingUp, TrendingDown, Package, FileText, CheckCircle, Clock, DollarSign, Users, Plus, ArrowRight } from 'lucide-react';

export function SalesOverview() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        approvedQuotes: quotes.filter(q => q.status === 'approved').length,
        convertedQuotes: quotes.filter(q => q.status === 'converted').length,
        totalRevenue: quotes.filter(q => ['approved', 'converted'].includes(q.status)).reduce((sum, q) => sum + q.total, 0),
        pendingRevenue: quotes.filter(q => q.status === 'pending').reduce((sum, q) => sum + q.total, 0),
    };

    const recentQuotes = quotes.slice(0, 5);
    const topSalesPersons = [...salesPersons].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
                    <div className="relative z-10">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Revenue</p>
                        <p className="text-lg font-semibold text-foreground leading-tight">{formatCurrency(stats.totalRevenue)}</p>
                        <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            +12.5% from last month
                        </span>
                    </div>
                    <DollarSign className="absolute right-2 bottom-2 h-5 w-5 text-indigo-500 opacity-40" />
                </div>

                <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
                    <div className="relative z-10">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Active Quotes</p>
                        <p className="text-lg font-semibold text-foreground leading-tight">{stats.totalQuotes}</p>
                        <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {stats.pendingQuotes} pending approval
                        </span>
                    </div>
                    <FileText className="absolute right-2 bottom-2 h-5 w-5 text-indigo-500 opacity-40" />
                </div>

                <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
                    <div className="relative z-10">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Conversion Rate</p>
                        <p className="text-lg font-semibold text-foreground leading-tight">{Math.round((stats.convertedQuotes / stats.totalQuotes) * 100)}%</p>
                        <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            +5.2% from last month
                        </span>
                    </div>
                    <CheckCircle className="absolute right-2 bottom-2 h-5 w-5 text-indigo-500 opacity-40" />
                </div>

                <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
                    <div className="relative z-10">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Active Products</p>
                        <p className="text-lg font-semibold text-foreground leading-tight">{stats.activeProducts}</p>
                        <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            of {stats.totalProducts} total
                        </span>
                    </div>
                    <Package className="absolute right-2 bottom-2 h-5 w-5 text-indigo-500 opacity-40" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Quotes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recent Quotes</CardTitle>
                        <Button variant="ghost" size="sm" className="gap-1">
                            View All
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentQuotes.map((quote) => (
                                <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{quote.quoteNumber}</p>
                                            <Badge variant="outline" className="text-xs">{quote.companyName}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{quote.customerName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{formatCurrency(quote.total)}</p>
                                        <Badge className={
                                            quote.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                    quote.status === 'converted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                        'bg-muted text-muted-foreground'
                                        }>
                                            {quote.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Sales Persons */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Top Performers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topSalesPersons.map((person, index) => (
                                <div key={person.id} className="flex items-center gap-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                        index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{person.name}</p>
                                        <p className="text-sm text-muted-foreground">{person.territory}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(person.totalRevenue)}</p>
                                        <p className="text-xs text-green-600">{person.conversionRate}% conversion</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                            <Plus className="h-5 w-5" />
                            <span className="text-sm">Create Quote</span>
                        </Button>
                        <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                            <Package className="h-5 w-5" />
                            <span className="text-sm">Add Product</span>
                        </Button>
                        <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                            <FileText className="h-5 w-5" />
                            <span className="text-sm">View Reports</span>
                        </Button>
                        <Button className="h-auto flex-col gap-2 p-4" variant="outline">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm">Pending Approvals</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
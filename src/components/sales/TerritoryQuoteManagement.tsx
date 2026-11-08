import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { quotes, salesPersons, territories, SalesPerson, Territory } from '@/data/salesData';
import { Users, MapPin, TrendingUp, Target, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
 
export function TerritoryQuoteManagement() {
  const [expandedTerritory, setExpandedTerritory] = useState<string | null>('1');
  const [viewMode, setViewMode] = useState<'territory' | 'salesperson'>('territory');
 
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
 
  const getQuotesBySalesPerson = (salesPersonId: string) => {
    return quotes.filter(q => q.salesPersonId === salesPersonId);
  };
 
  const getQuotesByTerritory = (territory: string) => {
    return quotes.filter(q => q.territory === territory);
  };
 
  const orgTree = [
    {
      id: 'india',
      name: 'India Region',
      type: 'region',
      revenue: territories.reduce((sum, t) => sum + t.revenue, 0),
      children: territories.map(territory => ({
        id: territory.id,
        name: territory.name,
        type: 'territory',
        revenue: territory.revenue,
        quotesCount: territory.quotesCount,
        children: salesPersons
          .filter(sp => sp.territory === territory.name)
          .map(sp => ({
            id: sp.id,
            name: sp.name,
            type: 'salesperson',
            email: sp.email,
            revenue: sp.totalRevenue,
            quotesCount: sp.quotesCount,
            conversionRate: sp.conversionRate,
          })),
      })),
    },
  ];
 
  const renderTreeNode = (node: any, level: number = 0) => {
    const isExpanded = expandedTerritory === node.id;
    const hasChildren = node.children && node.children.length > 0;
   
    return (
      <div key={node.id} className="border-l-2 border-muted ml-4 first:ml-0 first:border-l-0">
        <div
          className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${level === 0 ? 'bg-muted/30' : ''}`}
          onClick={() => hasChildren && setExpandedTerritory(isExpanded ? null : node.id)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4" />
            )}
           
            {node.type === 'region' && <Building2 className="h-5 w-5 text-primary" />}
            {node.type === 'territory' && <MapPin className="h-5 w-5 text-blue-500" />}
            {node.type === 'salesperson' && <Users className="h-5 w-5 text-green-500" />}
           
            <div>
              <p className="font-medium">{node.name}</p>
              {node.email && <p className="text-sm text-muted-foreground">{node.email}</p>}
            </div>
          </div>
         
          <div className="flex items-center gap-4 text-sm">
            {node.quotesCount !== undefined && (
              <div className="text-center">
                <p className="font-medium">{node.quotesCount}</p>
                <p className="text-xs text-muted-foreground">Quotes</p>
              </div>
            )}
            {node.conversionRate !== undefined && (
              <div className="text-center">
                <p className="font-medium text-green-600">{node.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            )}
            <div className="text-center min-w-24">
              <p className="font-bold text-primary">{formatCurrency(node.revenue)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
        </div>
       
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
 
  const totalStats = {
    totalRevenue: salesPersons.reduce((sum, sp) => sum + sp.totalRevenue, 0),
    totalQuotes: salesPersons.reduce((sum, sp) => sum + sp.quotesCount, 0),
    avgConversion: Math.round(salesPersons.reduce((sum, sp) => sum + sp.conversionRate, 0) / salesPersons.length),
    territories: territories.length,
  };
 
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totalStats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalQuotes}</p>
                <p className="text-xs text-muted-foreground">Total Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.avgConversion}%</p>
                <p className="text-xs text-muted-foreground">Avg Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.territories}</p>
                <p className="text-xs text-muted-foreground">Territories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
 
      <Tabs defaultValue="hierarchy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hierarchy">Org Hierarchy</TabsTrigger>
          <TabsTrigger value="territory">By Territory</TabsTrigger>
          <TabsTrigger value="salesperson">By Sales Person</TabsTrigger>
        </TabsList>
 
        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization Tree</CardTitle>
            </CardHeader>
            <CardContent>
              {orgTree.map(node => renderTreeNode(node))}
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="territory">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Territory Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Territory</TableHead>
                    <TableHead>Sales Persons</TableHead>
                    <TableHead className="text-right">Quotes</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Recent Quotes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {territories.map((territory) => (
                    <TableRow key={territory.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{territory.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {salesPersons
                            .filter(sp => sp.territory === territory.name)
                            .map(sp => (
                              <Badge key={sp.id} variant="outline" className="text-xs">
                                {sp.name.split(' ')[0]}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{territory.quotesCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(territory.revenue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getQuotesByTerritory(territory.name).slice(0, 2).map(quote => (
                            <Badge key={quote.id} variant="secondary" className="text-xs w-fit">
                              {quote.quoteNumber}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="salesperson">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales Person Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Person</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead className="text-right">Quotes</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Active Quotes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesPersons.map((sp) => (
                    <TableRow key={sp.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sp.name}</p>
                          <p className="text-sm text-muted-foreground">{sp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sp.territory}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{sp.quotesCount}</TableCell>
                      <TableCell className="text-right">
                        <span className={sp.conversionRate >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                          {sp.conversionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sp.totalRevenue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getQuotesBySalesPerson(sp.id)
                            .filter(q => ['draft', 'pending', 'approved'].includes(q.status))
                            .slice(0, 2)
                            .map(quote => (
                              <Badge key={quote.id} variant="secondary" className="text-xs w-fit">
                                {quote.quoteNumber} - {quote.status}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
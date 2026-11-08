import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  ArrowLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface DrillLevel {
  id: string;
  name: string;
  value: number;
  change: number;
  children?: DrillLevel[];
}

const hierarchyData: DrillLevel[] = [
  {
    id: '1',
    name: 'North Region',
    value: 4500000,
    change: 12.5,
    children: [
      {
        id: '1-1',
        name: 'Delhi NCR',
        value: 2200000,
        change: 15.2,
        children: [
          { id: '1-1-1', name: 'John Smith', value: 1100000, change: 18.5 },
          { id: '1-1-2', name: 'Jane Doe', value: 650000, change: 10.2 },
          { id: '1-1-3', name: 'Mike Johnson', value: 450000, change: 12.8 },
        ],
      },
      {
        id: '1-2',
        name: 'Punjab',
        value: 1200000,
        change: 8.5,
        children: [
          { id: '1-2-1', name: 'Sarah Wilson', value: 700000, change: 6.2 },
          { id: '1-2-2', name: 'Emily Brown', value: 500000, change: 12.1 },
        ],
      },
      { id: '1-3', name: 'Haryana', value: 1100000, change: 11.2 },
    ],
  },
  {
    id: '2',
    name: 'South Region',
    value: 3800000,
    change: 9.8,
    children: [
      { id: '2-1', name: 'Karnataka', value: 1800000, change: 14.5 },
      { id: '2-2', name: 'Tamil Nadu', value: 1200000, change: 6.2 },
      { id: '2-3', name: 'Kerala', value: 800000, change: 5.8 },
    ],
  },
  {
    id: '3',
    name: 'West Region',
    value: 3200000,
    change: -2.5,
    children: [
      { id: '3-1', name: 'Maharashtra', value: 2000000, change: -1.5 },
      { id: '3-2', name: 'Gujarat', value: 1200000, change: -4.2 },
    ],
  },
  {
    id: '4',
    name: 'East Region',
    value: 1800000,
    change: 22.5,
    children: [
      { id: '4-1', name: 'West Bengal', value: 1000000, change: 25.0 },
      { id: '4-2', name: 'Odisha', value: 800000, change: 19.5 },
    ],
  },
];

const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DrillDownReport: React.FC = () => {
  const [drillPath, setDrillPath] = useState<DrillLevel[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewType, setViewType] = useState<'table' | 'chart'>('table');
  const [metric, setMetric] = useState('revenue');

  const currentData = drillPath.length === 0 
    ? hierarchyData 
    : drillPath[drillPath.length - 1].children || [];

  const handleDrillDown = (item: DrillLevel) => {
    if (item.children && item.children.length > 0) {
      setDrillPath([...drillPath, item]);
    }
  };

  const handleDrillUp = () => {
    setDrillPath(drillPath.slice(0, -1));
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const chartData = currentData.map(item => ({
    name: item.name,
    value: item.value / 100000,
    change: item.change,
  }));

  const pieData = currentData.map(item => ({
    name: item.name,
    value: item.value,
  }));

  const renderTableRow = (item: DrillLevel, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedRows.has(item.id);

    return (
      <React.Fragment key={item.id}>
        <TableRow 
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors',
            hasChildren && 'font-medium'
          )}
          onClick={() => hasChildren && toggleExpand(item.id)}
        >
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )
              ) : (
                <span className="w-4" />
              )}
              <span>{item.name}</span>
              {hasChildren && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrillDown(item);
                  }}
                >
                  Drill →
                </Button>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right font-medium">
            ₹{(item.value / 100000).toFixed(2)}L
          </TableCell>
          <TableCell className="text-right">
            <div className={cn(
              'flex items-center justify-end gap-1',
              item.change >= 0 ? 'text-green-500' : 'text-destructive'
            )}>
              {item.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(item.change)}%
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Badge variant={item.change >= 10 ? 'default' : item.change >= 0 ? 'secondary' : 'destructive'}>
              {item.change >= 10 ? 'Excellent' : item.change >= 0 ? 'Good' : 'Needs Attention'}
            </Badge>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && item.children?.map(child => renderTableRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          {drillPath.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDrillUp} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Path:</span>
            <Badge variant="outline">All Regions</Badge>
            {drillPath.map((item, i) => (
              <React.Fragment key={item.id}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge 
                  variant={i === drillPath.length - 1 ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setDrillPath(drillPath.slice(0, i + 1))}
                >
                  {item.name}
                </Badge>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="Leads">Leads</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewType === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewType('table')}
            >
              Table
            </Button>
            <Button
              variant={viewType === 'chart' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewType('chart')}
            >
              Chart
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">
              ₹{(currentData.reduce((sum, item) => sum + item.value, 0) / 100000).toFixed(1)}L
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Growth</p>
            <p className="text-2xl font-bold text-green-500">
              {(currentData.reduce((sum, item) => sum + item.change, 0) / currentData.length).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Performer</p>
            <p className="text-2xl font-bold">
              {currentData.reduce((max, item) => item.value > max.value ? item : max, currentData[0])?.name}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Segments</p>
            <p className="text-2xl font-bold">{currentData.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewType === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {drillPath.length === 0 ? 'Regional Performance' : drillPath[drillPath.length - 1].name + ' Breakdown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">YoY Change</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map(item => renderTableRow(item))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Segment (₹ Lakhs)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toFixed(1)}L`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${(value / 100000).toFixed(1)}L`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

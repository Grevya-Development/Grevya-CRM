import { Header } from '@/components/layout/Header';
import { revenueData, pipelineData, dashboardStats, Leads, contacts } from '@/data/sampleData';
import { DrillDownReport } from '@/components/reports/DrillDownReport';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar, BarChart3, PieChartIcon } from 'lucide-react';

const COLORS = [
  'hsl(217, 91%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(199, 89%, 48%)',
];

const statusData = [
  { name: 'Leads', value: contacts.filter((c) => c.status === 'lead').length },
  { name: 'Prospects', value: contacts.filter((c) => c.status === 'prospect').length },
  { name: 'Customers', value: contacts.filter((c) => c.status === 'customer').length },
  { name: 'Churned', value: contacts.filter((c) => c.status === 'churned').length },
];

const LeadstageData = [
  { name: 'Qualification', value: Leads.filter((d) => d.stage === 'qualification').length },
  { name: 'Proposal', value: Leads.filter((d) => d.stage === 'proposal').length },
  { name: 'Negotiation', value: Leads.filter((d) => d.stage === 'negotiation').length },
  { name: 'Won', value: Leads.filter((d) => d.stage === 'closed-won').length },
  { name: 'Lost', value: Leads.filter((d) => d.stage === 'closed-lost').length },
];

export default function Reports() {
  return (
    <div className="min-h-screen">
      <Header title="Reports" />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <Select defaultValue="this-year">
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              ${(dashboardStats.totalRevenue / 1000).toFixed(0)}k
            </p>
            <p className="text-sm text-success mt-2">+12.5% vs last year</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
            <p className="text-sm text-muted-foreground">Avg Leads Size</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              ${(dashboardStats.avgLeadsize / 1000).toFixed(0)}k
            </p>
            <p className="text-sm text-success mt-2">+8.3% vs last year</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {dashboardStats.conversionRate}%
            </p>
            <p className="text-sm text-success mt-2">+5.2% vs last year</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
            <p className="text-sm text-muted-foreground">Sales Cycle</p>
            <p className="text-3xl font-bold text-foreground mt-2">32 days</p>
            <p className="text-sm text-success mt-2">-4 days vs last year</p>
          </div>
        </div>

        {/* Tabs for different report views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="drilldown" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Drill-Down Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                      <YAxis
                        className="text-xs fill-muted-foreground"
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(217, 91%, 50%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leads by Month */}
              <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-foreground mb-6">Leads by Month</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="Leads" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Contact Status */}
              <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  Contacts by Status
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leads Stages */}
              <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-foreground mb-6">Leads by Stage</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={LeadstageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {LeadstageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drilldown">
            <DrillDownReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

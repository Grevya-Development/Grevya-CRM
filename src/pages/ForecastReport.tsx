import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  Funnel,
  FunnelChart,
  Trapezoid,
  LabelList,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  BarChart3,
  LineChartIcon,
  Zap,
  Layers,
  DollarSign,
  IndianRupeeIcon
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Sample forecast data
const monthlyForecast = [
  { month: 'Jan', actual: 85000, forecast: 80000, target: 90000, confidence: 95 },
  { month: 'Feb', actual: 92000, forecast: 88000, target: 95000, confidence: 92 },
  { month: 'Mar', actual: 78000, forecast: 82000, target: 85000, confidence: 88 },
  { month: 'Apr', actual: 105000, forecast: 98000, target: 100000, confidence: 90 },
  { month: 'May', actual: 112000, forecast: 108000, target: 110000, confidence: 87 },
  { month: 'Jun', actual: 98000, forecast: 102000, target: 105000, confidence: 85 },
  { month: 'Jul', actual: null, forecast: 115000, target: 115000, confidence: 82 },
  { month: 'Aug', actual: null, forecast: 125000, target: 120000, confidence: 78 },
  { month: 'Sep', actual: null, forecast: 135000, target: 130000, confidence: 75 },
  { month: 'Oct', actual: null, forecast: 142000, target: 140000, confidence: 72 },
  { month: 'Nov', actual: null, forecast: 155000, target: 150000, confidence: 68 },
  { month: 'Dec', actual: null, forecast: 168000, target: 165000, confidence: 65 },
];

const quarterlyForecast = [
  { quarter: 'Q1', actual: 255000, forecast: 250000, target: 270000, variance: -5.5 },
  { quarter: 'Q2', actual: 315000, forecast: 308000, target: 315000, variance: 0 },
  { quarter: 'Q3', actual: null, forecast: 375000, target: 365000, variance: 2.7 },
  { quarter: 'Q4', actual: null, forecast: 465000, target: 455000, variance: 2.2 },
];

const productForecast = [
  { product: 'Enterprise Suite', current: 450000, forecast: 620000, growth: 37.8, probability: 85 },
  { product: 'Pro Plan', current: 280000, forecast: 385000, growth: 37.5, probability: 78 },
  { product: 'Starter Pack', current: 120000, forecast: 165000, growth: 37.5, probability: 92 },
  { product: 'Add-ons', current: 85000, forecast: 115000, growth: 35.3, probability: 88 },
  { product: 'Consulting', current: 65000, forecast: 95000, growth: 46.2, probability: 72 },
];

const regionForecast = [
  { region: 'North America', q1: 180000, q2: 210000, q3: 245000, q4: 285000, total: 920000 },
  { region: 'Europe', q1: 95000, q2: 115000, q3: 135000, q4: 155000, total: 500000 },
  { region: 'Asia Pacific', q1: 45000, q2: 58000, q3: 72000, q4: 88000, total: 263000 },
  { region: 'Latin America', q1: 22000, q2: 28000, q3: 35000, q4: 42000, total: 127000 },
];

const scenarioData = [
  { month: 'Jul', conservative: 105000, baseline: 115000, optimistic: 130000 },
  { month: 'Aug', conservative: 112000, baseline: 125000, optimistic: 145000 },
  { month: 'Sep', conservative: 120000, baseline: 135000, optimistic: 158000 },
  { month: 'Oct', conservative: 128000, baseline: 142000, optimistic: 168000 },
  { month: 'Nov', conservative: 138000, baseline: 155000, optimistic: 182000 },
  { month: 'Dec', conservative: 148000, baseline: 168000, optimistic: 198000 },
];

const repForecast = [
  { name: 'Sarah Johnson', quota: 250000, forecast: 285000, attainment: 114, deals: 12 },
  { name: 'Michael Chen', quota: 225000, forecast: 210000, attainment: 93, deals: 8 },
  { name: 'Emily Davis', quota: 200000, forecast: 235000, attainment: 117.5, deals: 15 },
  { name: 'James Wilson', quota: 225000, forecast: 195000, attainment: 86.7, deals: 6 },
  { name: 'Lisa Anderson', quota: 175000, forecast: 190000, attainment: 108.6, deals: 10 },
];

const salesPipelineData = [
  { name: 'Lead In', value: 26.85, color: '#0EA5E9' },
  { name: 'Contact Made', value: 18.46, color: '#312E81' },
  { name: 'Interview', value: 14.85, color: '#6366F1' },
  { name: 'Proposal', value: 9.84, color: '#F43F5E' },
  { name: 'Negotiation', value: 5.06, color: '#10B981' },
  { name: 'Closed Lost', value: 21.32, color: '#8B5CF6' },
];

const lossReasonsData = [
  { name: 'Feature limitations', value: 32.97, color: '#0EA5E9' },
  { name: 'Budget constraints', value: 21.10, color: '#312E81' },
  { name: 'Price too high', value: 18.46, color: '#6366F1' },
  { name: 'Better alternative', value: 14.07, color: '#F43F5E' },
  { name: 'Lack of urgency', value: 13.41, color: '#10B981' },
];

const wonDealsTrend = [
  { month: 'Jan 2025', closedValue: 120, wonDeals: 2 },
  { month: 'Mar 2025', closedValue: 80, wonDeals: 4 },
  { month: 'May 2025', closedValue: 250, wonDeals: 3 },
  { month: 'Jul 2025', closedValue: 180, wonDeals: 2 },
  { month: 'Sep 2025', closedValue: 260, wonDeals: 4 },
  { month: 'Nov 2025', closedValue: 200, wonDeals: 3 },
  { month: 'Jan 2026', closedValue: 150, wonDeals: 3 },
];

const dealsProjectionTrend = [
  { month: 'Jan 2026', projectedValue: 800, dealsDue: 100 },
  { month: 'Mar 2026', projectedValue: 2500, dealsDue: 180 },
  { month: 'May 2026', projectedValue: 1800, dealsDue: 140 },
  { month: 'Jul 2026', projectedValue: 2200, dealsDue: 160 },
  { month: 'Sep 2026', projectedValue: 2800, dealsDue: 170 },
  { month: 'Nov 2026', projectedValue: 2400, dealsDue: 150 },
  { month: 'Jan 2027', projectedValue: 3800, dealsDue: 190 },
];

const categoryForecastData = [
  { category: 'Enterprise', value: 450, growth: 25 },
  { category: 'Mid-Market', value: 320, growth: 18 },
  { category: 'SMB', value: 210, growth: 12 },
  { category: 'Services', value: 150, growth: 30 },
  { category: 'Support', value: 90, growth: 10 },
];

const funnelData = [
  { value: 100, name: 'Lead', fill: '#0EA5E9' },
  { value: 80, name: 'Discovery', fill: '#312E81' },
  { value: 50, name: 'Proposal', fill: '#6366F1' },
  { value: 40, name: 'Negotiation', fill: '#F43F5E' },
  { value: 26, name: 'Closed', fill: '#10B981' },
];

const COLORS = {
  actual: 'hsl(142, 76%, 36%)',
  forecast: 'hsl(217, 91%, 50%)',
  target: 'hsl(38, 92%, 50%)',
  conservative: 'hsl(280, 65%, 60%)',
  optimistic: 'hsl(199, 89%, 48%)',
};

export default function ForecastReport() {
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [scenario, setScenario] = useState<string | undefined>(undefined);
  const [owner, setOwner] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<string | undefined>(undefined);
  const [dealSize, setDealSize] = useState<string | undefined>(undefined);
  const [dealStatus, setDealStatus] = useState<string | undefined>(undefined);

  const totalSales = "5.2M";
  const winRate = "16.92%";
  const closeRate = "14.47%";
  const avgDaysToClose = "60.70";
  const pipelineValue = "77.8M";
  const openDeals = "1.6K";
  const weightedValue = "35.6M";
  const avgOpenDealAge = "201.67";

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 space-y-4">
      <Header title="Forecast Report" />
      <div className="flex flex-col lg:flex-row gap-2">
        {/* Main Content Area */}
        <div className="flex-1 space-y-3">
          {/* Top Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-200 border border-slate-200 rounded-xl px-4 py-1 shadow-sm">
            {/* Left Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger
                  className="w-fit min-w-[170px] bg-slate-50 border-slate-200 text-slate-700
               h-7 py-0 font-medium
               focus:outline-none focus:ring-0 transition
               focus-visible:ring-0 focus-visible:outline-none font-semibold text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <SelectValue placeholder="Time Period" />
                  </div>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="last-quarter">Last Quarter</SelectItem>
                  <SelectItem value="next-quarter">Next Quarter</SelectItem>
                  <SelectItem value="this-half">This Half Year</SelectItem>
                  <SelectItem value="last-half">Last Half Year</SelectItem>
                  <SelectItem value="next-half">Next Half Year</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="next-year">Next Year</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom-range">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dealStatus} onValueChange={setDealStatus}>
                <SelectTrigger className="h-7 w-[120px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <Filter className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  <SelectValue placeholder="All Deals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deals</SelectItem>
                  <SelectItem value="won">Won Deals</SelectItem>
                  <SelectItem value="lost">Lost Deals</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-7 w-[130px] bg-slate-50 border-slate-200 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <SelectValue placeholder="Deal Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="h-7 w-[150px] bg-slate-50 border-slate-200 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <SelectValue placeholder="Forecast Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="best-case">Best Case</SelectItem>
                  <SelectItem value="commit">Commit</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                  <SelectItem value="omitted">Omitted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dealSize} onValueChange={setDealSize}>
                <SelectTrigger className="h-7 w-[130px] bg-slate-50 border-slate-200 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <SelectValue placeholder="Deal Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="small">&lt; RS 10K</SelectItem>
                  <SelectItem value="medium">RS 10K - RS 50K</SelectItem>
                  <SelectItem value="large">RS 50K - RS 100K</SelectItem>
                  <SelectItem value="enterprise">&gt; RS 100K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-7 px-3 border-slate-200 text-slate-700 hover:bg-slate-100 transition font-semibold text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2 text-slate-500" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="h-7 px-3 border-slate-200 text-slate-700 hover:bg-slate-100 transition font-semibold text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-2 text-slate-500" />
                Export
              </Button>
            </div>
          </div>
          {/* 2x4 KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Total sales</p>
                <p className="text-xl font-bold mt-0.5">{totalSales}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Win rate</p>
                <p className="text-xl font-bold mt-0.5">{winRate}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Close rate</p>
                <p className="text-xl font-bold mt-0.5">{closeRate}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Avg days to close</p>
                <p className="text-xl font-bold mt-0.5">{avgDaysToClose}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Pipeline value</p>
                <p className="text-xl font-bold mt-0.5">{pipelineValue}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Open deals</p>
                <p className="text-xl font-bold mt-0.5">{openDeals}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-600 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Weighted value</p>
                <p className="text-xl font-bold mt-0.5">{weightedValue}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600 text-white border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider text-nowrap">Avg open deal age</p>
                <p className="text-xl font-bold mt-0.5">{avgOpenDealAge}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <Card className="xl:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Won deals (last 12 months)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wonDealsTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v}K`} />
                      <Tooltip />
                      <Legend verticalAlign="top" align="right" />
                      <Line type="monotone" dataKey="closedValue" name="Closed value" stroke="#1e40af" strokeWidth={2} dot={{ r: 4, fill: '#1e40af' }} />
                      <Line type="monotone" dataKey="wonDeals" name="Won deals" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Deals projection (future 12 months)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dealsProjectionTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v}K`} />
                      <Tooltip />
                      <Legend verticalAlign="top" align="right" />
                      <Line type="monotone" dataKey="projectedValue" name="Projected value" stroke="#1e40af" strokeWidth={2} dot={{ r: 4, fill: '#1e40af' }} />
                      <Line type="monotone" dataKey="dealsDue" name="Deals due" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-1 shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Sales pipeline</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesPipelineData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesPipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Deal loss reasons</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={lossReasonsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {lossReasonsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Forecast by Category</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryForecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v}K`} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" name="Value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-1 shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        dataKey="value"
                        data={funnelData}
                        isAnimationActive
                      >
                        <LabelList position="right" fill="#64748b" content={(props: any) => props.name} />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


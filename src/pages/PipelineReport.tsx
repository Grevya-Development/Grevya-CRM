import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area,
  LineChart,
  Line,
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
  Filter,
  RefreshCw,
  Layers,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Globe,
  PieChartIcon,
  Zap,
  Star
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Sample pipeline data
const pipelineStages = [
  { stage: 'Lead', value: 2450000, deals: 85, avgDays: 5, conversion: 65 },
  { stage: 'Qualified', value: 1890000, deals: 52, avgDays: 12, conversion: 72 },
  { stage: 'Proposal', value: 1250000, deals: 38, avgDays: 18, conversion: 58 },
  { stage: 'Negotiation', value: 780000, deals: 22, avgDays: 25, conversion: 78 },
  { stage: 'Closed Won', value: 520000, deals: 15, avgDays: 0, conversion: 100 },
];

const funnelData = [
  { name: 'Lead', value: 2450000, fill: '#1e40af' },
  { name: 'Qualified', value: 1890000, fill: '#3b82f6' },
  { name: 'Proposal', value: 1250000, fill: '#0ea5e9' },
  { name: 'Negotiation', value: 780000, fill: '#8b5cf6' },
  { name: 'Closed Won', value: 520000, fill: '#10b981' },
];

const pipelineTrend = [
  { week: 'W1', value: 4200000, deals: 78 },
  { week: 'W2', value: 4450000, deals: 82 },
  { week: 'W3', value: 4180000, deals: 76 },
  { week: 'W4', value: 4680000, deals: 88 },
  { week: 'W5', value: 4520000, deals: 85 },
  { week: 'W6', value: 4890000, deals: 92 },
  { week: 'W7', value: 5120000, deals: 98 },
  { week: 'W8', value: 4980000, deals: 95 },
];

const dealsBySize = [
  { name: 'Enterprise (>$10L)', value: 12, amount: 1850000, color: '#1e40af' },
  { name: 'Mid-Market (2L-10L)', value: 35, amount: 1420000, color: '#3b82f6' },
  { name: 'SMB (1L-2L)', value: 58, amount: 980000, color: '#0ea5e9' },
  { name: 'Starter (<1L)', value: 95, amount: 520000, color: '#10b981' },
];

const dealsByOwner = [
  { owner: 'Sarah Johnson', value: 1250000, deals: 18, winRate: 68 },
  { owner: 'Michael Chen', value: 980000, deals: 15, winRate: 55 },
  { owner: 'Emily Davis', value: 1150000, deals: 22, winRate: 72 },
  { owner: 'James Wilson', value: 720000, deals: 12, winRate: 48 },
  { owner: 'Lisa Anderson', value: 890000, deals: 16, winRate: 62 },
];

const velocityData = [
  { stage: 'Lead → Qualified', avgDays: 8, benchmark: 7 },
  { stage: 'Qualified → Proposal', avgDays: 14, benchmark: 12 },
  { stage: 'Proposal → Negotiation', avgDays: 21, benchmark: 18 },
  { stage: 'Negotiation → Won', avgDays: 12, benchmark: 10 },
];

const atRiskDeals = [
  { id: 1, name: 'Enterprise Cloud Migration', value: 185000, stage: 'Negotiation', daysStalled: 15, reason: 'Budget review' },
  { id: 2, name: 'Data Analytics Platform', value: 92000, stage: 'Proposal', daysStalled: 22, reason: 'Competitor evaluation' },
  { id: 3, name: 'Security Suite Upgrade', value: 78000, stage: 'Qualified', daysStalled: 18, reason: 'Stakeholder change' },
  { id: 4, name: 'CRM Integration Project', value: 65000, stage: 'Negotiation', daysStalled: 12, reason: 'Legal review' },
];

const industryAnalysis = [
  { industry: 'Technology', value: 1850000, color: '#1e40af' },
  { industry: 'Finance', value: 1240000, color: '#3b82f6' },
  { industry: 'Healthcare', value: 980000, color: '#0ea5e9' },
  { industry: 'Retail', value: 450000, color: '#10b981' },
  { industry: 'Manufacturing', value: 250000, color: '#f59e0b' },
];

const winProbabilityData = [
  { range: '0-20%', value: 1250000, deals: 45 },
  { range: '21-40%', value: 890000, deals: 32 },
  { range: '41-60%', value: 1450000, deals: 28 },
  { range: '61-80%', value: 980000, deals: 22 },
  { range: '81-100%', value: 520000, deals: 15 },
];

const sourceAnalysis = [
  { source: 'Inbound', value: 1850000, deals: 42, winRate: 58, color: '#1e40af' },
  { source: 'Outbound', value: 1420000, deals: 35, winRate: 42, color: '#3b82f6' },
  { source: 'Partner', value: 980000, deals: 28, winRate: 65, color: '#0ea5e9' },
  { source: 'Referral', value: 720000, deals: 18, winRate: 72, color: '#10b981' },
  { source: 'Events', value: 450000, deals: 12, winRate: 48, color: '#f59e0b' },
];

const COLORS = ['#1e40af', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function PipelineReport() {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [view, setView] = useState<string | undefined>(undefined);
  const [dealSize, setDealSize] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();

  const stats = {
    totalPipeline: "₹4.77M",
    weightedPipeline: "₹2.89M",
    avgDealSize: "₹48.5K",
    pipelineVelocity: "45d",
    winRate: "58%",
    openDeals: "210",
    dealsAtRisk: "4",
    newPipeline: "₹1.2M"
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 space-y-4">
      <Header title="Pipeline Report" />
      <div className="flex-1 space-y-2">
        {/* Top Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-200 border border-slate-200 rounded-xl px-4 py-1 shadow-sm">
          {/* Left Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger
                  className="w-fit min-w-[170px] bg-slate-50 border-slate-200 text-slate-700
               h-7 py-0 font-medium
               focus:outline-none focus:ring-0
               focus-visible:ring-0 focus-visible:outline-none font-semibold text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
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
            </div>

            <div className="flex items-center gap-2 border-l border-slate-300 pl-3 ml-1">
              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="h-7 w-[120px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <Filter className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deals</SelectItem>
                  <SelectItem value="my-deals">My Deals</SelectItem>
                  <SelectItem value="team">Team Deals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-7 w-[130px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                <SelectValue placeholder="Sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Deal Value</SelectItem>
                <SelectItem value="days">Days in Stage</SelectItem>
                <SelectItem value="probability">Win Prob.</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dealSize} onValueChange={setDealSize}>
              <SelectTrigger className="h-7 w-[130px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                <SelectValue placeholder="Deal Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deal Size</SelectItem>
                <SelectItem value="small">&lt; RS 10K</SelectItem>
                <SelectItem value="medium">RS 10K - RS 50K</SelectItem>
                <SelectItem value="large">RS 50K - RS 100K</SelectItem>
                <SelectItem value="enterprise">&gt; RS 100K</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Total Pipeline</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.totalPipeline}</p>
                <Layers className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Weighted Value</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.weightedPipeline}</p>
                <Target className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Avg Deal Size</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.avgDealSize}</p>
                <IndianRupee className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Velocity</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.pipelineVelocity}</p>
                <Clock className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Win Rate</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.winRate}</p>
                <TrendingUp className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Open Deals</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.openDeals}</p>
                <Zap className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">Deals At Risk</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.dealsAtRisk}</p>
                <AlertTriangle className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600 text-white border-none shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium opacity-90 uppercase tracking-wider">New Pipeline</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xl font-bold">{stats.newPipeline}</p>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 h-10 shadow-sm rounded-xl w-fit">
            <TabsTrigger value="overview" className="px-4 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-medium text-xs">Overview</TabsTrigger>
            <TabsTrigger value="stages" className="px-4 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-medium text-xs">Stages</TabsTrigger>
            <TabsTrigger value="velocity" className="px-4 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-medium text-xs">Velocity</TabsTrigger>
            <TabsTrigger value="risks" className="px-4 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-medium text-xs">At Risk</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-2 shadow-sm border-slate-200">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold">Pipeline Funnel Visualization</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <FunnelChart>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`₹${(value / 1000000).toFixed(2)}M`, 'Value']}
                        />
                        <Funnel dataKey="value" data={funnelData} isAnimationActive>
                          <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" className="text-xs" />
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2 shadow-sm border-slate-200">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold">Pipeline Value Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pipelineTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000000}M`} />
                        <Tooltip />
                        <Legend verticalAlign="top" align="right" />
                        <Area type="monotone" dataKey="value" name="Pipeline Value" stroke="#1e40af" fill="#1e40af" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="deals" name="Deals Count" stroke="#10b981" fill="#10b981" fillOpacity={0.05} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1 shadow-sm border-slate-200">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold">Pipeline by Source</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceAnalysis}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="source"
                        >
                          {sourceAnalysis.map((entry, index) => (
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
                  <CardTitle className="text-base font-bold">Deal Size Mix</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dealsBySize}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="amount"
                          nameKey="name"
                        >
                          {dealsBySize.map((entry, index) => (
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
                  <CardTitle className="text-base font-bold">Win Probability Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={winProbabilityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip />
                        <Bar dataKey="value" name="Pipeline Value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1 shadow-sm border-slate-200">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold">Pipeline by Industry</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={industryAnalysis} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000000}M`} />
                        <YAxis dataKey="industry" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" name="Value" fill="#1e40af" radius={[0, 4, 4, 0]}>
                          {industryAnalysis.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stages" className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold">Value Distribution by Stage</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineStages}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip />
                      <Bar dataKey="value" name="Value" fill="#1e40af" radius={[4, 4, 0, 0]}>
                        {pipelineStages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Pipeline by Sales Rep</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dealsByOwner.map((owner) => (
                      <div key={owner.owner} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-700">{owner.owner}</span>
                          <span className="font-bold text-slate-900">₹{(owner.value / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={(owner.value / 1250000) * 100} className="h-2 flex-1" />
                          <span className="text-[10px] whitespace-nowrap text-slate-500 font-medium">{owner.winRate}% Win Rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Stage Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                          <th className="text-left p-2 font-semibold">Stage</th>
                          <th className="text-right p-2 font-semibold">Deals</th>
                          <th className="text-right p-2 font-semibold">Avg Days</th>
                          <th className="text-right p-2 font-semibold">Conv.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pipelineStages.map((stage) => (
                          <tr key={stage.stage}>
                            <td className="p-2 font-medium">{stage.stage}</td>
                            <td className="p-2 text-right">{stage.deals}</td>
                            <td className="p-2 text-right">{stage.avgDays}d</td>
                            <td className="p-2 text-right font-bold text-indigo-600">{stage.conversion}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2 shadow-sm border-slate-200">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-bold">Stage Velocity Benchmarks</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={velocityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgDays" name="Actual Days" fill="#1e40af" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="benchmark" name="Benchmark" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {velocityData.map((item) => {
                  const diff = item.avgDays - item.benchmark;
                  return (
                    <Card key={item.stage} className="shadow-sm border-slate-100">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.stage}</p>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-xl font-bold text-slate-900">{item.avgDays}d</p>
                          <Badge variant={diff <= 0 ? 'default' : 'destructive'} className="text-[9px]">
                            {diff > 0 ? '+' : ''}{diff}d vs Target
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500">Critical Risk</p>
                  <p className="text-xl font-bold text-red-600 mt-1">$277K</p>
                  <p className="text-[10px] text-slate-400">2 deals stalled {">"} 15 days</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500">Medium Risk</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">$143K</p>
                  <p className="text-[10px] text-slate-400">2 deals stalled 10-14 days</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500">On Track</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">$4.35M</p>
                  <p className="text-[10px] text-slate-400">76 deals on schedule</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Critical Deals Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500">
                        <th className="text-left p-4 font-semibold">Deal</th>
                        <th className="text-right p-4 font-semibold">Value</th>
                        <th className="text-center p-4 font-semibold">Stalled</th>
                        <th className="text-left p-4 font-semibold">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {atRiskDeals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="p-4 font-medium text-slate-900">{deal.name}</td>
                          <td className="p-4 text-right font-bold text-slate-900">₹{deal.value.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <Badge variant="destructive">{deal.daysStalled} days</Badge>
                          </td>
                          <td className="p-4 text-slate-500 text-xs italic">{deal.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Globe,
  Megaphone,
  Handshake,
  BarChart3,
  PieChartIcon,
  Zap,
  Star
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Sample leads data
const leadsTrend = [
  { month: 'Jan', newLeads: 145, qualified: 85, converted: 32 },
  { month: 'Feb', newLeads: 168, qualified: 98, converted: 41 },
  { month: 'Mar', newLeads: 152, qualified: 88, converted: 35 },
  { month: 'Apr', newLeads: 189, qualified: 115, converted: 48 },
  { month: 'May', newLeads: 205, qualified: 128, converted: 55 },
  { month: 'Jun', newLeads: 178, qualified: 105, converted: 42 },
  { month: 'Jul', newLeads: 225, qualified: 142, converted: 62 },
  { month: 'Aug', newLeads: 198, qualified: 118, converted: 51 },
];

const leadSources = [
  { source: 'Website', leads: 425, qualified: 255, converted: 98, cost: 12500, cpl: 29.41 },
  { source: 'LinkedIn', leads: 285, qualified: 178, converted: 72, cost: 18500, cpl: 64.91 },
  { source: 'Google Ads', leads: 352, qualified: 195, converted: 68, cost: 28000, cpl: 79.55 },
  { source: 'Referrals', leads: 128, qualified: 98, converted: 52, cost: 5200, cpl: 40.63 },
  { source: 'Events', leads: 95, qualified: 62, converted: 28, cost: 15000, cpl: 157.89 },
  { source: 'Cold Outreach', leads: 175, qualified: 68, converted: 18, cost: 8500, cpl: 48.57 },
];

const leadsByIndustry = [
  { industry: 'Technology', value: 320, percentage: 22 },
  { industry: 'Healthcare', value: 245, percentage: 17 },
  { industry: 'Finance', value: 210, percentage: 14 },
  { industry: 'Manufacturing', value: 185, percentage: 13 },
  { industry: 'Retail', value: 165, percentage: 11 },
  { industry: 'Education', value: 145, percentage: 10 },
  { industry: 'Other', value: 190, percentage: 13 },
];

const leadScoring = [
  { score: '90-100', leads: 45, label: 'Hot', color: 'hsl(0, 72%, 51%)' },
  { score: '70-89', leads: 128, label: 'Warm', color: 'hsl(38, 92%, 50%)' },
  { score: '50-69', leads: 285, label: 'Neutral', color: 'hsl(217, 91%, 50%)' },
  { score: '30-49', leads: 412, label: 'Cool', color: 'hsl(199, 89%, 48%)' },
  { score: '0-29', leads: 590, label: 'Cold', color: 'hsl(210, 14%, 66%)' },
];

const conversionFunnel = [
  { stage: 'Visits', value: 15000 },
  { stage: 'Leads', value: 1460 },
  { stage: 'MQL', value: 756 },
  { stage: 'SQL', value: 336 },
  { stage: 'Opportunity', value: 168 },
  { stage: 'Customer', value: 84 },
];

const qualityMetrics = [
  { metric: 'Response Time', value: 85, benchmark: 75 },
  { metric: 'Contact Rate', value: 72, benchmark: 70 },
  { metric: 'Qualification Rate', value: 52, benchmark: 55 },
  { metric: 'Meeting Booked', value: 38, benchmark: 40 },
  { metric: 'SQL Conversion', value: 45, benchmark: 42 },
  { metric: 'Win Rate', value: 25, benchmark: 28 },
];

const campaignPerformance = [
  { campaign: 'Q1 Product Launch', leads: 285, mqls: 168, cost: 15000, cpl: 52.63, roi: 320 },
  { campaign: 'LinkedIn ABM', leads: 142, mqls: 98, cost: 12000, cpl: 84.51, roi: 185 },
  { campaign: 'Content Syndication', leads: 225, mqls: 115, cost: 8500, cpl: 37.78, roi: 245 },
  { campaign: 'Webinar Series', leads: 178, mqls: 125, cost: 6000, cpl: 33.71, roi: 380 },
  { campaign: 'Trade Show', leads: 95, mqls: 52, cost: 25000, cpl: 263.16, roi: 95 },
];

const leadAgeData = [
  { age: '0-7 days', leads: 245, value: 1250000 },
  { age: '8-14 days', leads: 168, value: 850000 },
  { age: '15-30 days', leads: 285, value: 1420000 },
  { age: '31-60 days', leads: 312, value: 1680000 },
  { age: '60+ days', leads: 450, value: 2100000 },
];

const topLeads = [
  { name: 'Acme Corporation', score: 95, source: 'Website', value: 125000, status: 'Hot', lastActivity: '2 hours ago' },
  { name: 'TechStart Inc', score: 92, source: 'LinkedIn', value: 85000, status: 'Hot', lastActivity: '4 hours ago' },
  { name: 'Global Dynamics', score: 88, source: 'Referral', value: 175000, status: 'Warm', lastActivity: '1 day ago' },
  { name: 'Innovate Labs', score: 85, source: 'Google Ads', value: 65000, status: 'Warm', lastActivity: '1 day ago' },
  { name: 'Enterprise Solutions', score: 82, source: 'Events', value: 220000, status: 'Warm', lastActivity: '2 days ago' },
];

const COLORS = [
  'hsl(217, 91%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(199, 89%, 48%)',
  'hsl(0, 72%, 51%)',
];

export default function LeadsReport() {
  const [period, setPeriod] = useState('this-quarter');
  const [source, setSource] = useState('all');
  const isMobile = useIsMobile();

  const totalLeads = 1460;
  const qualifiedLeads = 756;
  const conversionRate = 5.8;
  const avgLeadScore = 58;

  return (
    <div className="min-h-screen">
      <Header title="Leads Report" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="referral">Referrals</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size={isMobile ? "sm" : "default"} className="gap-2">
            <Download className="h-4 w-4" />
            {!isMobile && "Export"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="animate-fade-in">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-muted-foreground">Total Leads</p>
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl md:text-3xl font-bold text-foreground mt-2">{totalLeads.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-xs md:text-sm text-success">+18.2% vs last Q</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-muted-foreground">Qualified (MQL)</p>
                <Target className="h-4 w-4 text-success" />
              </div>
              <p className="text-xl md:text-3xl font-bold text-foreground mt-2">{qualifiedLeads}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-xs md:text-sm text-success">51.8% qualification rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-muted-foreground">Conversion Rate</p>
                <Zap className="h-4 w-4 text-warning" />
              </div>
              <p className="text-xl md:text-3xl font-bold text-foreground mt-2">{conversionRate}%</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-xs md:text-sm text-success">+0.8% vs last Q</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-muted-foreground">Avg Lead Score</p>
                <Star className="h-4 w-4 text-accent-foreground" />
              </div>
              <p className="text-xl md:text-3xl font-bold text-foreground mt-2">{avgLeadScore}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-xs md:text-sm text-success">+5 points vs last Q</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2 text-xs md:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2 text-xs md:text-sm">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Sources</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-2 text-xs md:text-sm">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2 text-xs md:text-sm">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Leads Trend */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Lead Generation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leadsTrend}>
                      <defs>
                        <linearGradient id="colorNewLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                      <Legend />
                      <Area type="monotone" dataKey="newLeads" name="New Leads" stroke="hsl(217, 91%, 50%)" fillOpacity={1} fill="url(#colorNewLeads)" />
                      <Area type="monotone" dataKey="qualified" name="Qualified" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#colorQualified)" />
                      <Line type="monotone" dataKey="converted" name="Converted" stroke="hsl(38, 92%, 50%)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Lead Score Distribution */}
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Lead Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadScoring}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="leads"
                          nameKey="label"
                        >
                          {leadScoring.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                </CardContent>
              </Card>

              {/* Leads by Industry */}
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Leads by Industry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadsByIndustry} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" className="text-xs fill-muted-foreground" />
                        <YAxis
                          type="category"
                          dataKey="industry"
                          className="text-xs fill-muted-foreground"
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]}>
                          {leadsByIndustry.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Leads Table */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Top Leads by Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium">Lead</th>
                        <th className="text-right p-3 font-medium">Score</th>
                        <th className="text-left p-3 font-medium">Source</th>
                        <th className="text-right p-3 font-medium">Est. Value</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLeads.map((lead, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3 font-medium">{lead.name}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={lead.score} className="h-2 w-12" />
                              <span>{lead.score}</span>
                            </div>
                          </td>
                          <td className="p-3">{lead.source}</td>
                          <td className="p-3 text-right">${lead.value.toLocaleString()}</td>
                          <td className="p-3">
                            <Badge variant={lead.status === 'Hot' ? 'destructive' : 'default'}>
                              {lead.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{lead.lastActivity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            {/* Source Performance Chart */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Leads by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadSources}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="source" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="leads" name="Total Leads" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="qualified" name="Qualified" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="converted" name="Converted" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Source Details Table */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Source Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium">Source</th>
                        <th className="text-right p-3 font-medium">Leads</th>
                        <th className="text-right p-3 font-medium">Qualified</th>
                        <th className="text-right p-3 font-medium">Converted</th>
                        <th className="text-right p-3 font-medium">Cost</th>
                        <th className="text-right p-3 font-medium">CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadSources.map((source, index) => (
                        <tr key={source.source} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                              <span className="font-medium">{source.source}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">{source.leads}</td>
                          <td className="p-3 text-right">{source.qualified}</td>
                          <td className="p-3 text-right">{source.converted}</td>
                          <td className="p-3 text-right">${source.cost.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Badge variant={source.cpl < 50 ? 'default' : source.cpl < 100 ? 'secondary' : 'destructive'}>
                              ${source.cpl.toFixed(2)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Lead Age Analysis */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Lead Age Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadAgeData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="age" className="text-xs fill-muted-foreground" />
                      <YAxis
                        yAxisId="left"
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-xs fill-muted-foreground"
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'value' ? `$${value.toLocaleString()}` : value,
                          name === 'value' ? 'Pipeline Value' : 'Leads'
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="leads" name="Leads" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="value" name="Pipeline Value" stroke="hsl(38, 92%, 50%)" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            {/* Quality Radar Chart */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Lead Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={qualityMetrics}>
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="metric" className="text-xs fill-muted-foreground" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs fill-muted-foreground" />
                      <Radar name="Current" dataKey="value" stroke="hsl(217, 91%, 50%)" fill="hsl(217, 91%, 50%)" fillOpacity={0.3} />
                      <Radar name="Benchmark" dataKey="benchmark" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quality Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {qualityMetrics.map((metric) => {
                const diff = metric.value - metric.benchmark;
                const isGood = diff >= 0;
                return (
                  <Card key={metric.metric} className="animate-fade-in">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{metric.metric}</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-2xl font-bold">{metric.value}%</p>
                        <Badge variant={isGood ? 'default' : 'destructive'} className="text-xs">
                          {isGood ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {diff > 0 ? '+' : ''}{diff}%
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>Benchmark: {metric.benchmark}%</span>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Conversion Funnel */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Lead Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel.map((stage, index) => {
                    const prevValue = index > 0 ? conversionFunnel[index - 1].value : stage.value;
                    const convRate = index > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '100';
                    const widthPercent = (stage.value / conversionFunnel[0].value) * 100;

                    return (
                      <div key={stage.stage} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{stage.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{stage.value.toLocaleString()}</span>
                            {index > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {convRate}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="h-8 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md transition-all duration-500"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Campaign ROI Chart */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis
                        type="category"
                        dataKey="campaign"
                        className="text-xs fill-muted-foreground"
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="leads" name="Total Leads" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="mqls" name="MQLs" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Details Table */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Campaign ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium">Campaign</th>
                        <th className="text-right p-3 font-medium">Leads</th>
                        <th className="text-right p-3 font-medium">MQLs</th>
                        <th className="text-right p-3 font-medium">Cost</th>
                        <th className="text-right p-3 font-medium">CPL</th>
                        <th className="text-right p-3 font-medium">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignPerformance.map((campaign, index) => (
                        <tr key={campaign.campaign} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                              <span className="font-medium">{campaign.campaign}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">{campaign.leads}</td>
                          <td className="p-3 text-right">{campaign.mqls}</td>
                          <td className="p-3 text-right">${campaign.cost.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Badge variant={campaign.cpl < 50 ? 'default' : campaign.cpl < 100 ? 'secondary' : 'destructive'}>
                              ${campaign.cpl.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant={campaign.roi >= 200 ? 'default' : campaign.roi >= 100 ? 'secondary' : 'destructive'}>
                              {campaign.roi}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="animate-fade-in border-l-4 border-l-success">
                <CardContent className="p-4 md:p-6">
                  <h4 className="font-semibold text-sm">Best Performing</h4>
                  <p className="text-lg font-bold mt-2">Webinar Series</p>
                  <p className="text-sm text-muted-foreground mt-1">380% ROI • $33.71 CPL</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in border-l-4 border-l-warning">
                <CardContent className="p-4 md:p-6">
                  <h4 className="font-semibold text-sm">Most Leads</h4>
                  <p className="text-lg font-bold mt-2">Google Ads</p>
                  <p className="text-sm text-muted-foreground mt-1">352 leads • 68 converted</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in border-l-4 border-l-primary">
                <CardContent className="p-4 md:p-6">
                  <h4 className="font-semibold text-sm">Best Qualification Rate</h4>
                  <p className="text-lg font-bold mt-2">Referrals</p>
                  <p className="text-sm text-muted-foreground mt-1">76.6% qualified • 40.6% won</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ChevronLeft, 
    Download, 
    Mail, 
    Users, 
    FileText, 
    AlertCircle,
    TrendingUp,
    TrendingDown,
    MousePointer2,
    MailCheck,
    MessageSquareX,
    BarChart3
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { campaignService } from '@/services/campaignService';
import { EmailCampaign, AudienceSegment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#6366f1', '#e2e8f0'];

export default function CampaignDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<(EmailCampaign & { segment: AudienceSegment }) | null>(null);
    const [stats, setStats] = useState({
        delivered: 0,
        opens: 0,
        clicks: 0,
        bounces: 0,
        unsubscribes: 0,
        recipients: 0,
        suppressed: 0
    });
    const [chartData, setChartData] = useState<{
        engagement: any[],
        openRate: any[],
        performance: any[]
    }>({
        engagement: [],
        openRate: [],
        performance: []
    });

    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) return;
            setLoading(true);
            
            // 1. Fetch Campaign and Recipients
            const [campaignData, recipients] = await Promise.all([
                campaignService.getCampaignById(id),
                campaignService.getCampaignRecipients(id)
            ]);

            if (!campaignData) return;
            setCampaign(campaignData);

            // 2. Calculate Stats
            const total = recipients.length;
            const delivered = recipients.filter(r => r.sent_at).length;
            const opens = recipients.filter(r => r.opened_at).length;
            const clicks = recipients.filter(r => r.clicked_at).length;
            const bounces = recipients.filter(r => r.status === 'bounced').length;
            const unsubscribes = recipients.filter(r => r.unsubscribed_at).length;

            setStats({
                delivered,
                opens,
                clicks,
                bounces,
                unsubscribes,
                recipients: total,
                suppressed: 0 // Placeholder for now
            });

            // 3. Prepare Chart Data
            // Open Rate Pie
            setChartData(prev => ({
                ...prev,
                openRate: [
                    { name: 'Opened', value: opens },
                    { name: 'Not Opened', value: Math.max(0, delivered - opens) },
                ],
                performance: [
                    { name: 'Delivered', value: delivered, fill: '#60a5fa' },
                    { name: 'Opened', value: opens, fill: '#34d399' },
                    { name: 'Clicked', value: clicks, fill: '#fbbf24' },
                    { name: 'Bounced', value: bounces, fill: '#f87171' },
                    { name: 'Unsubscribed', value: unsubscribes, fill: '#94a3b8' },
                ]
            }));

            // Engagement Over Time (Hourly)
            const hourlyMap: any = {};
            recipients.forEach(r => {
                if (r.sent_at) {
                    const hour = new Date(r.sent_at).getHours();
                    const hourStr = `${hour % 12 || 12} ${hour >= 12 ? 'pm' : 'am'}`;
                    if (!hourlyMap[hourStr]) hourlyMap[hourStr] = { name: hourStr, delivered: 0, opens: 0, clicks: 0 };
                    hourlyMap[hourStr].delivered++;
                }
                if (r.opened_at) {
                    const hour = new Date(r.opened_at).getHours();
                    const hourStr = `${hour % 12 || 12} ${hour >= 12 ? 'pm' : 'am'}`;
                    if (!hourlyMap[hourStr]) hourlyMap[hourStr] = { name: hourStr, delivered: 0, opens: 0, clicks: 0 };
                    hourlyMap[hourStr].opens++;
                }
                if (r.clicked_at) {
                    const hour = new Date(r.clicked_at).getHours();
                    const hourStr = `${hour % 12 || 12} ${hour >= 12 ? 'pm' : 'am'}`;
                    if (!hourlyMap[hourStr]) hourlyMap[hourStr] = { name: hourStr, delivered: 0, opens: 0, clicks: 0 };
                    hourlyMap[hourStr].clicks++;
                }
            });

            const sortedEngagement = Object.values(hourlyMap).sort((a: any, b: any) => {
                const hourA = parseInt(a.name);
                const isPMA = a.name.includes('pm');
                const hourB = parseInt(b.name);
                const isPMB = b.name.includes('pm');
                return (hourA + (isPMA ? 12 : 0)) - (hourB + (isPMB ? 12 : 0));
            });

            setChartData(prev => ({ ...prev, engagement: sortedEngagement }));

            setLoading(false);
        };
        fetchAllData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/30">
                <Header title="Campaign Details" />
                <div className="p-8 space-y-8 max-w-7xl mx-auto">
                    <Skeleton className="h-12 w-1/3" />
                    <div className="grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign) return null;

    const initials = campaign.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50/30 pb-12">
            <Header title="Campaign Details" />
            
            <div className="p-8 space-y-8">
                {/* Top Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg shadow-sm">
                                {initials}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 uppercase text-[10px] font-bold px-2.5">Sent</Badge>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    Sent on {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(campaign.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 px-6 h-11">
                        <Download className="w-4 h-4 mr-2" /> Export As Report
                    </Button>
                </div>

                {/* Audience Stats Bar */}
                <div className="grid grid-cols-4 gap-8 py-4 border-y border-slate-100">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Audience</p>
                        <p className="font-bold text-slate-700">{campaign.segment?.name || 'All Active Customers'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Template</p>
                        <p className="font-bold text-slate-700">Product Launch v2</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Recipients</p>
                        <p className="font-bold text-slate-700">{stats.recipients.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Suppressed</p>
                        <p className="font-bold text-slate-700">{stats.suppressed.toLocaleString()}</p>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-5 gap-6">
                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Delivered</p>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                    <MailCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.delivered.toLocaleString()}</h3>
                            <div className="flex items-center gap-1.5 mt-2 text-emerald-500 font-bold text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>+1.2% vs avg</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Rate</p>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.delivered > 0 ? ((stats.opens / stats.delivered) * 100).toFixed(1) : 0}%
                            </h3>
                            <div className="flex items-center gap-1.5 mt-2 text-emerald-500 font-bold text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>+0.5% vs avg</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Click-to-Open</p>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                    <MousePointer2 className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.opens > 0 ? ((stats.clicks / stats.opens) * 100).toFixed(1) : 0}%
                            </h3>
                            <div className="flex items-center gap-1.5 mt-2 text-rose-500 font-bold text-xs">
                                <TrendingDown className="w-3 h-3" />
                                <span>-0.2% vs avg</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bounce Rate</p>
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.recipients > 0 ? ((stats.bounces / stats.recipients) * 100).toFixed(1) : 0}%
                            </h3>
                            <div className="flex items-center gap-1.5 mt-2 text-emerald-500 font-bold text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>+0.1% vs avg</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unsubscribes</p>
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                                    <MessageSquareX className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats.unsubscribes.toLocaleString()}</h3>
                            <div className="flex items-center gap-1.5 mt-2 text-emerald-500 font-bold text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>+0.1% vs avg</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Charts Section */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Engagement Timeline */}
                    <Card className="lg:col-span-2 border-slate-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between py-6">
                            <CardTitle className="text-lg font-bold">Engagement Over Time</CardTitle>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200">
                                Last 24 Hours
                            </Button>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.engagement}>
                                    <defs>
                                        <linearGradient id="colorDel" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1e40af" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="delivered" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorDel)" />
                                    <Area type="monotone" dataKey="opens" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorOpen)" />
                                    <Area type="monotone" dataKey="clicks" stroke="#1062f2" strokeWidth={2} fillOpacity={1} fill="url(#colorClick)" />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle" 
                                        formatter={(val) => <span className="text-xs font-bold text-slate-500 ml-1">{val.charAt(0).toUpperCase() + val.slice(1)}</span>}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Open Rate Pie Chart */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="py-6">
                            <CardTitle className="text-lg font-bold">Open Rate Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px] flex flex-col items-center">
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={chartData.openRate}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.openRate.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-bold text-slate-500">Opened: {stats.opens}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                                    <span className="text-xs font-bold text-slate-500">Not Opened: {Math.max(0, stats.delivered - stats.opens)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Breakdown Bar Chart */}
                <Card className="border-slate-100 shadow-sm max-w-lg">
                    <CardHeader className="py-6">
                        <CardTitle className="text-lg font-bold">Campaign Performance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.performance} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-50">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-lg font-black text-slate-900">{payload[0].value.toLocaleString()}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    radius={[6, 6, 0, 0]} 
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

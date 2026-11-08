import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Search,
    MoreVertical,
    Eye,
    BarChart3,
    FileEdit
} from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { EmailCampaign } from '@/types';
import { format, isToday, isWithinInterval, subDays, startOfDay, endOfDay } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function Campaigns() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        const data = await campaignService.getCampaigns();
        setCampaigns(data);
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium px-3 py-1">Draft</Badge>;
            case 'scheduled':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-medium px-3 py-1">Scheduled</Badge>;
            case 'sending':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none font-medium px-3 py-1">Sending</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-medium px-3 py-1">Send</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-red-50 text-red-600 border-none font-medium px-3 py-1">Failed</Badge>;
            default:
                return <Badge variant="secondary" className="font-medium px-3 py-1">{status}</Badge>;
        }
    };

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        
        let matchesTime = true;
        const createdAt = new Date(c.created_at);
        const now = new Date();
        
        if (timeFilter === 'today') {
            matchesTime = isToday(createdAt);
        } else if (timeFilter === '7days') {
            matchesTime = isWithinInterval(createdAt, { 
                start: startOfDay(subDays(now, 7)), 
                end: endOfDay(now) 
            });
        } else if (timeFilter === '30days') {
            matchesTime = isWithinInterval(createdAt, { 
                start: startOfDay(subDays(now, 30)), 
                end: endOfDay(now) 
            });
        }
        
        return matchesSearch && matchesStatus && matchesTime;
    });

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Header title="All Campaigns" />
            <div className="p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <div className="relative w-full sm:w-80">
                            <Input
                                placeholder="Search campaigns"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 pr-10 rounded-lg border-slate-200 focus-visible:ring-blue-500 bg-white h-11"
                            />
                            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">Status</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32 bg-white border-slate-200 h-11">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">Time</span>
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="w-32 bg-white border-slate-200 h-11">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="7days">Last 7 Days</SelectItem>
                                    <SelectItem value="30days">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <Button
                        onClick={() => navigate('/campaigns/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-11 rounded-lg font-bold gap-2 whitespace-nowrap"
                    >
                        New Campaign
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200 h-12">
                                <TableHead className="font-bold text-slate-700 pl-6">Campaigns</TableHead>
                                <TableHead className="font-bold text-slate-700">Audiences</TableHead>
                                <TableHead className="font-bold text-slate-700">Recipients</TableHead>
                                <TableHead className="font-bold text-slate-700">Delivered</TableHead>
                                <TableHead className="font-bold text-slate-700">Open Rate</TableHead>
                                <TableHead className="font-bold text-slate-700">Click Rate</TableHead>
                                <TableHead className="font-bold text-slate-700">Sent / Scheduled</TableHead>
                                <TableHead className="font-bold text-slate-700">Status</TableHead>
                                <TableHead className="font-bold text-slate-700 text-center pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCampaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center text-slate-500">
                                        No campaigns found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCampaigns.map((campaign) => (
                                    <TableRow key={campaign.id} className="hover:bg-slate-50/50 border-b-slate-100">
                                        <TableCell className="font-medium text-slate-900 py-4 pl-6">
                                            <div className="flex flex-col">
                                                <span>{campaign.name}</span>
                                                <span className="text-xs text-slate-400 font-normal line-clamp-1">
                                                    {campaign.description || 'No description'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {campaign.segment?.name || (campaign.segment_id === 'all_contacts' ? 'All Contacts' : 'Uploaded Contacts')}
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">
                                            {(campaign.segment?.recipient_count ?? (campaign as any).manual_recipient_count)?.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {campaign.delivered_rate !== undefined ? `${campaign.delivered_rate}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {campaign.open_rate !== undefined ? `${campaign.open_rate}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {campaign.click_rate !== undefined ? `${campaign.click_rate}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            <div className="flex flex-col">
                                                <span>{campaign.scheduled_at ? format(new Date(campaign.scheduled_at), 'MMM d, yyyy') : format(new Date(campaign.created_at), 'MMM d, yyyy')}</span>
                                                {campaign.scheduled_at && <span className="text-[10px] text-slate-400 font-medium uppercase">{format(new Date(campaign.scheduled_at), 'hh:mm a')}</span>}
                                                {campaign.status === 'draft' && <span className="text-[10px] text-slate-400 font-medium uppercase">Not Scheduled</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(campaign.status)}
                                        </TableCell>
                                        <TableCell className="pr-6">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigate(`/campaigns/edit/${campaign.id}`)}>
                                                            <FileEdit className="h-4 w-4 mr-2" />
                                                            Edit draft
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                                                            <BarChart3 className="h-4 w-4 mr-2" />
                                                            Stats
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Button,
    Row,
    Col,
    Card,
    Typography,
    Tag,
    Skeleton,
    message,
} from 'antd';
import { TabsContent } from '@/components/ui/tabs';
import { StandardTabs, TabItem } from '@/components/layout/StandardTabs';
import {
    ChevronLeft,
    ChevronRight,
    User,
    Building,
    FileText,
    ExternalLink,
    Briefcase,
    Clock,
    Phone,
    Mail,
    Calendar,
    Edit3,
    CheckCircle2,
    SearchCheck,
    BarChart,
    Lightbulb,
    Users as UsersIcon,
    FileSpreadsheet,
    Handshake,
    Trophy,
    XCircle,
    Layout,
    History,
    Users2,
    Paperclip
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { supabase } from '../supabase/supabaseClient';
import { Lead } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { Worklog } from '@/components/Leads/Worklog';
import { EmailComposer } from '@/components/communication/EmailComposer';
import dayjs from 'dayjs';
import { LeadDetailsSkeleton } from '@/components/skeletons/LeadDetailsSkeleton';
import PipelineStepper from '@/components/Leads/PipelineStepper';
import { LEAD_STAGES_CONFIG } from '@/lib/lead-constants';
import { AddMeetingModal } from '@/components/meetings/AddMeetingModal';
import { MeetingTabContent } from '@/components/meetings/MeetingTabContent';
import { StageHistoryTabContent } from '@/components/stage-history/StageHistoryTabContent';
import { TaskActivityTabContent } from '@/components/task-activity/TaskActivityTabContent';
import { CustomerAttachmentsTab } from '@/components/contacts/CustomerAttachmentsTab';
import { MeetingsTab } from '@/components/meetings/MeetingsTab';
import TaskListView from '@/components/contacts/TaskListView';
import log from '@/utils/logger';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';


const { Title, Text } = Typography;

const LeadDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [lead, setLead] = useState<Lead | null>(null);
    const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [leadCount, setLeadCount] = useState(0);
    const [meetingCount, setMeetingCount] = useState(0);
    const [taskCount, setTaskCount] = useState(0);

    // Navigation State
    const [leadIds, setLeadIds] = useState<string[]>(location.state?.leadIds || []);

    const currentIndex = useMemo(() => {
        if (!id || leadIds.length === 0) return -1;
        return leadIds.indexOf(id);
    }, [id, leadIds]);

    const hasNext = currentIndex !== -1 && currentIndex < leadIds.length - 1;
    const hasPrev = currentIndex > 0;

    const navigateToLead = (direction: 'next' | 'prev') => {
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < leadIds.length) {
            navigate(`/leads/${leadIds[nextIndex]}`, { state: { leadIds } });
        }
    };

    useEffect(() => {
        if (id) {
            fetchLeadDetails();
        }
    }, [id]);

    // Fallback: Fetch lead IDs if none provided in state
    useEffect(() => {
        const fetchAllLeadIds = async () => {
            if (leadIds.length > 0) return;

            try {
                const { data, error } = await supabase
                    .from('crm_leads')
                    .select('id')
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) {
                    setLeadIds(data.map(l => l.id));
                }
            } catch (err) {
                console.error('Error fetching fallback lead IDs:', err);
            }
        };

        fetchAllLeadIds();
    }, [leadIds.length]);

    const fetchLeadDetails = async () => {
        try {
            setLoading(true);
            const { data: leadData, error: leadError } = await supabase
                .from('crm_leads')
                .select('*, customers:crm_customers(*)')
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (leadError) throw leadError;
            setLead(leadData);
        } catch (err: any) {
            console.error('Error fetching lead:', err);
            message.error(err.message || 'Failed to fetch lead details');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeadCount = async (id: string) => {
        log.debug('fetchLeadCount called');
        const { data, error } = await supabase.storage
            .from("lead-attachments")
            .list(id, {
                limit: 100,
                offset: 0,
            });

        if (!error && data) {
            log.info('fetchLeadCount successful');
            setLeadCount(data.length);
        } else {
            log.error('fetchLeadCount error');
        }
    };

    useEffect(() => {
        log.debug('useEffect [id] triggered for fetchLeadCount');
        if (id) {
            fetchLeadCount(id);
        }
    }, [id]);

    const fetchLeadMeetingCount = async (leadId: string) => {
        log.debug('fetchLeadMeetingCount called');

        const { count, error } = await supabase
            .from("crm_meetings")
            .select("*", { count: "exact", head: true })
            .eq("entity_id", leadId)
            .eq("entity_type", "lead");

        if (!error) {
            log.info('fetchLeadMeetingCount successful');
            setMeetingCount(count || 0);
        } else {
            log.error('fetchLeadMeetingCount error');
        }
    };

    useEffect(() => {
        if (id) {
            fetchLeadMeetingCount(id);
        }
    }, [id]);

    const fetchLeadTaskCount = async (leadId: string) => {
        log.debug('fetchLeadTaskCount called');

        const { count, error } = await supabase
            .from("crm_tasks")
            .select("*", { count: "exact", head: true })
            .eq("entity_id", leadId)
            .eq("entity_type", "lead");

        if (!error) {
            log.info('fetchLeadTaskCount successful');
            setTaskCount(count || 0);
        } else {
            log.error('fetchLeadTaskCount error');
        }
    };

    useEffect(() => {
        if (id) {
            fetchLeadTaskCount(id);
        }
    }, [id]);

    const addLog = async (action: string, details: string) => {
        if (!id) return;
        await supabase.from('lead_logs').insert({
            lead_id: id,
            action,
            details,
            performed_by: 'Mitchell Admin'
        });

    };



    if (loading) {
        return <LeadDetailsSkeleton />;
    }

    if (!lead) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center">
                <Title level={4}>Lead not found</Title>
                <Button onClick={() => navigate('/leads')}>Go Back</Button>
            </div>
        );
    }

    const currentStep = LEAD_STAGES_CONFIG.findIndex(s => s.name === lead.lead_stage);
    const initials = lead.lead_name ? lead.lead_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'LD';

    // Derive a soft background color for initials circle
    const getInitialsBg = (char: string) => {
        const colors: Record<string, string> = {
            'A': 'bg-red-100 text-red-600',
            'B': 'bg-blue-100 text-blue-600',
            'C': 'bg-green-100 text-green-600',
            'D': 'bg-yellow-100 text-yellow-600',
            'E': 'bg-purple-100 text-purple-600',
            'F': 'bg-pink-100 text-pink-600',
            'I': 'bg-[#FFEBEE] text-[#F06292]', // Standardized pink initials
        };
        return colors[char] || 'bg-slate-100 text-slate-600';
    };
    const initialsClass = getInitialsBg(initials[0]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-10">
            <Header
                title={`Lead Details${lead.lead_number ? ` - #${lead.lead_number}` : ''}`}
                breadcrumbAction={
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <div className="flex gap-2 items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-9 w-9 p-0 border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => navigateToLead('prev')}
                                            disabled={!hasPrev}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>prev lead</TooltipContent>
                                </Tooltip>

                                {leadIds.length > 0 && (
                                    <span className="text-xs font-bold text-slate-500 px-1 min-w-[45px] text-center tabular-nums">
                                        {currentIndex + 1} / {leadIds.length}
                                    </span>
                                )}

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-9 w-9 p-0 border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => navigateToLead('next')}
                                            disabled={!hasNext}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>next lead</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                }
            />

            <div className="p-6 max-w-[1600px] mx-auto">
                {/* Profile Header Block */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${initialsClass}`}>
                            {initials}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold text-[#0f172a] m-0">{lead.subject || lead.lead_name || 'Individual Lead'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-10 w-10 p-0 border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition-colors"
                                            onClick={() => { }}
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Call</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-10 w-10 p-0 border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition-colors"
                                            onClick={() => setIsEmailComposerOpen(true)}
                                        >
                                            <Mail className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send Email</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-10 w-10 p-0 border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition-colors"
                                            onClick={() => setIsMeetingModalOpen(true)}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Schedule Meeting</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-10 w-10 p-0 border border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition-colors"
                                            onClick={() => navigate(`/Leads/edit/${id}`)}
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Lead</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Summary Fields Grid */}
                <div className="grid grid-cols-4 gap-8 mb-8">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#64748b] font-medium">Lead Name</span>
                        <span className="text-base text-[#0f172a] font-medium">{lead.lead_name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#64748b] font-medium">Company Name</span>
                        <span className="text-base text-[#0f172a] font-medium">{lead.customers?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#64748b] font-medium">Email</span>
                        <span className="text-base text-[#0f172a] font-medium">{lead.email || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#64748b] font-medium">Phone Number</span>
                        <span className="text-base text-[#0f172a] font-medium">{lead.phone_number || 'N/A'}</span>
                    </div>
                </div>

                {/* Pipeline Stepper */}
                <div className="mb-10">
                    <PipelineStepper
                        currentStep={currentStep !== -1 ? currentStep : 0}
                        stages={LEAD_STAGES_CONFIG}
                    />
                </div>

                <EmailComposer
                    open={isEmailComposerOpen}
                    onOpenChange={setIsEmailComposerOpen}
                    contact={lead}
                    module="leads"
                />

                <AddMeetingModal
                    open={isMeetingModalOpen}
                    onOpenChange={setIsMeetingModalOpen}
                    leadName={lead.lead_name || lead.subject || ''}
                />

                <StandardTabs
                    tabs={[
                        { id: 'info', label: 'Leads Information' },
                        {
                            id: 'task',
                            label: (
                                <span className="flex items-center gap-2">
                                    Task & Activity
                                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                        {taskCount}
                                    </span>
                                </span>
                            )
                        },
                        { id: 'history', label: 'Stage History' },
                        {
                            id: 'meeting',
                            label: (
                                <span className="flex items-center gap-2">
                                    Meetings
                                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                        {meetingCount}
                                    </span>
                                </span>
                            )
                        },
                        {
                            id: 'attachment',
                            label: (
                                <span className="flex items-center gap-2">
                                    Attachments
                                    <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                                        {leadCount}
                                    </span>
                                </span>
                            )
                        }
                    ]}
                    defaultValue="info"
                    className="w-full"
                    tabsListClassName="w-full"
                >
                    <TabsContent value="info" className="mt-0">
                        <div className="flex items-center gap-2 mb-8">
                            <FileText className="text-[#2563eb]" size={20} />
                            <h3 className="text-lg font-semibold text-[#0f172a] m-0">General Information</h3>
                        </div>

                        <div className="grid grid-cols-4 gap-y-8 gap-x-12">
                            {/* Address Row */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Address</span>
                                <span className="text-sm text-[#0f172a] font-medium leading-relaxed">{lead.address || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">City</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.city || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">State</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.state || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Country</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.country || 'India'}</span>
                            </div>

                            {/* Row 2 */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Postal Code</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.zip || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Product Interest</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.product_interest || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Lead Source</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.lead_source || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Lead Priority</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.lead_priority || 'N/A'}</span>
                            </div>

                            {/* Row 3 */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Industry</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.industry || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Estimated Deal Value</span>
                                <span className="text-sm text-[#0f172a] font-medium">{formatCurrency(lead.estimated_deal_value || 0)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Created Date</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.created_date ? dayjs(lead.created_date).format('MM/DD/YYYY') : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Lead Score</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.lead_score || 'N/A'}</span>
                            </div>

                            {/* Row 4 */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Lead Owner</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.lead_owner?.full_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Decision Maker</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.is_decision_maker ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Campaign Name</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.campaign_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Expected Close Date</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.expected_close_date ? dayjs(lead.expected_close_date).format('MM/DD/YYYY') : 'N/A'}</span>
                            </div>

                            {/* Row 5 */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Last Contact Date</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.last_contact_date ? dayjs(lead.last_contact_date).format('MM/DD/YYYY') : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Conversion Status</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.conversion_status || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Lead Assigned To</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.lead_assignee?.full_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Lost Stage</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.lead_stage === 'Lost' ? lead.lost_reason || 'N/A' : 'N/A'}</span>
                            </div>

                            {/* Row 6 */}
                            <div className="flex flex-col gap-1 col-span-4">
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Note</span>
                                <span className="text-sm text-[#0f172a] font-medium">{lead.note || 'N/A'}</span>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="task" className="mt-0">
                        <TaskListView entityId={id} entityType="lead" onCountChange={setTaskCount} />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <StageHistoryTabContent />
                    </TabsContent>

                    <TabsContent value="meeting" className="mt-0">
                        <MeetingsTab entityId={id} entityType="lead" onCountChange={setMeetingCount} />
                    </TabsContent>

                    <TabsContent value="attachment" className="mt-0">
                        <CustomerAttachmentsTab recordId={id} bucketName="lead-attachments" onCountChange={setLeadCount} />
                    </TabsContent>
                </StandardTabs>
            </div>
        </div>
    );
};

export default LeadDetails;

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Users,
    Mail,
    FileText,
    Search,
    CheckCircle2,
    AlertCircle,
    Save,
    Rocket,
    Upload,
    Settings,
    Trash2,
    Edit2,
    X,
    Filter,
    Plus,
    TableProperties,
    RefreshCw,
    Loader2,
    Clock,
    Calendar
} from 'lucide-react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { campaignService } from '@/services/campaignService';
import { emailService, EmailConfig } from '@/services/emailService';
import { EmailCampaign, AudienceSegment } from '@/types';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Drawer, Table, Space, Tooltip, Modal } from 'antd';
import * as XLSX from 'xlsx';
import { localInputToISO, toLocalInput } from "@/lib/dateTime";

export default function CampaignCreate() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [estimating, setEstimating] = useState(false);
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const campaignDataRef = useRef<any>(null);
    const currentIdRef = useRef<string | undefined>(id);
    const isSubmittingRef = useRef(false);
    const [totalContactCount, setTotalContactCount] = useState<number>(0);
    const [audienceSearch, setAudienceSearch] = useState('');
    const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [manualContacts, setManualContacts] = useState<{ id?: string; name: string; email: string }[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerSearch, setDrawerSearch] = useState('');
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [editingRecipients, setEditingRecipients] = useState<{ id?: string; name: string; email: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Campaign Data
    const [campaignData, setCampaignData] = useState<Partial<EmailCampaign>>({
        name: '',
        description: '',
        subject: '',
        preview_text: '',
        status: 'draft',
        segment_id: '',
        template_id: '',
        sender_name: '',
        sender_email: '',
        reply_to: ''
    });

    // Template Filtering
    const [templateCategory, setTemplateCategory] = useState<string>('all');
    const [visibleTemplates, setVisibleTemplates] = useState(6);

    // Delivery & Review State
    const [deliveryType, setDeliveryType] = useState<'now' | 'later'>('now');
    const [scheduledDate, setScheduledDate] = useState<string>(toLocalInput(new Date()).slice(0, 10));
    const [scheduledTime, setScheduledTime] = useState<string>('09:00');

    // Audience State
    const [segments, setSegments] = useState<AudienceSegment[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
        if (id) {
            fetchCampaignData();
        }
        currentIdRef.current = id;
    }, [id]);

    // Keep ref in sync and track changes
    useEffect(() => {
        if (!loading && campaignDataRef.current) {
            // Check for changes to mark dirty
            const hasDataChanged =
                campaignData.name !== campaignDataRef.current.name ||
                campaignData.subject !== campaignDataRef.current.subject ||
                campaignData.segment_id !== campaignDataRef.current.segment_id ||
                campaignData.template_id !== campaignDataRef.current.template_id;

            if (hasDataChanged) {
                setIsDirty(true);
            }
        }
        campaignDataRef.current = campaignData;
    }, [campaignData, loading]);

    // Track manual contact changes separately
    const prevManualContactsRef = useRef(manualContacts);
    useEffect(() => {
        if (!loading && prevManualContactsRef.current !== manualContacts) {
            if (manualContacts.length > 0 || prevManualContactsRef.current.length > 0) {
                setIsDirty(true);
            }
        }
        prevManualContactsRef.current = manualContacts;
    }, [manualContacts, loading]);

    // Navigation Guard
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && !isSubmittingRef.current && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            Modal.confirm({
                title: 'Unsaved Changes',
                content: 'You have unsaved changes. Are you sure you want to leave without saving?',
                okText: 'Leave',
                cancelText: 'Stay',
                onOk: () => blocker.proceed(),
                onCancel: () => blocker.reset(),
                centered: true,
                okButtonProps: { danger: true }
            });
        }
    }, [blocker]);

    // BeforeUnload browser warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const fetchCampaignData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const campaign = await campaignService.getCampaignById(id);
            if (campaign) {
                setCampaignData({
                    id: campaign.id,
                    name: campaign.name,
                    description: campaign.description || '',
                    subject: campaign.subject || '',
                    preview_text: campaign.preview_text || '',
                    status: campaign.status,
                    segment_id: campaign.segment_id || '',
                    template_id: campaign.template_id || '',
                    sender_name: campaign.sender_name || '',
                    sender_email: campaign.sender_email || '',
                    reply_to: campaign.reply_to || ''
                });

                // Load manual contacts/custom selections if they exist in the new column
                const recipients = (campaign as any).manual_contacts;

                if (recipients && Array.isArray(recipients) && recipients.length > 0) {
                    setManualContacts(recipients.map((r: any) => ({
                        id: r.id || r.contact_id || undefined,
                        name: r.name || 'Contact',
                        email: r.email || ''
                    })));

                    // If segment_id is null in DB, it means it's a custom/uploaded list or All Contacts
                    if (!campaign.segment_id) {
                        setCampaignData(prev => ({ ...prev, segment_id: 'uploaded_contacts' }));
                    }
                } else {
                    // If NO recipients AND segment_id is null in DB, it's All Contacts
                    if (!campaign.segment_id) {
                        setCampaignData(prev => ({ ...prev, segment_id: 'all_contacts' }));
                    }
                }
            }
        } catch (error) {
            toast.error('Failed to load draft data');
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        const [segs, temps, settingsResponse, totalCount, configs] = await Promise.all([
            campaignService.getSegments(),
            supabase.from('email_templates').select('*').eq('status', 'active'),
            supabase.from('user_settings').select('settings').maybeSingle(),
            campaignService.getTotalContactCount(),
            emailService.getConfigs()
        ]);

        setSegments(segs);
        setTemplates(temps.data || []);
        setTotalContactCount(totalCount);
        setEmailConfigs(configs);

        // Pre-fill from active config if available
        const activeConfig = configs.find(c => c.is_active) || configs[0];
        if (activeConfig) {
            setCampaignData(prev => ({
                ...prev,
                sender_name: prev.sender_name || activeConfig.from_name || '',
                sender_email: prev.sender_email || activeConfig.from_email || '',
                reply_to: prev.reply_to || activeConfig.from_email || ''
            }));
        } else if (settingsResponse.data?.settings?.smtp_config) {
            const smtp = settingsResponse.data.settings.smtp_config;
            setCampaignData(prev => ({
                ...prev,
                sender_name: prev.sender_name || smtp.fromName || '',
                sender_email: prev.sender_email || smtp.fromEmail || '',
                reply_to: prev.reply_to || smtp.replyTo || smtp.fromEmail || ''
            }));
        }
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSaveDraft = async (isAutoSave = false) => {
        // Validation for manual save
        if (!isAutoSave) {
            if (!campaignData.name) {
                toast.error('Please enter a campaign name before saving');
                return;
            }
            isSubmittingRef.current = true;
            setLoading(true);
        }

        try {
            const currentData = campaignDataRef.current;
            const currentId = currentIdRef.current;
            let contactsToSave = manualContacts;

            // If it's a "Default" (All Contacts) or Segment selection and manualContacts is empty, 
            // we snapshot the current list into the manual_contacts column as requested
            if (!manualContacts.length) {
                if (campaignData.segment_id === 'all_contacts') {
                    contactsToSave = await campaignService.getAllContacts();
                } else if (campaignData.segment_id && campaignData.segment_id !== 'uploaded_contacts') {
                    const segment = segments.find(s => s.id === campaignData.segment_id);
                    if (segment) {
                        contactsToSave = await campaignService.getSegmentContacts(segment.filters);
                    }
                }
            }

            const result = await campaignService.saveCampaign({
                ...currentData,
                id: currentId,
                status: 'draft',
                manual_contacts: contactsToSave
            } as any);

            if (result) {
                if (!currentId) {
                    currentIdRef.current = result.id;
                    // Update URL without reloading
                    window.history.replaceState(null, '', `/campaigns/edit/${result.id}`);
                }

                setIsDirty(false); // Reset dirty state on successful save (auto or manual)

                if (!isAutoSave) {
                    toast.success('Campaign saved as draft');
                    navigate('/campaigns');
                }
            }
            return result; // Return result for caller (Start from Scratch)
        } catch (error) {
            isSubmittingRef.current = false;
            console.error('Draft save failed:', error);
            toast.error('Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (!campaignData.name) {
            toast.error('Please enter a campaign name');
            return;
        }

        setLoading(true);
        isSubmittingRef.current = true;

        try {
            const status = deliveryType === 'now' ? 'sending' : 'scheduled';
            // Local date + time from the form, saved as an absolute timestamp.
            const scheduled_at = deliveryType === 'later' ? localInputToISO(`${scheduledDate}T${scheduledTime}`) : null;

            const result = await campaignService.saveCampaign({
                ...campaignData,
                status,
                scheduled_at,
                id: currentIdRef.current,
                manual_contacts: manualContacts
            } as any);

            if (result) {
                toast.success(deliveryType === 'now' ? 'Campaign sent successfully!' : 'Campaign scheduled successfully!');
                navigate('/campaigns');
            }
        } catch (error) {
            isSubmittingRef.current = false;
            toast.error('Failed to complete campaign');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'Setup', icon: FileText },
        { id: 2, title: 'Audience', icon: Users },
        { id: 3, title: 'Template', icon: Mail },
        { id: 4, title: 'Review', icon: CheckCircle2 }
    ];

    useEffect(() => {
        if (campaignData.segment_id) {
            if (campaignData.segment_id === 'all_contacts') {
                setRecipientCount(totalContactCount);
            } else if (campaignData.segment_id === 'uploaded_contacts') {
                setRecipientCount(manualContacts.length);
            } else {
                const segment = segments.find(s => s.id === campaignData.segment_id);
                if (segment) {
                    setRecipientCount(segment.recipient_count);
                }
            }
        } else {
            setRecipientCount(null);
        }
    }, [campaignData.segment_id, segments, totalContactCount, manualContacts]);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet) as any[];

            const extractedContacts: { name: string; email: string }[] = [];
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            json.forEach((row) => {
                // Look for common column names for email and name
                const emailKey = Object.keys(row).find(key =>
                    key.toLowerCase().includes('email') ||
                    key.toLowerCase().includes('mail')
                );
                const nameKey = Object.keys(row).find(key =>
                    key.toLowerCase().includes('name') ||
                    key.toLowerCase().includes('contact') ||
                    key.toLowerCase().includes('customer')
                );

                const email = emailKey ? String(row[emailKey]).trim() : '';
                const name = nameKey ? String(row[nameKey]).trim() : 'Contact';

                if (email && emailRegex.test(email)) {
                    extractedContacts.push({ name, email });
                }
            });

            if (extractedContacts.length > 0) {
                setManualContacts(extractedContacts);
                setCampaignData(prev => ({
                    ...prev,
                    segment_id: 'uploaded_contacts',
                    manual_contacts: extractedContacts
                }));
                toast.success(`Successfully found ${extractedContacts.length} valid contacts!`);
            } else {
                toast.error('No valid email addresses found in the file.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            handleFileUpload(file);
        } else {
            toast.error('Please upload a valid CSV or Excel file.');
        }
    };

    const handleEditRecipients = async () => {
        setLoading(true);
        try {
            let contacts: { id?: string; name: string; email: string }[] = [];

            if (campaignData.segment_id === 'all_contacts') {
                contacts = await campaignService.getAllContacts();
            } else if (campaignData.segment_id === 'uploaded_contacts') {
                contacts = [...manualContacts];
            } else if (campaignData.segment_id) {
                const segment = segments.find(s => s.id === campaignData.segment_id);
                if (segment) {
                    contacts = await campaignService.getSegmentContacts(segment.filters);
                }
            }

            setEditingRecipients(contacts);
            setIsDrawerOpen(true);
        } catch (error) {
            toast.error('Failed to load contacts for editing');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveRecipient = (email: string) => {
        setEditingRecipients(prev => prev.filter(r => r.email !== email));
    };

    const handleUpdateRecipient = (email: string, field: 'name' | 'email', value: string) => {
        setEditingRecipients(prev => prev.map(r =>
            r.email === email ? { ...r, [field]: value } : r
        ));
    };

    const handleSaveRecipients = () => {
        setManualContacts(editingRecipients);
        setCampaignData(prev => ({
            ...prev,
            segment_id: 'uploaded_contacts',
            manual_contacts: editingRecipients
        }));
        setRecipientCount(editingRecipients.length);
        setIsDrawerOpen(false);
        toast.success(`Updated audience: ${editingRecipients.length} recipients`);
    };

    const filteredEditingRecipients = editingRecipients.filter(r =>
        r.name.toLowerCase().includes(drawerSearch.toLowerCase()) ||
        r.email.toLowerCase().includes(drawerSearch.toLowerCase())
    );

    const filteredTemplates = templates.filter(t => {
        // First filter by the automatic logic (leads vs customers if identified)
        const segment = segments.find(s => s.id === campaignData.segment_id);
        const segmentName = segment?.name?.toLowerCase() || '';
        const isLeadsAudience = segmentName.includes('lead');
        const isCustomersAudience = segmentName.includes('customer');

        let matchesAudience = true;
        if (isLeadsAudience) matchesAudience = t.category === 'leads';
        else if (isCustomersAudience) matchesAudience = t.category === 'customers';
        else matchesAudience = t.category !== 'leads' && t.category !== 'customers';

        // Then filter by the user selected category
        if (templateCategory !== 'all' && t.category !== templateCategory) {
            return false;
        }

        return matchesAudience;
    });

    const handleStartFromScratch = () => {
        Modal.confirm({
            title: 'Save Draft & Create Template?',
            content: 'We will save your current campaign progress as a draft so you can come back and select your new template after creating it.',
            okText: 'Save Draft & Proceed',
            cancelText: 'Cancel',
            centered: true,
            onOk: async () => {
                setLoading(true);
                try {
                    const saved = await handleSaveDraft(true);
                    if (saved) {
                        isSubmittingRef.current = true; // Bypass route guard
                        navigate('/campaigns/templates/create');
                    }
                } catch (err) {
                    console.error('Failed to save draft before navigation:', err);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="min-h-screen">
            <Header title={id || currentIdRef.current ? "Edit Campaign" : "Create Campaign"} />
            <div className="p-6 max-w-5xl mx-auto space-y-8">

                {/* Stepper */}
                <div className="flex items-center justify-between relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg' :
                                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            'bg-white border-slate-200 text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${isActive ? 'text-blue-600' : 'text-slate-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="mt-8 transition-all duration-300">
                    {currentStep === 1 && (
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle className="text-xl">Campaign Details</CardTitle>
                                <CardDescription>Give your campaign a name and define the email's subject line.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Campaign Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Q1 Product Launch"
                                            value={campaignData.name}
                                            onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Internal Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="Brief summary of the campaign"
                                            value={campaignData.description || ''}
                                            onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                </div>
                                <Separator className="bg-slate-100" />
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Email Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Catchy subject to boost open rates"
                                            value={campaignData.subject || ''}
                                            onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="preview">Preview Text</Label>
                                        <Textarea
                                            id="preview"
                                            placeholder="This text appears after the subject line in most email clients"
                                            value={campaignData.preview_text || ''}
                                            onChange={(e) => setCampaignData({ ...campaignData, preview_text: e.target.value })}
                                            className="min-h-[80px] border-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-900">Sender Details</h3>
                                        <Badge variant="outline" className="text-[10px] uppercase border-slate-200 text-slate-400">Step 1.2</Badge>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="fromName">From Name</Label>
                                            <Input
                                                id="fromName"
                                                placeholder="e.g. Nike Store"
                                                value={campaignData.sender_name || ''}
                                                onChange={(e) => setCampaignData({ ...campaignData, sender_name: e.target.value })}
                                                className="h-10 border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fromEmail">From Email Address</Label>
                                            <Select
                                                value={campaignData.sender_email || undefined}
                                                onValueChange={(val) => {
                                                    const config = emailConfigs.find(c => c.from_email === val);
                                                    setCampaignData({
                                                        ...campaignData,
                                                        sender_email: val,
                                                        sender_name: config?.from_name || campaignData.sender_name
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-10 border-slate-200">
                                                    <SelectValue placeholder="Select an email" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {emailConfigs.map(config => (
                                                        <SelectItem key={config.id} value={config.from_email}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{config.label}</span>
                                                                <span className="text-xs text-slate-500">{config.from_email}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                    {emailConfigs.length === 0 && campaignData.sender_email && (
                                                        <SelectItem value={campaignData.sender_email}>{campaignData.sender_email}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="replyTo">Reply-to email</Label>
                                            <Input
                                                id="replyTo"
                                                placeholder="e.g. info@company.com"
                                                value={campaignData.reply_to || ''}
                                                onChange={(e) => setCampaignData({ ...campaignData, reply_to: e.target.value })}
                                                className="h-10 border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-slate-900">Target Audience</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-72">
                                        <Input
                                            placeholder="Search audience..."
                                            value={audienceSearch}
                                            onChange={(e) => setAudienceSearch(e.target.value)}
                                            className="pl-4 pr-10 border-slate-200 h-10 bg-white"
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!campaignData.segment_id}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6"
                                    >
                                        Next: Template
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                {/* Fixed "All Contacts" Option */}
                                {(!audienceSearch || "All Contacts".toLowerCase().includes(audienceSearch.toLowerCase())) && (
                                    <div
                                        onClick={() => setCampaignData({ ...campaignData, segment_id: 'all_contacts' })}
                                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${campaignData.segment_id === 'all_contacts' ? 'border-blue-600 bg-blue-50/20 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${campaignData.segment_id === 'all_contacts' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 group-hover:border-slate-300'
                                                }`}>
                                                {campaignData.segment_id === 'all_contacts' && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">All Contacts</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    Last updated: Recently <span className="text-slate-200">•</span> Every contact in database
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {campaignData.segment_id === 'all_contacts' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleEditRecipients(); }}
                                                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold px-3"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Manage
                                                </Button>
                                            )}
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-900 leading-none">{totalContactCount.toLocaleString()}</p>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Dynamic Segments from DB */}
                                {segments
                                    .filter(s => s.name.toLowerCase().includes(audienceSearch.toLowerCase()))
                                    .map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setCampaignData({ ...campaignData, segment_id: s.id })}
                                            className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${campaignData.segment_id === s.id ? 'border-blue-600 bg-blue-50/20 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${campaignData.segment_id === s.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 group-hover:border-slate-300'
                                                    }`}>
                                                    {campaignData.segment_id === s.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-slate-900">{s.name}</p>
                                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                                        Last updated: {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : 'Recently'} <span className="text-slate-200">•</span> {s.is_dynamic ? 'Dynamic' : 'Static'} segment
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {campaignData.segment_id === s.id && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); handleEditRecipients(); }}
                                                        className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold px-3"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Manage
                                                    </Button>
                                                )}
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-900 leading-none">{s.recipient_count?.toLocaleString() || 0}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Upload Section */}
                            <div className="space-y-4 pt-4">
                                <h4 className="text-lg font-bold text-slate-900 px-1">Upload Contacts</h4>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={onDrop}
                                    className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 p-12 ${isDragging
                                        ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                                        : manualContacts.length > 0
                                            ? 'border-green-200 bg-green-50/20'
                                            : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv, .xlsx, .xls"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }}
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${manualContacts.length > 0
                                            ? 'bg-green-100 border-green-200 text-green-600'
                                            : 'bg-blue-50 border-blue-100 text-blue-600 group-hover:scale-110'
                                            }`}>
                                            {manualContacts.length > 0 ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                        </div>
                                        <div className="text-center space-y-2">
                                            {manualContacts.length > 0 ? (
                                                <>
                                                    <p className="font-bold text-slate-900 text-lg">
                                                        Successfully Uploaded!
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                                            {manualContacts.length} Contacts Found
                                                        </Badge>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleEditRecipients(); }}
                                                            className="h-7 bg-white border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-2 py-0 text-[10px]"
                                                        >
                                                            <Edit2 className="w-3 h-3 mr-1" /> Edit List
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm text-slate-500 pt-2">
                                                        Click <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>here</span> to replace the file
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-slate-900 text-lg">
                                                        Drag & drop your contact file
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        CSV or Excel (xlsx) files are supported
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                                                        className="mt-4 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                                                    >
                                                        Select File from Computer
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <Card className="border-none shadow-md overflow-hidden bg-white">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-bold">Email Template</CardTitle>
                                            <CardDescription>Select a professional template or build one from scratch.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</Label>
                                            <Select value={templateCategory} onValueChange={setTemplateCategory}>
                                                <SelectTrigger className="w-44 h-10 border-slate-200">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    <SelectItem value="marketing">Marketing</SelectItem>
                                                    <SelectItem value="newsletter">Newsletter</SelectItem>
                                                    <SelectItem value="transactional">Transactional</SelectItem>
                                                    <SelectItem value="leads">Leads</SelectItem>
                                                    <SelectItem value="customers">Customers</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {/* Start from Scratch Option */}
                                    <div
                                        onClick={handleStartFromScratch}
                                        className="group relative rounded-2xl border-2 border-dashed border-slate-200 p-5 flex items-center justify-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/30 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
                                        <div className="relative flex items-center gap-6 w-full max-w-xl">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform border border-blue-100 shadow-sm">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-base font-bold text-slate-900">Start from Scratch</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Begin with a blank canvas and use our powerful drag-and-drop editor to build your custom design.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 px-1">Choose Template</h4>
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            {filteredTemplates
                                                .slice(0, visibleTemplates)
                                                .map((template) => (
                                                    <div
                                                        key={template.id}
                                                        onClick={() => setCampaignData({ ...campaignData, template_id: template.id })}
                                                        className={`relative group cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden ${campaignData.template_id === template.id
                                                            ? 'border-blue-600 shadow-xl ring-4 ring-blue-50 translate-y-[-4px]'
                                                            : 'border-slate-100 hover:border-slate-300 hover:shadow-lg hover:translate-y-[-2px] bg-white'
                                                            }`}
                                                    >
                                                        {/* Category Badge */}
                                                        <div className="absolute top-3 left-3 z-10">
                                                            <Badge className="bg-blue-600/90 text-[10px] uppercase font-bold tracking-widest border-0 py-0.5 px-2 backdrop-blur-sm">
                                                                {template.category || 'PRODUCT'}
                                                            </Badge>
                                                        </div>

                                                        {/* Selection Indicator */}
                                                        {campaignData.template_id === template.id && (
                                                            <div className="absolute top-3 right-3 z-20 bg-blue-600 text-white rounded-full p-1 shadow-lg animate-in zoom-in duration-300">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </div>
                                                        )}

                                                        {/* Preview Area */}
                                                        <div className="h-48 bg-[#f8fafc] flex items-center justify-center p-6 relative">
                                                            <div className="absolute inset-0 bg-[#e5a06c]/10 mix-blend-multiply opacity-50" />
                                                            <div className="relative w-full h-full bg-white rounded shadow-sm border border-slate-200/50 flex flex-col items-center justify-center overflow-hidden">
                                                                <Mail className={`w-12 h-12 transition-all duration-500 ${campaignData.template_id === template.id ? 'text-blue-500 scale-110' : 'text-slate-200'}`} />
                                                                <div className="mt-2 w-1/2 h-1.5 bg-slate-100 rounded-full" />
                                                                <div className="mt-1 w-1/3 h-1.5 bg-slate-50 rounded-full" />
                                                            </div>
                                                        </div>

                                                        {/* Info Area */}
                                                        <div className="p-4 bg-white border-t border-slate-50 flex items-center justify-between">
                                                            <div className="space-y-1 min-w-0 flex-1">
                                                                <p className="text-sm font-black text-slate-900 truncate tracking-tight">{template.name}</p>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                    <span>Subject:</span>
                                                                    <span className="truncate text-blue-500/70">{template.subject || '⚡ 48-Hour Flash Sale - Up to 60% Off'}</span>
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 rounded-full">
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>

                                        {filteredTemplates.length > visibleTemplates && (
                                            <div className="flex justify-center pt-8 pb-4">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setVisibleTemplates(prev => prev + 6)}
                                                    className="text-blue-600 font-black uppercase tracking-widest text-xs hover:bg-blue-50 px-8 h-10 border border-transparent hover:border-blue-100"
                                                >
                                                    Load More Templates
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="grid lg:grid-cols-5 gap-8">
                            {/* Left Column: Settings & Summary */}
                            <div className="lg:col-span-3 space-y-6">
                                {/* Delivery Settings */}
                                <Card className="border-slate-100 shadow-sm overflow-hidden">
                                    <CardHeader className="py-4 px-6 border-b border-slate-50">
                                        <CardTitle className="text-base font-bold text-slate-900">Delivery Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                onClick={() => setDeliveryType('now')}
                                                className={`cursor-pointer rounded-xl border-2 p-4 h-[44px] flex items-center gap-3 transition-all ${deliveryType === 'now' ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === 'now' ? 'border-blue-600' : 'border-slate-300'}`}>
                                                    {deliveryType === 'now' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                </div>
                                                <span className={`text-sm font-bold ${deliveryType === 'now' ? 'text-slate-900' : 'text-slate-600'}`}>Send Now</span>
                                            </div>
                                            <div 
                                                onClick={() => setDeliveryType('later')}
                                                className={`cursor-pointer rounded-xl border-2 p-4 h-[44px] flex items-center gap-3 transition-all ${deliveryType === 'later' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${deliveryType === 'later' ? 'bg-blue-600' : 'border-2 border-slate-300'}`}>
                                                    {deliveryType === 'later' && (
                                                        <Check className="w-3 h-3 text-white stroke-[4px]" />
                                                    )}
                                                </div>
                                                <span className={`text-sm font-bold ${deliveryType === 'later' ? 'text-blue-700' : 'text-slate-600'}`}>Schedule for Later</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="relative">
                                                <FloatingLabelInput 
                                                    label="Date"
                                                    type="date" 
                                                    value={scheduledDate}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                    suffix={<Mail className="w-4 h-4" />}
                                                />
                                            </div>
                                            <div className="relative">
                                                <FloatingLabelInput 
                                                    label="Time"
                                                    type="time" 
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    suffix={<Clock className="w-4 h-4" />}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary Card */}
                                <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
                                    <CardContent className="p-0 divide-y divide-slate-50">
                                        {/* Subject Line Row */}
                                        <div className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Line</p>
                                                    <p className="text-sm font-bold text-slate-900">{campaignData.subject || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setCurrentStep(1)} className="text-slate-300 hover:text-blue-600">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Sender Row */}
                                        <div className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg font-bold">
                                                    @
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sender</p>
                                                    <p className="text-sm font-bold text-slate-900">{campaignData.sender_name || 'Marketing Team'}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setCurrentStep(1)} className="text-slate-300 hover:text-blue-600">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Date & Time Row */}
                                        <div className="p-5 flex items-center gap-4 bg-slate-50/30">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Settings className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</p>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {deliveryType === 'now' ? 'Immediately' : `${scheduledDate} - ${scheduledTime}`}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Template Preview */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base font-bold text-slate-900">Template Preview</CardTitle>
                                        <button 
                                            onClick={() => campaignData.template_id && setIsPreviewModalOpen(true)}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Full View
                                        </button>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1 bg-slate-50/50 flex flex-col">
                                        <div className="w-full flex-1 min-h-[400px] rounded-2xl border border-slate-200 bg-white flex flex-col relative shadow-inner overflow-hidden">
                                            {campaignData.template_id ? (
                                                <div 
                                                    className="absolute inset-0 overflow-auto p-4 origin-top scale-[0.9]"
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: templates.find(t => t.id === campaignData.template_id)?.body || '' 
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                                                        <Mail className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        <p className="text-sm font-bold text-slate-400 leading-relaxed px-4">
                                                            Template preview will appear here as you configure your campaign.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Actions */}
                <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => handleSaveDraft(false)}
                        disabled={loading || !campaignData.name}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save as Draft
                    </Button>

                    <div className="flex gap-4">
                        {currentStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="text-slate-500 hover:text-slate-900 font-bold border-slate-200"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        )}

                        {currentStep < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!campaignData.name}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-bold transition-all hover:translate-x-1"
                            >
                                Next Step <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl font-bold px-8 transition-all hover:scale-105"
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {deliveryType === 'now' ? 'Send Now' : 'Schedule Campaign'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <Drawer
                title={
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Manage Recipients</h3>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Refine your audience by removing specifically excluded contacts.</p>
                        </div>
                        <div className="relative w-64">
                            <Input
                                placeholder="Search recipients..."
                                value={drawerSearch}
                                onChange={(e) => setDrawerSearch(e.target.value)}
                                className="h-9 pl-8 border-slate-200 bg-slate-50 focus:bg-white transition-all"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                }
                placement="right"
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                width={700}
                headerStyle={{ borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }}
                bodyStyle={{ padding: '0' }}
                footer={
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="bg-blue-600 text-white border-0 py-1 px-3">
                                {editingRecipients.length} Recipients Selected
                            </Badge>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">
                                {editingRecipients.length < recipientCount! ? `${recipientCount! - editingRecipients.length} Excluded` : 'No exclusions'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)} className="font-bold text-slate-500">
                                Cancel
                            </Button>
                            <Button onClick={handleSaveRecipients} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-100">
                                Apply Selection
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
                    <Table
                        dataSource={filteredEditingRecipients}
                        pagination={{ pageSize: 50, showSizeChanger: true }}
                        rowKey="email"
                        scroll={{ y: 'calc(100vh - 280px)' }}
                        className="recipient-table"
                        columns={[
                            {
                                title: <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Name</span>,
                                dataIndex: 'name',
                                key: 'name',
                                width: '40%',
                                render: (text, record) => (
                                    <div className="group/row flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                            {text.charAt(0)}
                                        </div>
                                        <Input
                                            value={text}
                                            onChange={(e) => handleUpdateRecipient(record.email, 'name', e.target.value)}
                                            className="border-transparent bg-transparent hover:border-slate-200 h-8 font-medium text-slate-900 focus:bg-white transition-all p-1"
                                        />
                                    </div>
                                )
                            },
                            {
                                title: <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Email</span>,
                                dataIndex: 'email',
                                key: 'email',
                                width: '45%',
                                render: (text, record) => (
                                    <Input
                                        value={text}
                                        onChange={(e) => handleUpdateRecipient(record.email, 'email', e.target.value)}
                                        className="border-transparent bg-transparent hover:border-slate-200 h-8 text-slate-500 focus:bg-white transition-all p-1"
                                    />
                                )
                            },
                            {
                                title: '',
                                key: 'action',
                                width: '10%',
                                align: 'right',
                                render: (_, record) => (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveRecipient(record.email)}
                                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )
                            }
                        ]}
                    />
                </div>
            </Drawer>

            <Modal
                title="Template Preview"
                open={isPreviewModalOpen}
                onCancel={() => setIsPreviewModalOpen(false)}
                footer={null}
                width={800}
                centered
                bodyStyle={{ padding: 0, height: '70vh', overflow: 'hidden' }}
            >
                <div className="h-full overflow-auto p-8 bg-slate-50">
                    <div 
                        className="bg-white p-8 rounded-xl shadow-sm mx-auto max-w-full"
                        style={{ minHeight: '100%' }}
                        dangerouslySetInnerHTML={{ 
                            __html: templates.find(t => t.id === campaignData.template_id)?.body || '' 
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}

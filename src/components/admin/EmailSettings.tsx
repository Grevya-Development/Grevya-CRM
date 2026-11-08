import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Send, ShieldCheck, Settings2, History, AlertCircle, CheckCircle2, Loader2, Plus, Edit2, Trash2, X, Check, Search, Lock, Eye, Paperclip, FileText, Filter, Layers, ChevronRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/supabase/supabaseClient';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { DatePicker } from '@/components/ui/date-picker';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

dayjs.extend(isBetween);

const MAILER_API_URL = import.meta.env.VITE_MAILER_API_URL || 'http://localhost:3001/api';

export function EmailSettings() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [testingImap, setTestingImap] = useState(false);
    const [configs, setConfigs] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [smtpTested, setSmtpTested] = useState(false);
    const [imapTested, setImapTested] = useState(false);
    const [totalSentCount, setTotalSentCount] = useState(0);
    const [fetchingLogs, setFetchingLogs] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const initialFormState = {
        label: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: '',
        smtp_pass: '',
        from_email: '',
        from_name: '',
        imap_host: '',
        imap_port: 993,
        imap_secure: true,
        imap_user: '',
        imap_pass: '',
        is_active: false,
        is_sync_enabled: false,
    };

    const [settings, setSettings] = useState(initialFormState);
    const [logs, setLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'activity' | 'audit'>('activity');

    // Filtering & Pagination State
    const [activitySearch, setActivitySearch] = useState('');
    const [activityStatus, setActivityStatus] = useState('all');
    const [activityPage, setActivityPage] = useState(1);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditStatus, setAuditStatus] = useState('all');
    const [auditPage, setAuditPage] = useState(1);
    const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);
    const [isAuditViewOpen, setIsAuditViewOpen] = useState(false);

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [groupBy, setGroupBy] = useState('none');
    const pageSize = 20;

    useEffect(() => {
        fetchConfigs();
        fetchLogs();
        fetchAuditLogs();
    }, []);

    const fetchConfigs = async () => {
        setFetching(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.get(`${MAILER_API_URL}/settings`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.data.data) {
                setConfigs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
            toast.error('Failed to fetch email configurations');
        } finally {
            setFetching(false);
        }
    };

    const fetchLogs = async () => {
        setFetchingLogs(true);
        try {
            const { count, error: countError } = await supabase
                .from('email_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent');

            if (!countError) {
                setTotalSentCount(count || 0);
            }

            const { data, error } = await supabase
                .from('email_data')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Email Data Fetch Error:', error);
                throw error;
            }
            console.log('Email Data loaded:', data?.length);
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching email data activity:', error);
        } finally {
            setFetchingLogs(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('email_logs')
                .select('*')
                .order('sent_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Email Logs Fetch Error:', error);
                throw error;
            }
            console.log('Email Audit Logs loaded:', data?.length);
            setAuditLogs(data || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseInt(value)) : value);

        setSettings(prev => {
            const newSettings = { ...prev, [name]: val };

            if (name === 'smtp_port') {
                if (val === 465) newSettings.smtp_secure = true;
                if (val === 587 || val === 25) newSettings.smtp_secure = false;
            }
            if (name === 'imap_port') {
                if (val === 993) newSettings.imap_secure = true;
                if (val === 143) newSettings.imap_secure = false;
            }

            return newSettings;
        });

        // Reset test status if sensitive fields change
        if (['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'].includes(name)) {
            setSmtpTested(false);
        }
        if (['imap_host', 'imap_port', 'imap_user', 'imap_pass'].includes(name)) {
            setImapTested(false);
        }
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleEdit = (config: any) => {
        setSettings({
            ...config,
            smtp_pass: '',
            imap_pass: '',
        });
        setEditingId(config.id);
        setSmtpTested(true);
        setImapTested(true);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setSettings(initialFormState);
        setEditingId(null);
        setSmtpTested(false);
        setImapTested(false);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this configuration?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.delete(`${MAILER_API_URL}/settings/${id}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.data.success) {
                toast.success('Configuration removed successfully');
                fetchConfigs();
            } else {
                toast.error(response.data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        if (currentStatus) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.post(`${MAILER_API_URL}/settings/${id}/activate`, {}, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.data.success) {
                toast.success('Configuration is now active');
                fetchConfigs();
            } else {
                toast.error(response.data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const testSmtp = async () => {
        setTestingSmtp(true);
        try {
            const response = await axios.post(`${MAILER_API_URL}/test-smtp`, {
                host: settings.smtp_host,
                port: settings.smtp_port,
                secure: settings.smtp_secure,
                user: settings.smtp_user,
                password: settings.smtp_pass,
                id: editingId
            });
            if (response.data.success) {
                toast.success('SMTP connection successful!');
                setSmtpTested(true);
            } else {
                toast.error(response.data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setTestingSmtp(false);
        }
    };

    const testImap = async () => {
        setTestingImap(true);
        try {
            const response = await axios.post(`${MAILER_API_URL}/test-imap`, {
                host: settings.imap_host,
                port: settings.imap_port,
                secure: settings.imap_secure,
                user: settings.imap_user,
                password: settings.imap_pass,
                id: editingId
            });
            if (response.data.success) {
                toast.success('IMAP connection successful!');
                setImapTested(true);
            } else {
                toast.error(response.data.error || 'IMAP connection failed');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setTestingImap(false);
        }
    };

    const saveSettings = async () => {
        if (!settings.label) {
            toast.error('Please provide a label for this configuration');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const payload = editingId
                ? { ...settings, id: editingId, user_id: userId }
                : { ...settings, user_id: userId };

            const response = await axios.post(`${MAILER_API_URL}/settings`, payload, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.data.success) {
                toast.success('Settings saved successfully!');
                setShowForm(false);
                fetchConfigs();
            } else {
                toast.error(response.data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIVITY LOGS LOGIC ---
    const filteredActivity = logs.filter(log => {
        const matchesSearch =
            (log.subject?.toLowerCase() || '').includes(activitySearch.toLowerCase()) ||
            (log.from_email?.toLowerCase() || '').includes(activitySearch.toLowerCase()) ||
            (log.to_email?.toLowerCase() || '').includes(activitySearch.toLowerCase());

        const matchesStatus = activityStatus === 'all' || log.status === activityStatus;

        const logDate = dayjs(log.created_at);
        const matchesDate = (!startDate || logDate.isSame(dayjs(startDate), 'day') || logDate.isAfter(dayjs(startDate), 'day')) &&
            (!endDate || logDate.isSame(dayjs(endDate), 'day') || logDate.isBefore(dayjs(endDate), 'day'));

        return matchesSearch && matchesStatus && matchesDate;
    });

    const paginatedActivity = filteredActivity.slice(
        (activityPage - 1) * pageSize,
        activityPage * pageSize
    );

    const activityTotalPages = Math.ceil(filteredActivity.length / pageSize);

    // Grouping logic for Activity
    const groupedActivity = React.useMemo(() => {
        if (groupBy === 'none') return { 'All Activity': paginatedActivity };

        return paginatedActivity.reduce((acc, log) => {
            let groupKey = 'Unknown';
            if (groupBy === 'status') {
                groupKey = (log.status || 'sent').toUpperCase();
            } else if (groupBy === 'config') {
                // Find config label by matching from_email
                const config = configs.find(c => c.from_email === log.from_email);
                groupKey = config?.label || log.from_email || 'Default Config';
            }

            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(log);
            return acc;
        }, {} as Record<string, any[]>);
    }, [paginatedActivity, groupBy, configs]);

    // --- AUDIT LOGS LOGIC ---
    const filteredAudit = auditLogs.filter(log => {
        const matchesSearch =
            (log.subject?.toLowerCase() || '').includes(auditSearch.toLowerCase()) ||
            (log.recipient_email?.toLowerCase() || '').includes(auditSearch.toLowerCase());

        const matchesStatus = auditStatus === 'all' || log.status === auditStatus;

        const logDate = dayjs(log.sent_at);
        const matchesDate = (!startDate || logDate.isSame(dayjs(startDate), 'day') || logDate.isAfter(dayjs(startDate), 'day')) &&
            (!endDate || logDate.isSame(dayjs(endDate), 'day') || logDate.isBefore(dayjs(endDate), 'day'));

        return matchesSearch && matchesStatus && matchesDate;
    });

    const paginatedAudit = filteredAudit.slice(
        (auditPage - 1) * pageSize,
        auditPage * pageSize
    );

    const auditTotalPages = Math.ceil(filteredAudit.length / pageSize);

    // Grouping logic for Audit
    const groupedAudit = React.useMemo(() => {
        if (groupBy === 'none') return { 'All Logs': paginatedAudit };

        return paginatedAudit.reduce((acc, log) => {
            let groupKey = 'Unknown';
            if (groupBy === 'status') {
                groupKey = (log.status || 'sent').toUpperCase();
            } else if (groupBy === 'config') {
                // For audit, we don't have config info easily, but we can group by sender if available
                groupKey = 'Default Configuration';
            }

            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(log);
            return acc;
        }, {} as Record<string, any[]>);
    }, [paginatedAudit, groupBy]);

    return (
        <>
            <div className="space-y-6 w-full pb-10">
                {/* Header with List View */}
                <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Email Configurations</CardTitle>
                                    <CardDescription>Manage multiple SMTP and IMAP credentials</CardDescription>
                                </div>
                            </div>
                            {!showForm && (
                                <Button onClick={handleAddNew} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {fetching ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                        ) : (
                            <div className="rounded-md border bg-card overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 text-left border-b">
                                            <th className="p-3 font-medium">Label</th>
                                            <th className="p-3 font-medium">SMTP User</th>
                                            <th className="p-3 font-medium text-center">Active</th>
                                            <th className="p-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.length > 0 ? configs.map(config => (
                                            <tr key={config.id} className="border-t hover:bg-muted/30 transition-colors">
                                                <td className="p-3 font-medium text-primary">{config.label || 'Default'}</td>
                                                <td className="p-3 text-muted-foreground">{config.smtp_user}</td>
                                                <td className="p-3 text-center">
                                                    <Switch
                                                        checked={config.is_active}
                                                        onCheckedChange={() => toggleActive(config.id, config.is_active)}
                                                        className="data-[state=checked]:bg-green-500 scale-90"
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(config)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(config.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                    No configurations found. Click "Add New" to get started.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Form Section */}
                {showForm && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {editingId ? 'Edit Configuration' : 'New Configuration'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Label & Common */}
                            <Card className="md:col-span-2 shadow-md border-primary/5">
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                        <FloatingLabelInput
                                            label="Configuration Name (Label)"
                                            id="label"
                                            name="label"
                                            value={settings.label}
                                            onChange={handleChange}
                                            placeholder="e.g., Marketing Gmail"
                                            required
                                        />
                                        <div className="flex items-center space-x-3 py-2 border rounded-[6px] px-4 bg-muted/20 h-[44px]">
                                            <Switch
                                                id="is_active"
                                                checked={settings.is_active}
                                                onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                                            />
                                            <Label htmlFor="is_active" className="cursor-pointer font-medium text-[14px]">Set as Active Configuration</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Outgoing Settings */}
                            <Card className="shadow-lg border-blue-500/10 flex flex-col">
                                <CardHeader className="pb-3 border-b bg-blue-50/50 dark:bg-blue-900/10">
                                    <div className="flex items-center gap-2">
                                        <Send className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-lg">Outgoing Email (SMTP)</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FloatingLabelInput
                                            label="SMTP Host"
                                            id="smtp_host"
                                            name="smtp_host"
                                            value={settings.smtp_host}
                                            onChange={handleChange}
                                            placeholder="smtp.gmail.com"
                                        />
                                        <FloatingLabelInput
                                            label="SMTP Port"
                                            id="smtp_port"
                                            name="smtp_port"
                                            type="number"
                                            value={settings.smtp_port}
                                            onChange={handleChange}
                                            placeholder="587"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2 py-2">
                                        <Switch
                                            id="smtp_secure"
                                            checked={settings.smtp_secure}
                                            onCheckedChange={(checked) => handleSwitchChange('smtp_secure', checked)}
                                        />
                                        <Label htmlFor="smtp_secure" className="text-[14px]">Use SSL/TLS (Port 465)</Label>
                                    </div>

                                    <FloatingLabelInput
                                        label="Email"
                                        id="smtp_user"
                                        name="smtp_user"
                                        value={settings.smtp_user}
                                        onChange={handleChange}
                                        placeholder="user@gmail.com"
                                    />
                                    <FloatingLabelInput
                                        label="App Password"
                                        id="smtp_pass"
                                        name="smtp_pass"
                                        type="password"
                                        value={settings.smtp_pass}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />

                                    <Separator className="my-2" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FloatingLabelInput
                                            label="From Name"
                                            id="from_name"
                                            name="from_name"
                                            value={settings.from_name}
                                            onChange={handleChange}
                                            placeholder="CRM Team"
                                        />
                                        <FloatingLabelInput
                                            label="From Email"
                                            id="from_email"
                                            name="from_email"
                                            value={settings.from_email}
                                            onChange={handleChange}
                                            placeholder="no-reply@crm.com"
                                        />
                                    </div>

                                </CardContent>
                            </Card>

                            {/* Incoming Settings */}
                            <Card className="shadow-lg border-purple-500/10 flex flex-col">
                                <CardHeader className="pb-3 border-b bg-purple-50/50 dark:bg-purple-900/10">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-purple-600" />
                                        <CardTitle className="text-lg">Incoming Email (IMAP)</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FloatingLabelInput
                                            label="IMAP Host"
                                            id="imap_host"
                                            name="imap_host"
                                            value={settings.imap_host}
                                            onChange={handleChange}
                                            placeholder="imap.gmail.com"
                                        />
                                        <FloatingLabelInput
                                            label="IMAP Port"
                                            id="imap_port"
                                            name="imap_port"
                                            type="number"
                                            value={settings.imap_port}
                                            onChange={handleChange}
                                            placeholder="993"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2 py-2">
                                        <Switch
                                            id="imap_secure"
                                            checked={settings.imap_secure}
                                            onCheckedChange={(checked) => handleSwitchChange('imap_secure', checked)}
                                        />
                                        <Label htmlFor="imap_secure" className="text-[14px]">Use SSL/TLS</Label>
                                    </div>

                                    <FloatingLabelInput
                                        label="Username / Email"
                                        id="imap_user"
                                        name="imap_user"
                                        value={settings.imap_user}
                                        onChange={handleChange}
                                        placeholder="user@gmail.com"
                                    />
                                    <FloatingLabelInput
                                        label="Password / App Password"
                                        id="imap_pass"
                                        name="imap_pass"
                                        type="password"
                                        value={settings.imap_pass}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />

                                    <div className="border-t pt-4 bg-muted/20 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold">Enable IMAP Sync</Label>
                                                <p className="text-[10px] text-muted-foreground">Automatically fetch incoming emails</p>
                                            </div>
                                            <Switch
                                                checked={settings.is_sync_enabled}
                                                onCheckedChange={(checked) => handleSwitchChange('is_sync_enabled', checked)}
                                            />
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>

                        {/* Test Connection Buttons Row */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full border-blue-200 hover:border-blue-500 transition-all",
                                    smtpTested && "border-green-500 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                )}
                                onClick={testSmtp}
                                disabled={testingSmtp}
                            >
                                {testingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                                    smtpTested ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                {smtpTested ? 'SMTP Connected' : 'Test SMTP Connection'}
                            </Button>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full border-purple-200 hover:border-purple-500 transition-all",
                                    imapTested && "border-green-500 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                )}
                                onClick={testImap}
                                disabled={testingImap}
                            >
                                {testingImap ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                                    imapTested ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                {imapTested ? 'IMAP Connected' : 'Test IMAP Connection'}
                            </Button>
                        </div>

                        {/* Final Action Buttons */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setShowForm(false)} className="px-8">
                                Cancel
                            </Button>
                            <Button
                                onClick={saveSettings}
                                disabled={loading || !smtpTested || !imapTested}
                                className={cn(
                                    "px-8 shadow-md transition-all",
                                    (smtpTested && imapTested) ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
                                )}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                                    (!smtpTested || !imapTested) ? <Lock className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                                {editingId ? 'Update Configuration' : 'Create Configuration'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Bottom Section: Logs */}
                <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle>Email History & Audit</CardTitle>
                                    <CardDescription>Track deliveries and technical transmission logs</CardDescription>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4 border-b">
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activity' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Recent Activity
                            </button>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Audit Trail
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {activeTab === 'activity' ? (
                            <div className="space-y-4">
                                {/* Filtering UI */}
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-2">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-96">
                                            <Input
                                                placeholder="Search activities..."
                                                className="pl-4 pr-10 rounded-md border-slate-200 focus-visible:ring-blue-500 bg-white h-10"
                                                value={activitySearch}
                                                onChange={(e) => {
                                                    setActivitySearch(e.target.value);
                                                    setActivityPage(1);
                                                }}
                                            />
                                            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "h-10 w-44 border-slate-200 transition-all gap-2 px-3 justify-start shrink-0",
                                                        (activityStatus !== 'all' || startDate || endDate)
                                                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                                            : "hover:border-blue-600 hover:text-blue-600"
                                                    )}
                                                >
                                                    <Filter className="h-4 w-4" />
                                                    Filters
                                                    {(activityStatus !== 'all' || startDate || endDate) && (
                                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-100 text-blue-700 border-none">
                                                            {[activityStatus !== 'all', startDate, endDate].filter(Boolean).length}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0 shadow-xl" align="start">
                                                <div className="p-4 border-b bg-muted/20">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-sm">Advanced Filters</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setActivitySearch('');
                                                                setActivityStatus('all');
                                                                setStartDate(undefined);
                                                                setEndDate(undefined);
                                                                setActivityPage(1);
                                                            }}
                                                            className="h-7 text-[11px] text-blue-600 hover:text-blue-700 px-2"
                                                        >
                                                            Clear All
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-6">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</Label>
                                                        <Select value={activityStatus} onValueChange={(val) => { setActivityStatus(val); setActivityPage(1); }}>
                                                            <SelectTrigger className="h-9 w-full text-xs">
                                                                <SelectValue placeholder="All Statuses" />
                                                                <SelectContent>
                                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                                    <SelectItem value="sent">Sent</SelectItem>
                                                                    <SelectItem value="pending">Pending</SelectItem>
                                                                    <SelectItem value="failed">Failed</SelectItem>
                                                                </SelectContent>
                                                            </SelectTrigger>
                                                        </Select>
                                                    </div>

                                                    <Separator />

                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Date Range</Label>
                                                        <div className="space-y-4">
                                                            <DatePicker
                                                                date={startDate}
                                                                setDate={(date) => { setStartDate(date); setActivityPage(1); }}
                                                                label="From Date"
                                                            />
                                                            <DatePicker
                                                                date={endDate}
                                                                setDate={(date) => { setEndDate(date); setActivityPage(1); }}
                                                                label="To Date"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        <div className="flex items-center w-44 border border-slate-200 rounded-md bg-white px-2 h-10 transition-all hover:border-blue-600 group/groupby shrink-0">
                                            <Layers className="h-4 w-4 text-slate-400 mr-2 group-hover/groupby:text-blue-600 transition-colors" />
                                            <Select value={groupBy} onValueChange={setGroupBy}>
                                                <SelectTrigger className="h-9 w-full border-none shadow-none focus:ring-0 text-xs font-semibold group-hover/groupby:text-blue-600 transition-colors px-0">
                                                    <SelectValue placeholder="Group by" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Grouping</SelectItem>
                                                    <SelectItem value="status">By Status</SelectItem>
                                                    <SelectItem value="config">By Config</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-full px-4 py-1.5 flex items-center gap-2.5 whitespace-nowrap shadow-sm">
                                            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Sent:</span>
                                            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{totalSentCount}</span>
                                        </div>
                                        <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-full px-4 py-1.5 flex items-center gap-2.5 whitespace-nowrap shadow-sm">
                                            <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Recv:</span>
                                            <span className="text-sm font-bold text-purple-900 dark:text-blue-100">50</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-md border bg-card overflow-hidden">
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm min-w-[700px]">
                                                <thead>
                                                    <tr className="bg-muted/50 text-left">
                                                        <th className="p-3 font-medium w-[100px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Type</th>
                                                        <th className="p-3 font-medium w-[200px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">From</th>
                                                        <th className="p-3 font-medium w-[200px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">To</th>
                                                        <th className="p-3 font-medium w-[250px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Subject</th>
                                                        <th className="p-3 font-medium w-[100px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Status</th>
                                                        <th className="p-3 font-medium w-[150px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Created At</th>
                                                        <th className="p-3 font-medium w-[80px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm text-right">View</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fetchingLogs ? (
                                                        <tr>
                                                            <td colSpan={7} className="p-12 text-center">
                                                                <div className="flex flex-col items-center justify-center gap-3">
                                                                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                                                    <p className="text-sm text-muted-foreground">Loading activity history...</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : filteredActivity.length > 0 ? (
                                                        Object.entries(groupedActivity).map(([groupName, groupLogs]) => (
                                                            <React.Fragment key={groupName}>
                                                                {groupBy !== 'none' && (
                                                                    <tr className="bg-muted/30 border-y border-slate-200">
                                                                        <td colSpan={7} className="py-2.5 px-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{groupName}</span>
                                                                                <Badge variant="outline" className="text-[10px] ml-1 bg-white border-slate-200 text-slate-500 font-bold">
                                                                                    {(groupLogs as any[]).length} {(groupLogs as any[]).length === 1 ? 'Activity' : 'Activities'}
                                                                                </Badge>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {(groupLogs as any[]).map(log => (
                                                                    <tr key={log.id} className="group border-t hover:bg-muted/30 transition-colors">
                                                                        <td className="p-3">
                                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                                {log.direction?.toUpperCase() || 'OUTBOUND'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3 font-medium">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[11px] text-muted-foreground truncate max-w-[150px]" title={log.from_email || configs.find(c => c.is_active)?.from_email || 'CRM Application'}>
                                                                                    {log.from_email || configs.find(c => c.is_active)?.from_email || 'CRM Application'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 font-medium">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[11px] text-muted-foreground truncate max-w-[150px]" title={log.to_email}>
                                                                                    {log.to_email}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 truncate max-w-[200px] text-muted-foreground">{log.subject}</td>
                                                                        <td className="p-3 text-red-500 max-w-[250px] truncate text-xs">
                                                                            {log.status === 'failed' ? (
                                                                                <div title={log.error_message}>{log.error_message || 'Failed to send'}</div>
                                                                            ) : (
                                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                                    log.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                                    }`}>
                                                                                    {(log.status || 'SENT').toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(log.created_at)}</td>
                                                                        <td className="p-3 text-right">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                                                                onClick={() => {
                                                                                    setSelectedAuditLog({ ...log, content: log.body, sent_at: log.created_at, recipient_email: log.to_email });
                                                                                    setIsAuditViewOpen(true);
                                                                                }}
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">No recent activity</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {activityTotalPages > 1 && (
                                            <div className="flex items-center justify-between py-3 px-2 sticky bottom-0 z-10 bg-card border-t mt-0">
                                                <p className="text-xs text-muted-foreground">
                                                    Showing {(activityPage - 1) * pageSize + 1} to {Math.min(activityPage * pageSize, filteredActivity.length)} of {filteredActivity.length} logs
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={activityPage === 1}
                                                        onClick={() => setActivityPage(prev => prev - 1)}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <div className="flex items-center px-4 font-medium text-xs">
                                                        Page {activityPage} of {activityTotalPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={activityPage === activityTotalPages}
                                                        onClick={() => setActivityPage(prev => prev + 1)}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Filtering UI */}
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-2">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-96">
                                            <Input
                                                placeholder="Search audit trail..."
                                                className="pl-4 pr-10 rounded-md border-slate-200 focus-visible:ring-blue-500 bg-white h-10"
                                                value={auditSearch}
                                                onChange={(e) => {
                                                    setAuditSearch(e.target.value);
                                                    setAuditPage(1);
                                                }}
                                            />
                                            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "h-10 w-44 border-slate-200 transition-all gap-2 px-3 justify-start shrink-0",
                                                        (auditStatus !== 'all' || startDate || endDate)
                                                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                                            : "hover:border-blue-600 hover:text-blue-600"
                                                    )}
                                                >
                                                    <Filter className="h-4 w-4" />
                                                    Filters
                                                    {(auditStatus !== 'all' || startDate || endDate) && (
                                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-100 text-blue-700 border-none">
                                                            {[auditStatus !== 'all', startDate, endDate].filter(Boolean).length}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0 shadow-xl" align="start">
                                                <div className="p-4 border-b bg-muted/20">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-sm">Advanced Filters</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAuditSearch('');
                                                                setAuditStatus('all');
                                                                setStartDate(undefined);
                                                                setEndDate(undefined);
                                                                setAuditPage(1);
                                                            }}
                                                            className="h-7 text-[11px] text-blue-600 hover:text-blue-700 px-2"
                                                        >
                                                            Clear All
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-6">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</Label>
                                                        <Select value={auditStatus} onValueChange={(val) => { setAuditStatus(val); setAuditPage(1); }}>
                                                            <SelectTrigger className="h-9 w-full text-xs">
                                                                <SelectValue placeholder="All Statuses" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Statuses</SelectItem>
                                                                <SelectItem value="sent">Sent</SelectItem>
                                                                <SelectItem value="failed">Failed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <Separator />

                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Date Range</Label>
                                                        <div className="space-y-4">
                                                            <DatePicker
                                                                date={startDate}
                                                                setDate={(date) => { setStartDate(date); setAuditPage(1); }}
                                                                label="From Date"
                                                            />
                                                            <DatePicker
                                                                date={endDate}
                                                                setDate={(date) => { setEndDate(date); setAuditPage(1); }}
                                                                label="To Date"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        <div className="flex items-center w-44 border border-slate-200 rounded-md bg-white px-2 h-10 transition-all hover:border-blue-600 group/groupby shrink-0">
                                            <Layers className="h-4 w-4 text-slate-400 mr-2 group-hover/groupby:text-blue-600 transition-colors" />
                                            <Select value={groupBy} onValueChange={setGroupBy}>
                                                <SelectTrigger className="h-9 w-full border-none shadow-none focus:ring-0 text-xs font-semibold group-hover/groupby:text-blue-600 transition-colors px-0">
                                                    <SelectValue placeholder="Group by" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Grouping</SelectItem>
                                                    <SelectItem value="status">By Status</SelectItem>
                                                    <SelectItem value="config">By Config</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-full px-4 py-1.5 flex items-center gap-2.5 whitespace-nowrap shadow-sm">
                                            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Sent:</span>
                                            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{totalSentCount}</span>
                                        </div>
                                        <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-full px-4 py-1.5 flex items-center gap-2.5 whitespace-nowrap shadow-sm">
                                            <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Recv:</span>
                                            <span className="text-sm font-bold text-purple-900 dark:text-blue-100">50</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-md border bg-card overflow-hidden">
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm min-w-[900px] table-fixed">
                                                <thead>
                                                    <tr className="bg-muted/50 text-left">
                                                        <th className="p-3 font-medium w-[200px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Recipient</th>
                                                        <th className="p-3 font-medium w-[200px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Subject</th>
                                                        <th className="p-3 font-medium w-[100px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Status</th>
                                                        <th className="p-3 font-medium w-[100px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Attach</th>
                                                        <th className="p-3 font-medium w-[150px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">Sent At</th>
                                                        <th className="p-3 font-medium w-[80px] sticky top-0 z-10 bg-muted/95 backdrop-blur-sm text-right">View</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAudit.length > 0 ? (
                                                        Object.entries(groupedAudit).map(([groupName, groupLogs]) => (
                                                            <React.Fragment key={groupName}>
                                                                {groupBy !== 'none' && (
                                                                    <tr className="bg-muted/30 border-y border-slate-200">
                                                                        <td colSpan={6} className="py-2.5 px-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{groupName}</span>
                                                                                <Badge variant="outline" className="text-[10px] ml-1 bg-white border-slate-200 text-slate-500 font-bold">
                                                                                    {(groupLogs as any[]).length} {(groupLogs as any[]).length === 1 ? 'Audit' : 'Audits'}
                                                                                </Badge>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {(groupLogs as any[]).map(log => (
                                                                    <tr key={log.id} className="group border-t hover:bg-muted/30 transition-colors">
                                                                        <td className="p-3 font-medium">{log.recipient_email}</td>
                                                                        <td className="p-3 truncate max-w-[150px] text-muted-foreground">{log.subject || '(No Subject)'}</td>
                                                                        <td className="p-3">
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                                }`}>
                                                                                {log.status.toUpperCase()}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3">
                                                                            {log.attachment_count > 0 ? (
                                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground" title={log.attachment_details?.map((d: any) => `${d.name} (${Math.round(d.size / 1024)}KB)`).join(', ')}>
                                                                                    <Paperclip className="h-3.5 w-3.5 text-primary/60" />
                                                                                    <span className="font-bold">{log.attachment_count}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-muted-foreground/30 text-xs">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">
                                                                            {formatDate(log.sent_at)}
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                                                                onClick={() => { setSelectedAuditLog(log); setIsAuditViewOpen(true); }}
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">No audit logs available</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {auditTotalPages > 1 && (
                                            <div className="flex items-center justify-between py-3 px-2 sticky bottom-0 z-10 bg-card border-t mt-0">
                                                <p className="text-xs text-muted-foreground">
                                                    Showing {(auditPage - 1) * pageSize + 1} to {Math.min(auditPage * pageSize, filteredAudit.length)} of {filteredAudit.length} audits
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={auditPage === 1}
                                                        onClick={() => setAuditPage(prev => prev - 1)}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <div className="flex items-center px-4 font-medium text-xs">
                                                        Page {auditPage} of {auditTotalPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={auditPage === auditTotalPages}
                                                        onClick={() => setAuditPage(prev => prev + 1)}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Email Content Viewer Dialog */}
            <Dialog open={isAuditViewOpen} onOpenChange={setIsAuditViewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-primary/20">
                    <DialogHeader className="p-6 pb-2 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-primary" />
                                    Email Log Details
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    Viewing sent email configuration and content
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6">
                        {selectedAuditLog && (
                            <div className="space-y-6">
                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Recipient</Label>
                                        <p className="text-sm font-medium">{selectedAuditLog.recipient_email}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sent At</Label>
                                        <p className="text-sm font-medium">{formatDate(selectedAuditLog.sent_at)}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1 border-t pt-3">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</Label>
                                        <p className="text-sm font-bold text-primary">{selectedAuditLog.subject || '(No Subject)'}</p>
                                    </div>
                                </div>

                                {/* Attachments Section */}
                                {selectedAuditLog.attachment_count > 0 && (
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Paperclip className="h-3 w-3" />
                                            Attachments ({selectedAuditLog.attachment_count})
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {selectedAuditLog.attachment_details?.map((att: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 bg-muted/50 border rounded-md px-3 py-1.5 transition-hover hover:bg-muted/80">
                                                    <FileText className="h-4 w-4 text-primary/60" />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold truncate" title={att.name}>{att.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{Math.round(att.size / 1024)} KB</span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Email Content Section */}
                                <div className="space-y-2 border-t pt-4">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email Content</Label>
                                    <div className="rounded-lg border bg-muted/20 p-5 min-h-[150px] max-h-[500px] overflow-y-auto shadow-inner custom-scrollbar">
                                        {selectedAuditLog.content ? (
                                            <div
                                                className="text-sm prose prose-sm dark:prose-invert max-w-none break-all whitespace-pre-wrap overflow-visible"
                                                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                                dangerouslySetInnerHTML={{ __html: selectedAuditLog.content }}
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic text-center py-8">No content captured for this log.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Error Message if failed */}
                                {selectedAuditLog.status === 'failed' && selectedAuditLog.error_message && (
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="text-[10px] uppercase tracking-wider text-red-500 font-bold">Error Message</Label>
                                        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-4 text-xs text-red-600 dark:text-red-400 font-mono">
                                            {selectedAuditLog.error_message}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t bg-muted/20 flex justify-end">
                        <Button variant="outline" onClick={() => setIsAuditViewOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import {
    FileText,
    Search,
    ChevronDown,
    Check,
    Plus,
    Paperclip,
    Eye,
    Trash2
} from 'lucide-react';
import { LEAD_STAGES_CONFIG } from '@/lib/lead-constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EMAIL_REGEX, PHONE_REGEX } from '@/lib/constants';
import PipelineStepper from '@/components/Leads/PipelineStepper';

import { FloatingLabelTextarea, FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';

interface LeadFormData {
    id: string;
    subject: string;
    lead_name: string;
    customer_id: string;
    product_interest: string;
    email: string;
    phone_number: string;
    lead_source: string;
    lead_priority: string;
    industry: string;
    estimated_deal_value: string;
    created_date: string;
    lead_score: string;
    lead_owner_id: string;
    lead_assign_to_id: string;
    is_decision_maker: boolean;
    campaign_name: string;
    expected_close_date: string;
    last_contact_date: string;
    conversion_status: string;
    lost_reason: string;
    lead_stage: string;
    note: string;
    address: string;
    attachment_url: string | null;
    attachment_name: string | null;
}


const productInterestItems = [
    { label: "Crm", value: "Crm" },
    { label: "Grevya", value: "Grevya" },
    { label: "Other", value: "Other" },
];

const leadSourceItems = [
    { label: "Website", value: "Website" },
    { label: "Phone Call", value: "Phone Call" },
    { label: "Email", value: "Email" },
    { label: "Referral", value: "Referral" },
    { label: "Social Media", value: "Social Media" },
    { label: "Advertisement", value: "Advertisement" },
    { label: "Campaign", value: "Campaign" },
    { label: "Other", value: "Other" },
];

const priorityItems = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
];

const conversionStatusItems = [
    { label: "New / Uncontacted", value: "New / Uncontacted" },
    { label: "Contacted", value: "Contacted" },
    { label: "Qualified", value: "Qualified" },
    { label: "Opportunity", value: "Opportunity" },
    { label: "Negotiation", value: "Negotiation" },
    { label: "Converted / Won", value: "Converted / Won" },
    { label: "Lost", value: "Lost" },
    { label: "Disqualified", value: "Disqualified" },
];

const industryItems = [
    { label: "Technology", value: "Technology" },
    { label: "Manufacturing", value: "Manufacturing" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "Finance", value: "Finance" },
    { label: "Education", value: "Education" },
    { label: "Retail", value: "Retail" },
    { label: "Real Estate", value: "Real Estate" },
    { label: "Logistics", value: "Logistics" },
    { label: "Other", value: "Other" },
];

const decisionMakerItems = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
];

const campaignItems = [
    { label: "2026 – LinkedIn – Lead Gen Ads", value: "2026 – LinkedIn – Lead Gen Ads" },
    { label: "2026 – Meta – Retargeting", value: "2026 – Meta – Retargeting" },
    { label: "2026 – Email – Product Launch", value: "2026 – Email – Product Launch" },
    { label: "2026 – Webinar – Monthly Demo", value: "2026 – Webinar – Monthly Demo" },
    { label: "2026 – Event – Trade Show", value: "2026 – Event – Trade Show" },
    { label: "2026 – Partner – Referral Program", value: "2026 – Partner – Referral Program" },
    { label: "2026 – Organic – Website", value: "2026 – Organic – Website" },
    { label: "2026 – Organic – Content Marketing", value: "2026 – Organic – Content Marketing" },
];


const AddLeads = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const initialValues = location.state?.initialValues;
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [companyList, setCompanyList] = useState<any[]>([]);
    const [addressList, setAddressList] = useState<{ label: string; value: string }[]>([]);
    const [ownerList, setOwnerList] = useState<{ label: string; value: string }[]>([]);
    const [companySearch, setCompanySearch] = useState('');
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

    const handleChange = (field: keyof LeadFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const [formData, setFormData] = useState<LeadFormData>({
        id: '',
        subject: initialValues?.subject || '',
        lead_name: initialValues?.lead_name || '',
        customer_id: '',
        product_interest: initialValues?.product_interest || '',
        email: initialValues?.email || '',
        phone_number: '',
        lead_source: '',
        lead_priority: '',
        industry: '',
        estimated_deal_value: '',
        created_date: new Date().toISOString().split('T')[0],
        lead_score: '',
        lead_owner_id: '',
        lead_assign_to_id: '',
        is_decision_maker: false,
        campaign_name: '',
        expected_close_date: '',
        last_contact_date: '',
        conversion_status: 'New',
        lost_reason: '',
        lead_stage: initialValues?.lead_stage || 'Qualification',
        note: '',
        address: '',
        attachment_url: null,
        attachment_name: null,
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);


    useEffect(() => {
        const loadData = async () => {
            const { data: customers } = await supabase
                .from('customers')
                .select('id, first_name, last_name, email, phone');

            const { data: crm_customers, error: companyError } = await supabase
                .from('crm_customers')
                .select('id, name')
                .not('name', 'is', null)
                .order('name');

            if (companyError) {
                console.error('Error fetching companies:', companyError);
            }

            const { data: authUsers, error: userError } = await supabase.rpc('get_users');
            
            if (userError) {
                console.error('Error fetching users:', userError);
            } else {
                const ownerOptions = (authUsers || []).map((u: any) => ({ 
                    label: u.email, 
                    value: u.id 
                }));
                setOwnerList(ownerOptions);

                // Default to logged-in user if not in edit mode
                const { data: { user } } = await supabase.auth.getUser();
                if (!isEditMode && user) {
                    setFormData(prev => ({ ...prev, lead_owner_id: user.id }));
                }
            }

            setContacts(customers || []);
            setAddressList([]);

            const uniqueCompanies = Array.from(new Set((crm_customers || []).map(c => c.name)))
                .map(name => crm_customers?.find(c => c.name === name));
            setCompanyList(uniqueCompanies || []);

            if (isEditMode) {
                const { data: leadData, error } = await supabase
                    .from('crm_leads')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Error fetching lead:', error);
                    toast.error('Failed to load lead data');
                } else if (leadData) {
                    setFormData({
                        ...leadData,
                        estimated_deal_value: leadData.estimated_deal_value?.toString() || '',
                        lead_score: leadData.lead_score?.toString() || '',
                        created_date: leadData.created_date || '',
                        expected_close_date: leadData.expected_close_date || '',
                        last_contact_date: leadData.last_contact_date || '',
                        attachment_url: leadData.attachment_url || null,
                        attachment_name: leadData.attachment_name || null,
                    });

                    if (leadData.customer_id) {
                        fetchAddressesForCompany(leadData.customer_id);
                    }
                }
            }
        };

        loadData();
    }, [id, isEditMode]);

    const fetchAddressesForCompany = async (customerId: string) => {
        const { data: addresses, error } = await supabase
            .from('crm_addresses')
            .select('id, company_address, company_city, company_state, company_country, company_zip, billing_address, billing_city, billing_state, billing_country, billing_zip, shipping_address, shipping_city, shipping_state, shipping_country, shipping_zip')
            .eq('customer_id', customerId);

        if (error) {
            console.error('Error fetching company addresses:', error);
            return;
        }

        if (addresses && addresses.length > 0) {
            const addrOptions = addresses.flatMap(addr => {
                const options = [];
                if (addr.company_address) options.push({ label: `${addr.company_address}, ${addr.company_city} `, value: addr.company_address });
                if (addr.billing_address && addr.billing_address !== addr.company_address) options.push({ label: `Billing: ${addr.billing_address}, ${addr.billing_city} `, value: addr.billing_address });
                if (addr.shipping_address && addr.shipping_address !== addr.company_address && addr.shipping_address !== addr.billing_address) options.push({ label: `Shipping: ${addr.shipping_address}, ${addr.shipping_city} `, value: addr.shipping_address });
                return options;
            });

            setAddressList(addrOptions);

            if (addrOptions.length === 1) {
                setFormData(prev => ({ ...prev, address: addrOptions[0].value }));
            }
        } else {
            setAddressList([]);
        }
    };

    const validateForm = () => {
        const newErrors: Partial<Record<keyof LeadFormData, string>> = {};
        const requiredFields: (keyof LeadFormData)[] = ['subject', 'lead_name', 'product_interest', 'email', 'phone_number'];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = 'This field is required';
            }
        });

        if (formData.email && !EMAIL_REGEX.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone_number && !PHONE_REGEX.test(formData.phone_number)) {
            newErrors.phone_number = 'Phone number must be exactly 10 digits';
        }

        if (formData.lead_stage === 'Lost' && !formData.lost_reason) {
            newErrors.lost_reason = 'Lost reason is required';
        }

        if (formData.estimated_deal_value && isNaN(Number(formData.estimated_deal_value))) {
            newErrors.estimated_deal_value = 'Must be a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            customer_id: formData.customer_id || null,
            estimated_deal_value: formData.estimated_deal_value ? Number(formData.estimated_deal_value) : null,
            lead_score: formData.lead_score ? parseInt(formData.lead_score) : null,
            lead_owner_id: formData.lead_owner_id || null,
            lead_assign_to_id: formData.lead_assign_to_id || null,
            created_date: formData.created_date || null,
            expected_close_date: formData.expected_close_date || null,
            last_contact_date: formData.last_contact_date || null,
            attachment_url: formData.attachment_url,
            attachment_name: formData.attachment_name,
        };
        delete (payload as any).image_url;

        if (!isEditMode) {
            delete (payload as any).id;
        }

        try {
            if (isEditMode) {
                const { error } = await supabase
                    .from('crm_leads')
                    .update(payload)
                    .eq('id', id)
                    .select();

                if (error) throw error;
                toast.success('Lead updated');
            } else {
                const { error } = await supabase
                    .from('crm_leads')
                    .insert([payload])
                    .select();

                if (error) throw error;
                toast.success('Lead created');
            }
            navigate('/Leads');
        } catch (err: any) {
            console.error('Save error:', err);
            toast.error(`Failed to save lead: ${err.message || 'Unknown error'} `);
        } finally {
            setLoading(false);
        }
    };

    const handleStageClick = (stageName: string) => {
        setFormData(prev => ({ ...prev, lead_stage: stageName }));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `leads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('lead-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('lead-attachments')
                .getPublicUrl(filePath);

            handleChange('attachment_url', publicUrl);
            handleChange('attachment_name', file.name);
            toast.success('File uploaded successfully');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearAttachment = () => {
        handleChange('attachment_url', null);
        handleChange('attachment_name', null);
    };

    const handlePreview = () => {
        if (formData.attachment_url) {
            window.open(formData.attachment_url, '_blank');
        }
    };

    const currentStep = LEAD_STAGES_CONFIG.findIndex(s => s.name === formData.lead_stage);

    return (
        <div className="flex flex-col h-screen bg-background">
            <Header title={isEditMode ? 'Edit Lead' : 'Create Lead'} />
            <div className="flex-1 overflow-y-auto px-2 py-4 w-full pb-8">
                <div className="px-4 md:px-3 py-3 mb-2">
                    <PipelineStepper
                        currentStep={currentStep !== -1 ? currentStep : 0}
                        stages={LEAD_STAGES_CONFIG}
                        onStageClick={handleStageClick}
                    />
                </div>
                <Tabs defaultValue="lead-info" className="w-full">
                    <TabsList className="bg-transparent rounded-none w-full justify-start h-auto p-0 pl-1 mb-0">
                        <TabsTrigger
                            value="lead-info"
                            className="rounded-tl-lg rounded-tr-lg rounded-bl-none rounded-br-none border-t-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 text-sm font-medium transition-all bg-[#E8EAED]"
                        >
                            Lead Information
                        </TabsTrigger>
                        <TabsTrigger
                            value="live-log"
                            className="rounded-tl-lg rounded-tr-lg rounded-bl-none rounded-br-none border-t-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 text-sm font-medium transition-all text-slate-500 bg-[#E8EAED] ml-1"
                        >
                            Live Log
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="lead-info" className="m-0">
                        <Card className="p-4 border-slate-200 shadow-sm bg-white rounded-xl">
                            <div className="flex flex-col items-stretch gap-6 w-full">
                                <div>
                                    <FloatingLabelTextarea
                                        label='Subject/Title'
                                        required
                                        value={formData.subject}
                                        onChange={e => handleChange('subject', (e.target as HTMLTextAreaElement).value)}
                                        error={errors.subject}
                                    />
                                </div>
                                {/* Fields Grid */}
                                <div className="flex-1">
                                    <div className="flex justify-between w-full items-center mb-6">
                                        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            General Information
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx"
                                            />

                                            <Button
                                                variant="outline"
                                                className="text-primary border-primary hover:bg-primary/5 hover:text-primary h-9 rounded-md px-4 py-0 font-medium transition-colors flex items-center gap-2"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                <Paperclip className="h-4 w-4" />
                                                {uploading ? 'Uploading...' : 'Attachment'}
                                            </Button>

                                            {formData.attachment_name && (
                                                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-medium text-sm transition-colors shrink-0">
                                                    <FileText className="h-4 w-4 text-primary/70 shrink-0" />
                                                    <span className="max-w-[100px] truncate text-[11px]" title={formData.attachment_name}>
                                                        {formData.attachment_name}
                                                    </span>
                                                    <div className="flex items-center gap-2 ml-1 border-l border-slate-200 pl-2 text-slate-400">
                                                        <button
                                                            onClick={handlePreview}
                                                            className="hover:text-primary transition-colors"
                                                            title="Preview"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={clearAttachment}
                                                            className="hover:text-rose-500 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-x-4 gap-y-4">
                                        {/* Row 1 */}
                                        <div className="lg:col-span-3">
                                            <FloatingLabelInput label="Lead Name" required value={formData.lead_name} onChange={e => handleChange('lead_name', e.target.value)} error={errors.lead_name} />
                                        </div>
                                        <div className="lg:col-span-6">
                                            <div className="space-y-1">
                                                <Popover open={isCompanyOpen} onOpenChange={setIsCompanyOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={isCompanyOpen}
                                                            className={cn(
                                                                "w-full justify-between font-normal bg-white border-gray-300 hover:bg-white h-10 px-3",
                                                                !formData.customer_id ? "text-[#0B1A3C99]" : "text-slate-900",
                                                                errors.customer_id && "border-red-500 ring-red-500"
                                                            )}
                                                        >
                                                            {companyList.find(c => c.id === formData.customer_id)?.name || "Company Name (eg: Acme Corp)"}
                                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 bg-white border-slate-200 shadow-lg rounded-lg" align="start">
                                                        <div className="flex gap-2 mb-3">
                                                            <div className="relative flex-1">
                                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                                <Input
                                                                    placeholder="search company here..."
                                                                    value={companySearch}
                                                                    onChange={(e) => setCompanySearch(e.target.value)}
                                                                    className="pl-9 h-10 bg-white border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-300 placeholder:text-[#0B1A3C99]"
                                                                />
                                                            </div>
                                                            <Button
                                                                onClick={() => navigate('/contacts/add')}
                                                                className="bg-primary hover:bg-primary/90 text-white h-10 px-4 whitespace-nowrap"
                                                            >
                                                                <Plus size={18} />
                                                            </Button>
                                                        </div>
                                                        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                                            {companyList && companyList.length > 0 ? (
                                                                companyList
                                                                    .filter(c => c?.name && c.name.toLowerCase().includes(companySearch.toLowerCase()))
                                                                    .map((c, idx) => (
                                                                        <div
                                                                            key={c?.id || idx}
                                                                            className={cn(
                                                                                "flex items-center justify-between px-3 py-2.5 text-sm rounded-md cursor-pointer transition-colors",
                                                                                formData.customer_id === c.id ? "bg-primary/10 text-primary" : "hover:bg-slate-50 text-slate-700"
                                                                            )}
                                                                            onClick={() => {
                                                                                handleChange('customer_id', c.id);
                                                                                setIsCompanyOpen(false);
                                                                                setCompanySearch('');
                                                                                if (errors.customer_id) {
                                                                                    setErrors({ ...errors, customer_id: undefined });
                                                                                }
                                                                                fetchAddressesForCompany(c.id);
                                                                            }}
                                                                        >
                                                                            <span className="font-medium">{c.name}</span>
                                                                            {formData.customer_id === c.id && <Check className="h-4 w-4" />}
                                                                        </div>
                                                                    ))
                                                            ) : (
                                                                <div className="py-6 text-center text-sm text-slate-500">
                                                                    No companies found
                                                                </div>
                                                            )}
                                                            {companyList && companyList.filter(c => c?.name && c.name.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && companySearch && (
                                                                <div className="py-6 text-center text-sm text-slate-500">
                                                                    No matching companies found for "{companySearch}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.customer_id && <p className="text-[10px] text-red-500 mt-0.5">{errors.customer_id}</p>}
                                            </div>
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelSelect
                                                label="Address"
                                                placeholder="Address"
                                                items={addressList}
                                                value={formData.address}
                                                onValueChange={v => handleChange('address', v)}
                                                error={errors.address}
                                            />
                                        </div>

                                        {/* Row 2 */}
                                        <div className="lg:col-span-3">
                                            <FloatingLabelSelect
                                                label="Product Interest"
                                                placeholder="Product Interest"
                                                required
                                                items={productInterestItems}
                                                value={formData.product_interest}
                                                onValueChange={v => handleChange('product_interest', v)}
                                                error={errors.product_interest}
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelInput label="Email" required value={formData.email} onChange={e => handleChange('email', e.target.value)} error={errors.email} validationType="email" />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelInput label="Phone Number" type='number' required value={formData.phone_number} onChange={e => handleChange('phone_number', e.target.value)} error={errors.phone_number} validationType="phone" />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelSelect
                                                label="Lead Source"
                                                placeholder="Lead Source"
                                                items={leadSourceItems}
                                                value={formData.lead_source}
                                                onValueChange={v => handleChange('lead_source', v)}
                                                error={errors.lead_source}
                                            />
                                        </div>

                                        {/* Row 3 */}
                                        <div className="lg:col-span-3">
                                            <FloatingLabelSelect
                                                label="Lead Priority"
                                                placeholder="Lead Priority"
                                                items={priorityItems}
                                                value={formData.lead_priority}
                                                onValueChange={v => handleChange('lead_priority', v)}
                                                error={errors.lead_priority}
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelSelect label="Industry" placeholder="Select Industry" value={formData.industry} items={industryItems} onValueChange={v => handleChange('industry', v)} error={errors.industry} />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelInput label="Estimated Deal Value" type="number" value={formData.estimated_deal_value} onChange={e => handleChange('estimated_deal_value', e.target.value)} error={errors.estimated_deal_value} />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FloatingLabelInput label="Created Date" type="date" value={formData.created_date} onChange={e => handleChange('created_date', e.target.value)} error={errors.created_date} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-x-4 gap-y-4 mt-3">
                                    {/* Row 1 */}
                                    <div className="lg:col-span-3">
                                        <FloatingLabelInput label="Lead rating/score" type="text" maxLength={3} value={formData.lead_score} onChange={e => { const val = e.target.value; if (val.length <= 3) handleChange('lead_score', val); }} />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <FloatingLabelInput
                                            label="Lead Owner"
                                            placeholder="Lead Owner"
                                            value={ownerList.find(o => o.value === formData.lead_owner_id)?.label || ownerList[0]?.label || ''}
                                            disabled={true}
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <FloatingLabelSelect
                                            label="Lead Assign to"
                                            placeholder="Lead Assign to"
                                            items={ownerList}
                                            value={formData.lead_assign_to_id}
                                            onValueChange={v => handleChange('lead_assign_to_id', v)}
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <FloatingLabelSelect
                                            label="Decision maker"
                                            placeholder="Select"
                                            items={decisionMakerItems}
                                            value={formData.is_decision_maker ? "true" : "false"}
                                            onValueChange={v => handleChange('is_decision_maker', v === 'true')}
                                        />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="lg:col-span-3">
                                        <FloatingLabelSelect
                                            label="Campaign name"
                                            placeholder="Campaign name"
                                            items={campaignItems}
                                            value={formData.campaign_name}
                                            onValueChange={v => handleChange('campaign_name', v)}
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <FloatingLabelInput label="Expected close date" type="date" value={formData.expected_close_date} onChange={e => handleChange('expected_close_date', e.target.value)} />
                                    </div>

                                    <div className="lg:col-span-3">
                                        <FloatingLabelInput label="Last Contacted Date" type="date" value={formData.last_contact_date} onChange={e => handleChange('last_contact_date', e.target.value)} error={errors.last_contact_date} />
                                    </div>

                                    {/* Row 3 */}
                                    <div className="lg:col-span-3">
                                        <FloatingLabelSelect
                                            label="Conversion status"
                                            placeholder="Conversion status"
                                            items={conversionStatusItems}
                                            value={formData.conversion_status}
                                            onValueChange={v => handleChange('conversion_status', v)}
                                        />
                                    </div>
                                    {formData.lead_stage === 'Lost' && (
                                        <div className="lg:col-span-12">
                                            <FloatingLabelTextarea
                                                label="Lost Reason"
                                                required
                                                value={formData.lost_reason}
                                                onChange={e => handleChange('lost_reason', (e.target as HTMLTextAreaElement).value)}
                                                error={errors.lost_reason}
                                            />
                                        </div>
                                    )}

                                    {/* row 4 */}
                                    <div className="lg:col-span-12">
                                        <FloatingLabelTextarea
                                            label="Notes"
                                            value={formData.note}
                                            onChange={e => handleChange('note', (e.target as HTMLTextAreaElement).value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="live-log" className="m-0">
                        <Card className="p-8 border-slate-200 shadow-sm bg-white rounded-xl min-h-[400px] flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">Live Log Information</h3>
                                <p className="text-slate-500 mt-1">Activity logs and live updates will appear here.</p>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sticky Premium Footer */}
            <div className="sticky bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-4 flex justify-end gap-3 z-50">
                <Button
                    variant="outline"
                    className="w-32 h-[44px] rounded-[6px] text-[14px] font-normal font-['Instrument_Sans'] border-slate-300 hover:bg-slate-50"
                    onClick={() => navigate('/Leads')}
                >
                    Cancel
                </Button>
                <Button
                    className="w-32 h-[44px] bg-primary hover:bg-primary/90 text-white rounded-[6px] text-[14px] font-normal font-['Instrument_Sans'] shadow-sm"
                    onClick={handleSubmit}
                    disabled={loading || uploading}
                >
                    {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
                </Button>
            </div>
        </div>
    );
};



export default AddLeads;

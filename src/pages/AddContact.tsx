import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker, useParams, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandardTabs } from '@/components/layout/StandardTabs';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Camera, Plus, Trash2, FileText, Truck, BarChart3, Share2, Paperclip, Calendar, PlayCircle, Clock, AlertCircle, CheckCircle2, CalculatorIcon, ClockIcon, Upload, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EMAIL_REGEX, PHONE_REGEX } from '@/lib/constants';
import { supabase } from '@/supabase/supabaseClient';
import { CustomerFormData } from '@/types';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Country, State, City } from 'country-state-city';
import { createWorker } from 'tesseract.js';
import { ListTodo } from "lucide-react";
import ActivityPopup from '@/components/contacts/ScheduleTask';
import log from '@/utils/logger'
import Customer_Attachments from '../components/contacts/Customer_Attachments';
import { Dialog } from '@/components/ui/dialog';
import { MeetingsTab } from '@/components/meetings/MeetingsTab';
import TaskListView from '@/components/contacts/TaskListView';
import { CustomerAttachmentsTab } from '@/components/contacts/CustomerAttachmentsTab';




interface ContactPerson {
    id: number;
    name: string;
    designation: string;
    mobile: string;
    telephone: string;
    email: string;
    preferred_type: string;
    address_type: string;
}

const validateTelephone = (telephone: string) => {
    log.debug('validateTelephone called', { telephone });
    if (!telephone) return true;
    const value = telephone.trim();
    const indiaLandlineRegex = /^(?:\+91|0)?\d{2,4}\d{6,8}$/;
    if (/^(\d)\1+$/.test(value.replace(/\D/g, ''))) return false;
    return indiaLandlineRegex.test(value);
};

export default function AddContact() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isViewMode = location.pathname.includes('/view/');
    const isEditMode = !!id && !isViewMode;
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const isSubmitting = useRef(false);
    const [customerNameError, setCustomerNameError] = useState<string | null>(null);
    const [realCustomerId, setRealCustomerId] = useState<string | undefined>(id);
    const [leadCount, setLeadCount] = useState<number>(0);
    const [open, setOpen] = useState(false);
    const [taskCount, setTaskCount] = useState<number>(0);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [meetingCounts, setMeetingCounts] = useState<number>(0);
    const [attachmentCount, setAttachmentCount] = useState(0);

    const [initialFormData, setInitialFormData] = useState<CustomerFormData | null>(null);
    const [initialDetailsData, setInitialDetailsData] = useState<any>(null);
    const [initialContactPersons, setInitialContactPersons] = useState<ContactPerson[]>([]);

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isEditMode && isDirty && !isSubmitting.current && currentLocation.pathname !== nextLocation.pathname
    );

    const MAX_FILE_SIZE = 5 * 1024 * 1024

    const uploadFile = async (file: File, customerId: string) => {
        try {
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File size exceeds 5MB limit")
                return
            }
            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]

            if (!allowedTypes.includes(file.type)) {
                toast.error("Invalid file type")
                return
            }
            const fileExt = file.name.split(".").pop()
            const filePath = `${customerId}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from("Customer_attachments")
                .upload(filePath, file)

            if (uploadError) {
                toast.error(uploadError.message)
                return
            }
            const { data } = supabase.storage
                .from("Customer_attachments")
                .getPublicUrl(filePath)

            const publicUrl = data.publicUrl

            toast.success("File uploaded successfully")
            fetchAttachmentCount(customerId);
        } catch (err) {
            toast.error("Something went wrong")
        }
    }

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = e.target.files
        if (!files || !realCustomerId) return

        const uploadPromises = Array.from(files).map((file) =>
            uploadFile(file, realCustomerId)
        )
        await Promise.all(uploadPromises)
        e.target.value = ""
    }

    const fetchMeetingCounts = async (entityId: string) => {
        log.debug('fetchMeetingCounts called');
        const { count } = await supabase
            .from("crm_meetings")
            .select("*", { count: "exact", head: true })
            .eq("entity_id", entityId)
            .eq("entity_type", "customer");

        log.info('fetchMeetingCounts successful');
        setMeetingCounts(count || 0);
    };

    useEffect(() => {
        log.debug('useEffect [realCustomerId] triggered for fetchMeetingCounts');
        if (realCustomerId) {
            fetchMeetingCounts(realCustomerId);
        }
    }, [realCustomerId]);

    const fetchTasks = async (entityId: string) => {
        log.debug('fetchTasks called');
        setLoadingTasks(true);
        const { data, error } = await supabase
            .from("crm_tasks")
            .select(`
                *,
                crm_salesperson (
                    name
                )
            `)
            .eq("entity_id", entityId)
            .eq("entity_type", "customer")
            .order("due_date", { ascending: true });

        if (!error) {
            log.info('fetchTasks successful');
            const flattenedTasks = (data || []).map((task: any) => ({
                ...task,
                assigned_to_name: task.crm_salesperson?.name || null
            }));
            setTasks(flattenedTasks);
        } else {
            log.error('fetchTasks error');
        }
        setLoadingTasks(false);
    };

    useEffect(() => {
        log.debug('useEffect [realCustomerId] triggered for fetchTasks');
        if (realCustomerId) {
            fetchTasks(realCustomerId);
        }
    }, [realCustomerId]);

    const fetchTaskCount = async (entityId: string) => {
        log.debug('fetchTaskCount called');
        log.debug("fetchTaskCount Called");
        const { count, error } = await supabase
            .from("crm_tasks")
            .select("*", { count: "exact", head: true })
            .eq("entity_id", entityId)
            .eq("entity_type", "customer");

        if (!error) {
            log.info('fetchTaskCount successful');
            setTaskCount(count || 0);
        } else {
            log.error('fetchTaskCount error');
        }
    };

    useEffect(() => {
        log.debug('useEffect [realCustomerId] triggered for fetchTaskCount and realtime channel');
        if (!realCustomerId) return;
        fetchTaskCount(realCustomerId);

        const channel = supabase
            .channel("customer-task-channel")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "crm_tasks",
                    filter: `customer_id=eq.${realCustomerId}`,
                },
                () => {
                    fetchTaskCount(realCustomerId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [realCustomerId]);

    const fetchAttachmentCount = async (customerId: string) => {
        log.debug('fetchAttachmentCount called');
        const { data, error } = await supabase.storage
            .from("Customer_attachments")
            .list(customerId, {
                limit: 100,
                offset: 0,
            });

        if (!error && data) {
            log.info('fetchAttachmentCount successful');
            setAttachmentCount(data.length);
        } else {
            log.error('fetchAttachmentCount error');
        }
    };

    useEffect(() => {
        log.debug('useEffect [realCustomerId] triggered for fetchAttachmentCount');
        if (realCustomerId) {
            fetchAttachmentCount(realCustomerId);
        }
    }, [realCustomerId]);



    useEffect(() => {
        if (blocker.state === 'blocked') {

            if (!isEditMode || !isDirty) {
                blocker.proceed();
                return;
            }
            Modal.confirm({
                title: 'Unsaved changes detected',
                content: 'If you leave this page, your changes will be lost. Do you want to discard changes and continue?',
                okText: 'Discard',
                okType: 'danger',
                cancelText: 'Cancel',
                centered: true,
                onOk: () => {
                    blocker.proceed();
                },
                onCancel: () => {
                    blocker.reset();
                },
            });
        }
    }, [blocker, isEditMode, isDirty]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            log.debug('handleBeforeUnload triggered');
            if (isDirty && !isSubmitting.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        log.debug('useEffect [id] triggered for fetchContactData');
        if (isEditMode || isViewMode) {
            fetchContactData();
        }
    }, [id]);

    const fetchLeadCount = async (customerId: string) => {
        log.debug('fetchLeadCount called');
        if (!customerId) return;
        try {
            const { count, error } = await supabase
                .from('crm_leads')
                .select('*', { count: 'exact', head: true })
                .eq('customer_id', customerId)
                .or('is_deleted.eq.false,is_deleted.is.null');

            if (error) throw error;
            setLeadCount(count || 0);
        } catch (err) {
            log.error('Error fetching lead count');
        }
    };

    const fetchContactData = async () => {
        log.debug('fetchContactData called');
        try {
            setLoading(true);

            const { data: mainContact, error: mainContactError } = await supabase
                .from('crm_contacts')
                .select('*')
                .eq('id', id)
                .maybeSingle(); // the id may be a customer id instead of a contact id

            if (mainContactError || !mainContact) {
                const { data: customerOnly, error: custOnlyError } = await supabase
                    .from('crm_customers')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (custOnlyError) throw custOnlyError;

                const { data: relatedContacts } = await supabase
                    .from('crm_contacts')
                    .select('*')
                    .eq('customer_id', id);

                const primaryContact = relatedContacts?.[0];

                const newFormData = {
                    first_name: customerOnly.name || '',
                    last_name: '',
                    email: primaryContact?.email || '',
                    phone: primaryContact?.mobile_no || '',
                    job_title: primaryContact?.designation || '',
                    account_id: '',
                    secondary_email: '',
                    street: '',
                    street2: '',
                    city: '',
                    state: '',
                    country: '',
                    zip: '',
                    contact_type: customerOnly.customer_type || 'Prospect',
                    preferred_comm: primaryContact?.preferred_type || 'Email',
                    sales_owner_id: customerOnly.sales_person_id || '',
                    source: customerOnly.lead_source || '',
                    linkedin_url: customerOnly.linkedin_url || '',
                    notes: '',
                    marketing_opt_in: false,
                    status: customerOnly.account_status || 'active'
                };
                setFormData(newFormData);
                setInitialFormData(newFormData);
                setRealCustomerId(id);
                fetchLeadCount(id);
                populateCustomerDetails(customerOnly, id);
            } else {
                const { data: customer, error: customerError } = await supabase
                    .from('crm_customers')
                    .select('*')
                    .eq('id', mainContact.customer_id)
                    .single();

                if (customerError) throw customerError;

                const newFormData = {
                    first_name: customer.name || '',
                    last_name: '',
                    email: mainContact.email || '',
                    phone: mainContact.mobile_no || '',
                    job_title: mainContact.designation || '',
                    account_id: '',
                    secondary_email: '',
                    street: '',
                    street2: '',
                    city: '',
                    state: '',
                    country: '',
                    zip: '',
                    contact_type: customer.customer_type || 'Prospect',
                    preferred_comm: mainContact.preferred_type || 'Email',
                    sales_owner_id: customer.sales_person_id || '',
                    source: customer.lead_source || '',
                    linkedin_url: customer.linkedin_url || '',
                    notes: '',
                    marketing_opt_in: false,
                    status: customer.account_status || 'active'
                };
                setFormData(newFormData);
                setInitialFormData(newFormData);
                setRealCustomerId(mainContact.customer_id);
                fetchLeadCount(mainContact.customer_id);
                populateCustomerDetails(customer, mainContact.customer_id);
            }
        } catch (error: any) {
            toast.error("Failed to fetch customer data");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        log.debug('resetForm called');
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            job_title: '',
            account_id: '',
            secondary_email: '',
            street: '',
            street2: '',
            city: '',
            state: '',
            country: '',
            zip: '',
            contact_type: 'Prospect',
            preferred_comm: 'Email',
            sales_owner_id: '',
            status: 'active',
            linkedin_url: '',
            notes: '',
            marketing_opt_in: false,
            source: '',
        });
        setDetailsData({
            website: '',
            industry: '',
            gst_details: '',
            credit_limit: '',
            payment_terms: '',
            multi_currency: '',
            annual_revenue: '',
            sales_owner: '',
            priority: '',
            probability: '',
        });
        setShippingAddress({
            street: '',
            street2: '',
            city: '',
            state: '',
            country: '',
            zip: ''
        });
        setBillingAddress({
            street: '',
            street2: '',
            city: '',
            state: '',
            country: '',
            zip: ''
        });
        setIsShippingSameAsBilling(false);
        setContactPersons([
            { id: 1, name: '', designation: '', mobile: '', telephone: '', email: '', preferred_type: 'Email', address_type: 'Billing' }
        ]);
        setSocialFields([]);
        setProfileImage(null);
        setProfileFile(null);
        setScannedCardFile(null);
        setScannedCardUrl(null);

        setIsDirty(false);
        setRealCustomerId(undefined);
        setInitialFormData(null);
        setInitialDetailsData(null);
        setInitialContactPersons([]);
    };

    const populateCustomerDetails = async (customer: any, customerId: string) => {
        log.debug('populateCustomerDetails called');
        const newDetailsData = {
            website: customer.website_link || '',
            industry: customer.industry || '',
            gst_details: customer.gst_details || '',
            credit_limit: customer.credit_limit?.toString() || '',
            payment_terms: customer.payment_terms || '',
            multi_currency: customer.is_multi_currency ? 'Yes' : 'No',
            annual_revenue: customer.annual_revenue?.toString() || '',
            sales_owner: '',
            priority: customer.priority || '',
            probability: customer.engagement_probability?.toString() || '',
        };
        setDetailsData(newDetailsData);
        setInitialDetailsData(newDetailsData);

        setProfileImage(customer.profile_image_url || null);
        setOriginalProfileImageUrl(customer.profile_image_url || null);
        setScannedCardUrl(customer.scanned_card_url || null);
        setOriginalScannedCardUrl(customer.scanned_card_url || null);

        const { data: addresses } = await supabase
            .from('crm_addresses')
            .select('*')
            .eq('customer_id', customerId);

        if (addresses && addresses.length > 0) {
            const addr = addresses[0];

            const splitAddress = (combined: string | null) => {
                log.debug('splitAddress called', { combined });
                if (!combined) return { street: '', street2: '' };
                const parts = combined.split('\n');
                return {
                    street: parts[0] || '',
                    street2: parts.slice(1).join('\n') || ''
                };
            };

            const company = splitAddress(addr.company_address);
            setFormData(prev => {
                const updated = {
                    ...prev,
                    street: company.street,
                    street2: company.street2,
                    city: addr.company_city || '',
                    state: addr.company_state || '',
                    country: addr.company_country || '',
                    zip: addr.company_zip || ''
                };
                setInitialFormData(updated);
                return updated;
            });

            const billing = splitAddress(addr.billing_address);
            setBillingAddress({
                street: billing.street,
                street2: billing.street2,
                city: addr.billing_city || '',
                state: addr.billing_state || '',
                country: addr.billing_country || '',
                zip: addr.billing_zip || ''
            });

            const shipping = splitAddress(addr.shipping_address);
            setShippingAddress({
                street: shipping.street,
                street2: shipping.street2,
                city: addr.shipping_city || '',
                state: addr.shipping_state || '',
                country: addr.shipping_country || '',
                zip: addr.shipping_zip || ''
            });
        }


        const { data: contacts } = await supabase
            .from('crm_contacts')
            .select('*')
            .eq('customer_id', customerId);

        if (contacts && contacts.length > 0) {
            const mappedContacts = contacts.map((c: any) => ({
                id: c.id,
                name: c.name || '',
                designation: c.designation || '',
                mobile: c.mobile_no || '',
                telephone: c.telephone || '',
                email: c.email || '',
                preferred_type: c.preferred_type || 'Email',
                address_type: c.address_type || 'Billing'
            }));
            setContactPersons(mappedContacts);
            setInitialContactPersons(mappedContacts);
        }
    };

    const [countries, setCountries] = useState<{ label: string; value: string }[]>([]);
    const [states, setStates] = useState<{ label: string; value: string }[]>([]);
    const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
    const [shippingStates, setShippingStates] = useState<{ label: string; value: string }[]>([]);
    const [shippingCities, setShippingCities] = useState<{ label: string; value: string }[]>([]);

    const [formData, setFormData] = useState<CustomerFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        account_id: '',
        secondary_email: '',
        street: '',
        street2: '',
        city: '',
        state: '',
        country: '',
        zip: '',
        contact_type: '',
        preferred_comm: 'Email',
        sales_owner_id: '',
        status: 'active',
        linkedin_url: '',
        notes: '',
        marketing_opt_in: false,
        source: '',
    });




    const [detailsData, setDetailsData] = useState({
        website: '',
        industry: '',
        gst_details: '',
        credit_limit: '',
        payment_terms: '',
        multi_currency: '',
        annual_revenue: '',
        sales_owner: '',
        priority: '',
        probability: '',
    });

    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        street2: '',
        city: '',
        state: '',
        country: '',
        zip: ''
    });

    const [billingAddress, setBillingAddress] = useState({
        street: '',
        street2: '',
        city: '',
        state: '',
        country: '',
        zip: ''
    });

    const [isShippingSameAsBilling, setIsShippingSameAsBilling] = useState(false);

    const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
        { id: 1, name: '', designation: '', mobile: '', telephone: '', email: '', preferred_type: 'Email', address_type: 'Billing' }
    ]);
    const [contactPersonErrors, setContactPersonErrors] = useState<Record<number, any>>({});
    const [socialFields, setSocialFields] = useState<{ id: number, value: string }[]>([]);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [originalProfileImageUrl, setOriginalProfileImageUrl] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [scannedCardFile, setScannedCardFile] = useState<File | null>(null);
    const [scannedCardUrl, setScannedCardUrl] = useState<string | null>(null);
    const [originalScannedCardUrl, setOriginalScannedCardUrl] = useState<string | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const cardInputRef = useRef<HTMLInputElement>(null);
    const dropDownRef = useRef<HTMLDivElement>(null);
    const [companyResults, setCompanyResults] = useState<any[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const companySearchRef = useRef<HTMLDivElement>(null)

    // Close the company suggestions on outside click or Escape.
    useEffect(() => {
        if (!showDropdown) return;
        const onMouseDown = (e: MouseEvent) => {
            if (companySearchRef.current && !companySearchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowDropdown(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [showDropdown]);


    const fetchCompanies = async (query: string) => {
        log.debug('fetchCompanies called', { query });
        if (query.length < 2) {
            log.warn('fetchCompanies: query too short', { query });
            return [];
        }

        const res = await fetch(
            `${import.meta.env.VITE_PDL_API}?field=company&text=${encodeURIComponent(
                query
            )}&size=5`,
            {
                headers: {
                    "x-api-key": import.meta.env.VITE_PDL_API_KEY,
                },
            }
        );

        if (!res.ok) {
            console.error("PDL error:", res.status);
            return [];
        }

        const data = await res.json();
        return data.data || [];
    };

    const handleCompanySearch = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        log.debug('handleCompanySearch triggered');
        const value = e.target.value;
        setFormData({ ...formData, first_name: value })
        if (customerNameError) setCustomerNameError(null);
        if (value.length < 2) {
            setCompanyResults([])
            setShowDropdown(false)
            return;
        }
        const results = await fetchCompanies(value);
        setCompanyResults(results);
        setShowDropdown(true);
    }

    const handleSelectCompany = async (item: any) => {
        log.debug('handleSelectCompany called');
        const meta = item.meta || {};
        const selectedName = meta.display_name || item.name || formData.first_name;
        try {
            const { data, error } = await supabase
                .from('crm_customers')
                .select('id')
                .eq('name', selectedName)
                .maybeSingle();

            if (error) throw error;

            if (data && (!isEditMode || data.id !== id)) {
                setCustomerNameError("Customer name already exists");
                Modal.error({
                    title: 'Duplicate Name',
                    content: `A customer or company named "${selectedName}" already exists in your database. Please use a unique name.`,
                    okText: 'OK',
                });
                setShowDropdown(false);
                return;
            }
        } catch (err) {
            console.error('Error checking duplicate during selection:', err);
        }

        let newFormData = { ...formData };
        let newDetailsData = { ...detailsData };

        newFormData.first_name = selectedName;
        newFormData.linkedin_url = meta.linkedin_slug ? `https://www.linkedin.com/company/${meta.linkedin_slug}` : newFormData.linkedin_url;
        newFormData.street = meta.location_name || newFormData.street;
        newFormData.contact_type = 'Company';

        newDetailsData.industry = meta.industry || newDetailsData.industry;
        newDetailsData.website = meta.website || newDetailsData.website;

        if (meta.location_name) {
            const parts = meta.location_name.split(',').map((p: string) => p.trim().toLowerCase());
            const allCountries = Country.getAllCountries();
            const matchedCountry = allCountries.find(c => parts.includes(c.name.toLowerCase()));

            if (matchedCountry) {
                newFormData.country = matchedCountry.isoCode;
                const stateList = State.getStatesOfCountry(matchedCountry.isoCode).map(state => ({
                    label: state.name,
                    value: state.isoCode
                }));
                setStates(stateList);

                const allStates = State.getStatesOfCountry(matchedCountry.isoCode);
                const matchedState = allStates.find(s => parts.includes(s.name.toLowerCase()));

                if (matchedState) {
                    newFormData.state = matchedState.isoCode;
                    const cityList = City.getCitiesOfState(matchedCountry.isoCode, matchedState.isoCode).map(city => ({
                        label: city.name,
                        value: city.name
                    }));
                    setCities(cityList);

                    const matchedCity = City.getCitiesOfState(matchedCountry.isoCode, matchedState.isoCode).find(c => parts.includes(c.name.toLowerCase()));
                    if (matchedCity) {
                        newFormData.city = matchedCity.name;
                    } else if (parts.length > 0) {
                        newFormData.city = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                    }
                }
            }
        }

        setFormData(newFormData);
        setDetailsData(newDetailsData);
        setShowDropdown(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            log.debug('handleClickOutside triggered');
            if (dropDownRef.current && !dropDownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const getStoragePathFromUrl = (url: string, bucket: string) => {
        log.debug('getStoragePathFromUrl called');
        if (!url || typeof url !== 'string') return null;
        try {
            const cleanUrl = url.split('?')[0];
            const searchStr = `/public/${bucket}/`;
            const index = cleanUrl.indexOf(searchStr);
            if (index !== -1) {
                const path = cleanUrl.substring(index + searchStr.length);
                return decodeURIComponent(path);
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        if (isEditMode && initialFormData && initialDetailsData) {
            // Compare with initial data in edit mode
            const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
            const isDetailsDirty = JSON.stringify(detailsData) !== JSON.stringify(initialDetailsData);
            const isContactsDirty = JSON.stringify(contactPersons) !== JSON.stringify(initialContactPersons);

            setIsDirty(isFormDirty || isDetailsDirty || isContactsDirty);
        } else if (!isEditMode && !isViewMode) {
            // In creation mode, any non-empty field counts as dirty
            const hasChanges = formData.first_name !== '' ||
                formData.email !== '' ||
                formData.phone !== '' ||
                formData.street !== '' ||
                formData.city !== '' ||
                formData.state !== '' ||
                formData.country !== '' ||
                formData.zip !== '' ||
                formData.linkedin_url !== '' ||
                formData.notes !== '' ||
                formData.source !== '' ||
                detailsData.website !== '' ||
                detailsData.industry !== '' ||
                detailsData.gst_details !== '' ||
                detailsData.credit_limit !== '' ||
                detailsData.payment_terms !== '' ||
                detailsData.annual_revenue !== '' ||
                shippingAddress.street !== '' ||
                shippingAddress.city !== '' ||
                shippingAddress.state !== '' ||
                shippingAddress.country !== '' ||
                shippingAddress.zip !== '' ||
                billingAddress.street !== '' ||
                billingAddress.city !== '' ||
                billingAddress.state !== '' ||
                billingAddress.country !== '' ||
                billingAddress.zip !== '' ||
                contactPersons.some(p => p.name !== '' || p.email !== '' || p.mobile !== '') ||
                profileImage !== null ||
                socialFields.length > 0;

            setIsDirty(hasChanges);
        } else {
            setIsDirty(false);
        }
    }, [formData, detailsData, shippingAddress, contactPersons, profileImage, socialFields, isEditMode, isViewMode, initialFormData, initialDetailsData, initialContactPersons]);

    useEffect(() => {
        const countryList = Country.getAllCountries().map(country => ({
            label: country.name,
            value: country.isoCode,
        }));
        setCountries(countryList);
    }, []);


    const handleCountryChange = (countryCode: string) => {
        log.debug('handleCountryChange called');
        setFormData(prev => ({ ...prev, country: countryCode, state: '', city: '' }));
        const stateList = State.getStatesOfCountry(countryCode).map(state => ({
            label: state.name,
            value: state.isoCode
        }));
        setStates(stateList);
        setCities([]);
    };

    const handleStateChange = (stateCode: string) => {
        log.debug('handleStateChange called');
        setFormData(prev => ({ ...prev, state: stateCode, city: '' }));
        const cityList = City.getCitiesOfState(formData.country, stateCode).map(city => ({
            label: city.name,
            value: city.name
        }));
        setCities(cityList);
    };


    const handleShippingCountryChange = (countryCode: string) => {
        log.debug('handleShippingCountryChange called');
        setShippingAddress(prev => ({ ...prev, country: countryCode, state: '', city: '' }));
        const stateList = State.getStatesOfCountry(countryCode).map(state => ({
            label: state.name,
            value: state.isoCode
        }));
        setShippingStates(stateList);
        setShippingCities([]);
    };

    const handleShippingStateChange = (stateCode: string) => {
        log.debug('handleShippingStateChange called');
        setShippingAddress(prev => ({ ...prev, state: stateCode, city: '' }));
        const cityList = City.getCitiesOfState(shippingAddress.country, stateCode).map(city => ({
            label: city.name,
            value: city.name
        }));
        setShippingCities(cityList);
    };

    const handleBillingCountryChange = (countryCode: string) => {
        log.debug('handleBillingCountryChange called');
        setBillingAddress(prev => ({ ...prev, country: countryCode, state: '', city: '' }));
    };

    const handleBillingStateChange = (stateCode: string) => {
        log.debug('handleBillingStateChange called');
        setBillingAddress(prev => ({ ...prev, state: stateCode, city: '' }));
    };


    useEffect(() => {
        if (isShippingSameAsBilling) {
            log.debug('useEffect [isShippingSameAsBilling, billingAddress] syncing shipping to billing');
            setShippingAddress({
                ...billingAddress
            });
        }
    }, [isShippingSameAsBilling, billingAddress]);

    const addContactPerson = () => {
        log.debug('addContactPerson called');
        setContactPersons([...contactPersons, {
            id: Date.now(),
            name: '',
            designation: '',
            mobile: '',
            telephone: '',
            email: '',
            preferred_type: 'Email',
            address_type: 'Billing'
        }]);
    };

    const removeContactPerson = (id: number) => {
        log.debug('removeContactPerson called');
        if (contactPersons.length > 1) {
            setContactPersons(contactPersons.filter(cp => cp.id !== id));
            setContactPersonErrors(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        }
    };

    const updateContactPerson = (id: number, field: keyof ContactPerson, value: string) => {
        log.debug('updateContactPerson called');
        let newValue = value;
        if (field === 'mobile' || field === 'telephone') {
            newValue = value.replace(/\D/g, '').slice(0, field === 'mobile' ? 10 : 12);
        }

        setContactPersons(contactPersons.map(cp => cp.id === id ? { ...cp, [field]: newValue } : cp));

        if (field === 'email') {
            setContactPersonErrors(prev => ({
                ...prev,
                [id]: {
                    ...(prev[id] || {}),
                }
            }));
        } else if (field === 'mobile') {
            setContactPersonErrors(prev => ({
                ...prev,
                [id]: {
                    ...(prev[id] || {}),
                }
            }));
        } else if (field === 'telephone') {
            const isValid = validateTelephone(newValue);
            setContactPersonErrors(prev => ({
                ...prev,
                [id]: {
                    ...(prev[id] || {}),
                    telephoneInvalid: !!newValue && !isValid,
                    telephoneValid: !!newValue && isValid
                }
            }));
        }
    };

    const addSocialField = () => {
        log.debug('addSocialField called');
        setSocialFields([...socialFields, { id: Date.now(), value: '' }]);
    };

    const updateSocialField = (id: number, value: string) => {
        log.debug('updateSocialField called');
        setSocialFields(socialFields.map(field => field.id === id ? { ...field, value } : field));
    };




    const handleBusinessCardClick = () => {
        log.debug('handleBusinessCardClick triggered');
        cardInputRef.current?.click();
    };

    const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        log.debug('handleProfilePhotoChange triggered');
        const file = event.target.files?.[0];
        if (!file) return;

        setProfileFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            log.debug('Profile photo reader onload triggered');
            setProfileImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        if (profileInputRef.current) profileInputRef.current.value = '';
    };

    const handleCardScanChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        log.debug('handleCardScanChange triggered');
        const files = Array.from(event.target.files || []).slice(0, 5);
        if (files.length === 0) return;

        setOcrLoading(true);
        toast.info(files.length > 1 ? `Scanning ${files.length} business cards...` : 'Scanning business card...', {
            description: 'Analyzing card details, please wait.',
            duration: 3000
        });

        try {
            const worker = await createWorker('eng');
            const allExtractedContacts: any[] = [];
            let commonCompanyName = '';
            let differentCompaniesFound = false;

            for (const file of files) {
                const ret = await worker.recognize(file);
                const extractedText = ret.data.text.replace(/\|/g, 'I');
                const lines = extractedText.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 2);

                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
                const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g;
                const websiteRegex = /(www\.|https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

                let extractedData = {
                    companyName: '',
                    personName: '',
                    designation: '',
                    email: '',
                    phone: '',
                    pincode: '',
                    website: '',
                    addressLine1: '',
                    rawText: extractedText
                };

                const designationKeywords = ['manager', 'director', 'ceo', 'founder', 'president', 'vp', 'executive', 'engineer', 'lead', 'associate', 'consultant', 'partner', 'agent', 'specialist', 'officer', 'analyst', 'principal'];
                const companyKeywords = ['pvt', 'ltd', 'limited', 'inc', 'corp', 'solutions', 'technologies', 'group', 'services', 'enterprises', 'llp', 'company', 'systems', 'industries', 'global'];
                const addressKeywords = ['road', 'street', 'nagar', 'floor', 'building', 'plot', 'area', 'opposite', 'near', 'rd', 'st', 'lane', 'avenue', 'block', 'sector', 'complex', 'colony'];

                const hasKeyword = (text: string, keywords: string[]) => {
                    log.debug('hasKeyword called');
                    const lowerText = text.toLowerCase();
                    return keywords.some(key => {
                        const regex = new RegExp(`\\b${key}(\\.|\\b)`, 'i');
                        return regex.test(lowerText);
                    });
                };

                let addressLines: string[] = [];

                lines.forEach((line) => {
                    const lowerLine = line.toLowerCase();

                    if (!extractedData.email) {
                        const emailMatch = line.match(emailRegex);
                        if (emailMatch) extractedData.email = emailMatch[0];
                    }

                    const phoneMatch = line.match(phoneRegex);
                    if (phoneMatch && !extractedData.phone) {
                        extractedData.phone = phoneMatch[0].replace(/[^\d+]/g, '');
                    }

                    const zipMatch = line.match(/\b\d{5,6}\b/);
                    if (!extractedData.pincode && zipMatch) extractedData.pincode = zipMatch[0];

                    if (!extractedData.website && (websiteRegex.test(line) || lowerLine.includes('www.') || lowerLine.includes('.com') || lowerLine.includes('.in'))) {
                        const match = line.match(websiteRegex);
                        extractedData.website = match ? match[0] : (line.includes(' ') ? '' : line);
                    }

                    if (!extractedData.designation && hasKeyword(line, designationKeywords)) {
                        extractedData.designation = line;
                    }

                    // Address detection (exclude phone/email/website matches)
                    const isPhoneLine = phoneRegex.test(line);
                    const isEmailLine = emailRegex.test(line);
                    const isWebsiteLine = websiteRegex.test(line) || lowerLine.includes('www.') || lowerLine.includes('.com');

                    if (!isPhoneLine && !isEmailLine && !isWebsiteLine) {
                        if (hasKeyword(line, addressKeywords) || (addressLines.length > 0 && line.includes(',')) || /^\d+\/\d+|\d+-\d+/.test(line)) {
                            addressLines.push(line);
                        }
                    }
                });

                if (addressLines.length > 0) extractedData.addressLine1 = addressLines.join(', ').replace(/, ,/g, ',');

                const potentialNames = lines.filter(line =>
                    !emailRegex.test(line) && !phoneRegex.test(line) && !websiteRegex.test(line) &&
                    !line.match(/\b\d{5,6}\b/) && !hasKeyword(line, designationKeywords) &&
                    !hasKeyword(line, addressKeywords) && !addressLines.includes(line) &&
                    !/^\+?\d+$/.test(line.replace(/\s/g, ''))
                );

                if (potentialNames.length > 0) {
                    const companyMatchIdx = potentialNames.findIndex(line => hasKeyword(line, companyKeywords));
                    if (companyMatchIdx !== -1) {
                        extractedData.companyName = potentialNames[companyMatchIdx];
                        const otherNames = potentialNames.filter((_, idx) => idx !== companyMatchIdx);
                        if (otherNames.length > 0) extractedData.personName = otherNames[0];
                    } else {
                        extractedData.personName = potentialNames[0];
                        if (potentialNames.length > 1) extractedData.companyName = potentialNames[1];
                    }
                }

                // Check company name consistency
                const normalizedCoName = extractedData.companyName.trim().toLowerCase();
                if (normalizedCoName) {
                    if (!commonCompanyName) {
                        commonCompanyName = extractedData.companyName;
                    } else {
                        const currentCo = commonCompanyName.trim().toLowerCase();
                        const isSimilar = currentCo.includes(normalizedCoName) ||
                            normalizedCoName.includes(currentCo) ||
                            (currentCo.substring(0, 5) === normalizedCoName.substring(0, 5) && currentCo.length > 5);

                        if (!isSimilar) {
                            differentCompaniesFound = true;
                        }
                    }
                }

                allExtractedContacts.push(extractedData);
            }

            await worker.terminate();

            if (differentCompaniesFound) {
                toast.error('Different company name cards found. Please upload valid documents.');
                return;
            }

            // Populate Main Form (from first card or combined)
            const firstCard = allExtractedContacts[0];
            setFormData(prev => ({
                ...prev,
                first_name: commonCompanyName || firstCard.personName || prev.first_name,
                street: firstCard.addressLine1 || prev.street,
                zip: firstCard.pincode || prev.zip,
                notes: prev.notes + allExtractedContacts.map(c => `\n\n--- Scanned Card (${new Date().toLocaleString()}) ---\n${c.rawText}`).join('')
            }));

            setDetailsData(prev => ({
                ...prev,
                website: firstCard.website || prev.website
            }));

            // Populate Contact Persons
            setContactPersons(prev => {
                const existing = prev.filter(p => p.name || p.email || p.mobile);
                const newContacts = allExtractedContacts.map((c, idx) => ({
                    id: Date.now() + idx,
                    name: c.personName || '',
                    designation: c.designation || '',
                    mobile: c.phone || '',
                    telephone: '',
                    email: c.email || '',
                    preferred_type: 'Email',
                    address_type: 'Billing'
                }));

                // If the first item in prev was empty, replace it
                if (prev.length === 1 && !prev[0].name && !prev[0].email) {
                    return newContacts;
                }
                return [...prev, ...newContacts];
            });

            log.info(`${files.length} business card(s) scanned successfully`);
            toast.success(`${files.length} business card(s) scanned successfully`, {
                description: 'Fields have been auto-populated with improved accuracy.'
            });

        } catch (error) {
            log.error('OCR Error:');
            toast.error('Failed to scan business card(s)', {
                description: 'Could not extract text from the images.'
            });
        } finally {
            setOcrLoading(false);
            if (cardInputRef.current) cardInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        log.info('handleSave initiated');
        isSubmitting.current = true;
        setLoading(true);
        try {
            if (!formData.first_name?.trim()) {
                log.warn('handleSave: Company / Individual Name is missing');
                toast.error("Company / Individual Name is required");
                setLoading(false);
                return;
            }
            if (!formData.contact_type) {
                log.warn('handleSave: Contact Type is missing');
                toast.error("Contact Type is required");
                setLoading(false);
                return;
            }

            if (!formData.street?.trim()) { toast.error("Address Line 1 (Top) is required"); setLoading(false); return; }
            if (!formData.country) { toast.error("Country (Top) is required"); setLoading(false); return; }
            if (!formData.state) { toast.error("State (Top) is required"); setLoading(false); return; }
            if (!formData.city) { toast.error("City (Top) is required"); setLoading(false); return; }
            if (!formData.zip?.trim()) { toast.error("Pincode (Top) is required"); setLoading(false); return; }

            if (!detailsData.priority) { toast.error("Priority is required"); setLoading(false); return; }





            if (formData.secondary_email && !EMAIL_REGEX.test(formData.secondary_email)) {
                toast.error("Invalid Secondary Email Address");
                setLoading(false);
                return;
            }

            if (formData.phone && !PHONE_REGEX.test(formData.phone)) {
                log.warn('handleSave: Invalid phone number format');
                toast.error("Phone number must be at least 10 digits");
                setLoading(false);
                return;
            }

            for (const person of contactPersons) {
                if (!person.name?.trim()) { toast.error("Contact person name is required"); setLoading(false); return; }
                if (!person.designation?.trim()) { toast.error(`Designation is required for ${person.name || 'contact'}`); setLoading(false); return; }
                if (!person.mobile?.trim()) { toast.error(`Mobile no is required for ${person.name || 'contact'}`); setLoading(false); return; }
                if (!person.email?.trim()) { toast.error(`Email address is required for ${person.name || 'contact'}`); setLoading(false); return; }
                if (!person.preferred_type) { toast.error(`Preferred Type is required for ${person.name || 'contact'}`); setLoading(false); return; }
                if (!person.address_type) { toast.error(`Address Type is required for ${person.name || 'contact'}`); setLoading(false); return; }

                if (person.email && !EMAIL_REGEX.test(person.email)) {
                    toast.error(`Invalid email for contact person: ${person.name}`);
                    setLoading(false);
                    return;
                }
                if (person.mobile && !PHONE_REGEX.test(person.mobile)) {
                    toast.error(`Invalid mobile for contact person: ${person.name}`);
                    setLoading(false);
                    return;
                }
            }

            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

            if (detailsData.website && !urlRegex.test(detailsData.website)) {
                toast.error("Invalid Website URL");
                setLoading(false);
                return;
            }

            if (formData.linkedin_url && !urlRegex.test(formData.linkedin_url)) {
                toast.error("Invalid LinkedIn URL");
                setLoading(false);
                return;
            }

            for (const field of socialFields) {
                if (field.value && !urlRegex.test(field.value)) {
                    toast.error("Invalid Social Media URL");
                    setLoading(false);
                    return;
                }
            }


            let finalProfileImageUrl = profileImage;
            let finalScannedCardUrl = scannedCardUrl;

            if (profileFile) {
                if (originalProfileImageUrl) {
                    const oldPath = getStoragePathFromUrl(originalProfileImageUrl, 'profile-images');
                    if (oldPath) {
                        await supabase.storage.from('profile-images').remove([oldPath]);
                    }
                }

                const fileExt = profileFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('profile-images')
                    .upload(fileName, profileFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-images')
                    .getPublicUrl(fileName);

                finalProfileImageUrl = publicUrl;
            }

            if (scannedCardFile) {
                if (originalScannedCardUrl) {
                    const oldPath = getStoragePathFromUrl(originalScannedCardUrl, 'scanned-cards');
                    if (oldPath) {
                        await supabase.storage.from('scanned-cards').remove([oldPath]);
                    }
                }

                const fileExt = scannedCardFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('scanned-cards')
                    .upload(fileName, scannedCardFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('scanned-cards')
                    .getPublicUrl(fileName);

                finalScannedCardUrl = publicUrl;
            }

            const customerPayload = {
                name: formData.first_name,
                customer_type: formData.contact_type,
                profile_image_url: finalProfileImageUrl,
                scanned_card_url: finalScannedCardUrl,
                website_link: detailsData.website,
                industry: detailsData.industry,
                gst_details: detailsData.gst_details,
                credit_limit: detailsData.credit_limit ? parseFloat(detailsData.credit_limit) : null,
                payment_terms: detailsData.payment_terms,
                is_multi_currency: detailsData.multi_currency === 'Yes',
                linkedin_url: formData.linkedin_url,
                annual_revenue: detailsData.annual_revenue ? parseFloat(detailsData.annual_revenue) : null,
                sales_person_id: formData.sales_owner_id || null,
                lead_source: formData.source,
                priority: detailsData.priority,
                engagement_probability: detailsData.probability ? parseInt(detailsData.probability) : null,
                account_status: formData.status || 'active'
            };

            let currentCustomerId = realCustomerId;

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('crm_customers')
                    .update(customerPayload)
                    .eq('id', realCustomerId);

                if (updateError) throw updateError;
            } else {
                const { data: customerData, error: customerError } = await supabase
                    .from('crm_customers')
                    .insert([customerPayload])
                    .select()
                    .single();

                if (customerError) {
                    if (customerError.code === '23505') {
                        // setCustomerNameError("Customer name already exists");
                        log.warn('handleSave: Duplicate customer name encountered');
                        Modal.error({
                            title: 'Duplicate Name',
                            content: 'A customer or company with this name already exists. Please use a unique name.',
                            okText: 'OK',
                        });
                        setLoading(false);
                        return;
                    }
                    throw customerError;
                }
                currentCustomerId = customerData.id;
            }


            const combineStreet = (s1: string, s2: string) => {
                log.debug('combineStreet called');
                if (!s1 && !s2) return null;
                return s2 ? `${s1}\n${s2}` : s1;
            };

            const addressData = {
                customer_id: currentCustomerId,
                company_address: combineStreet(formData.street, formData.street2),
                company_city: formData.city,
                company_state: formData.state,
                company_country: formData.country,
                company_zip: formData.zip,
                billing_address: combineStreet(billingAddress.street, billingAddress.street2),
                billing_city: billingAddress.city,
                billing_state: billingAddress.state,
                billing_country: billingAddress.country,
                billing_zip: billingAddress.zip,
                shipping_address: combineStreet(shippingAddress.street, shippingAddress.street2),
                shipping_city: shippingAddress.city,
                shipping_state: shippingAddress.state,
                shipping_country: shippingAddress.country,
                shipping_zip: shippingAddress.zip
            };

            const { error: addressError } = await supabase
                .from('crm_addresses')
                .upsert([addressData], { onConflict: 'customer_id' });

            if (addressError) throw addressError;




            const allContacts = contactPersons
                .filter(p => p.name.trim() !== '')
                .map(person => ({
                    customer_id: currentCustomerId,
                    name: person.name,
                    designation: person.designation,
                    mobile_no: person.mobile,
                    telephone: person.telephone,
                    email: person.email,
                    preferred_type: person.preferred_type,
                    address_type: person.address_type
                }));

            if (isEditMode) {
                await supabase.from('crm_contacts').delete().eq('customer_id', currentCustomerId);
            }

            if (allContacts.length > 0) {
                const { error: contactError } = await supabase
                    .from('crm_contacts')
                    .insert(allContacts);
                if (contactError) throw contactError;
            }

            log.info('handleSave successful');
            toast.success("Customer saved successfully");
            resetForm();
            // navigate('/contacts');
        } catch (error: any) {
            log.error('handleSave unexpected error');
            toast.error(error.message || "Failed to save customer");
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <TooltipProvider>
            <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
                <Header
                    title={isViewMode ? (formData.first_name || "View Customer") : (isEditMode ? "Edit Customer" : "New Customer")}
                    isSticky={false}
                    breadcrumbAction={
                        <div className="flex items-center gap-1">
                            {isViewMode && (
                                <>
                                    <div className="relative">
                                        <Button
                                            size="icon"
                                            title="Task"
                                            onClick={() => setOpen(true)}
                                            className="h-8 w-8 p-0 bg-transparent border-none shadow-none text-slate-400 hover:bg-transparent hover:text-blue-600 focus:ring-0"
                                        >
                                            <ListTodo className="h-4 w-4" />
                                        </Button>

                                        {/* {taskCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-semibold">
                                                {taskCount > 99 ? "99+" : taskCount}
                                            </span>
                                        )} */}
                                    </div>
                                    <Button
                                        size="icon"
                                        title='Meetings'
                                        className="h-8 w-8 p-0 bg-transparent border-none shadow-none text-slate-400 hover:bg-transparent hover:text-blue-600 focus:ring-0"
                                        onClick={() => navigate(`/meeting-schedule/${realCustomerId}`)}
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="relative h-8 flex bg-transparent border-none shadow-none items-center gap-1.5 px-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors rounded-md"
                                        title="View Leads"
                                        onClick={() =>
                                            navigate('/Leads', { state: { filterCustomerId: realCustomerId } })
                                        }
                                    >
                                        <BarChart3 className="h-4 w-4" />

                                        <span
                                            className={`absolute -top-1 -right-1 
                                            ${leadCount > 0 ? "bg-red-500" : "bg-green-500"} 
                                            text-white text-[10px] 
                                            min-w-[16px] h-[16px] 
                                            flex items-center justify-center 
                                            rounded-full font-semibold`}
                                        >
                                            {leadCount > 99 ? "99+" : leadCount}
                                        </span>
                                    </Button>
                                </>
                            )}
                            {/* <div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 flex items-center gap-1.5 px-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors rounded-md"
                                    title="Attachments"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div> */}

                        </div >
                    }
                />

                <div className="flex-1 overflow-y-auto bg-slate-50 pt-0 p-6 mt-0 gap-6 flex flex-col items-center pb-8">
                    <Card className="w-full shrink-0 p-4 md:p-6 border-[1px] border-slate-200 shadow-sm bg-white rounded-[8px] opacity-100 rotate-0">
                        <div className="flex flex-col md:flex-row gap-[16px] mb-0.5 w-full h-auto mx-auto relative min-w-0">
                            <div
                                className={cn(
                                    "w-24 h-24 shrink-0 border-2 border-dashed border-slate-300 rounded-full relative overflow-hidden group bg-white flex items-center justify-center",
                                    !isViewMode && "cursor-pointer"
                                )}
                                onClick={() => !isViewMode && profileInputRef.current?.click()}
                            >
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <Camera className="h-6 w-6 text-slate-500 mb-1" />
                                        <span className="text-[12px] text-slate-600 font-medium text-center">
                                            Upload Image
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={profileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleProfilePhotoChange}
                                />
                            </div>
                            <div className="flex-1 min-w-0 space-y-4">
                                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                                    <div ref={companySearchRef} className="relative w-full xl:w-[280px]">
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="M/S Company Name / Individual Name"
                                            className={cn("!text-lg !font-medium !h-12", customerNameError && "border-red-500")}
                                            value={formData.first_name}
                                            onChange={handleCompanySearch}
                                            required
                                        />
                                        {customerNameError && <p className="text-[10px] text-red-500 mt-0.5 absolute">{customerNameError}</p>}

                                        {showDropdown && companyResults.length > 0 && (
                                            <ul className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md max-h-56 overflow-auto">
                                                {companyResults.map((item, index) => (
                                                    <li
                                                        key={index}
                                                        className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
                                                        onClick={() => handleSelectCompany(item)}
                                                    >
                                                        {item.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="w-full xl:w-[200px]">
                                        <FloatingLabelSelect
                                            disabled={isViewMode}
                                            items={[
                                                { label: 'Individual', value: 'Individual' },
                                                { label: 'Company', value: 'Company' },
                                                { label: 'Partner', value: 'Partner' },
                                                { label: 'Vendor', value: 'Vendor' }
                                            ]}
                                            value={formData.contact_type}
                                            onValueChange={(v) => setFormData({ ...formData, contact_type: v })}
                                            placeholder="Customer Type"
                                            label="Customer Type"
                                            required
                                        />
                                    </div>
                                    <div className="w-full xl:w-[200px]">
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Industry"
                                            value={detailsData.industry}
                                            onChange={(e) => setDetailsData({ ...detailsData, industry: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-full xl:w-[200px]">
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Website link"
                                            value={detailsData.website}
                                            onChange={(e) => setDetailsData({ ...detailsData, website: e.target.value })}
                                        />
                                    </div>
                                    {/* <div className="hidden xl:flex xl:flex-1" /> */}
                                    {!isViewMode && (
                                        <Button
                                            disabled={isViewMode}
                                            variant="outline"
                                            className="w-full xl:w-auto h-12 border-[#2563EB] border-[1px] text-[#2563EB] hover:bg-blue-50 gap-2 px-6 rounded-[6px] shrink-0 font-['Instrument_Sans'] font-medium shadow-sm mt-2 xl:mt-0"
                                            onClick={handleBusinessCardClick}
                                        >
                                            <Camera className="h-4 w-4" />
                                            Scan Card
                                            <input
                                                type="file"
                                                ref={cardInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleCardScanChange}
                                            />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-full">
                                                <FloatingLabelInput
                                                    disabled={isViewMode}
                                                    label="Address Line 1"
                                                    value={formData.street}
                                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            <p className="max-w-[300px] break-words">{formData.street || "Empty"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-full">
                                                <FloatingLabelInput
                                                    disabled={isViewMode}
                                                    label="Address Line 2"
                                                    value={formData.street2}
                                                    onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            <p className="max-w-[300px] break-words">{formData.street2 || "Empty"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <FloatingLabelSelect
                                        disabled={isViewMode}
                                        items={countries}
                                        value={formData.country}
                                        onValueChange={handleCountryChange}
                                        placeholder="Country"
                                        label="Country"
                                        required
                                    />
                                    <FloatingLabelSelect
                                        disabled={isViewMode}
                                        items={states}
                                        value={formData.state}
                                        onValueChange={handleStateChange}
                                        placeholder="State"
                                        label="State"
                                        required
                                    />
                                    <FloatingLabelSelect
                                        disabled={isViewMode}
                                        items={cities}
                                        value={formData.city}
                                        onValueChange={(v) => setFormData({ ...formData, city: v })}
                                        placeholder="City"
                                        label="City"
                                        required
                                    />
                                    <FloatingLabelInput
                                        disabled={isViewMode}
                                        label="Pincode"
                                        value={formData.zip}
                                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-[1px] bg-slate-100 my-4" />
                        <div className="flex flex-col w-full mx-auto pt-1 pb-1 gap-1">
                            <div className="flex justify-end order-first mb-2">
                                <Button
                                    disabled={isViewMode}
                                    variant="ghost"
                                    className="w-auto h-[16px] p-0 text-[#3B82F6] hover:text-blue-700 hover:bg-transparent text-[14px] font-semibold font-['Instrument_Sans'] tracking-normal justify-end gap-1"
                                    onClick={addContactPerson}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add New Contact
                                </Button>
                            </div>
                            <div className="space-y-4 max-h-[120px] overflow-y-auto pt-2 pb-2">
                                {contactPersons.map((person, index) => (
                                    <div key={person.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr_0.9fr_0.9fr_0.9fr_1fr_0.8fr_0.8fr] gap-4 xl:gap-2 items-center group relative mt-4 xl:mt-1 border-b pb-4 xl:border-none xl:pb-0 last:border-0 border-slate-100">
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Contact person name"
                                            value={person.name}
                                            onChange={(e) => updateContactPerson(person.id, 'name', e.target.value)}
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Designation"
                                            value={person.designation}
                                            onChange={(e) => updateContactPerson(person.id, 'designation', e.target.value)}
                                            required
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Mobile no"
                                            value={person.mobile}
                                            onChange={(e) => updateContactPerson(person.id, 'mobile', e.target.value)}
                                            validationType="phone"
                                            maxLength={10}
                                            required
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Telephone"
                                            value={person.telephone}
                                            onChange={(e) => updateContactPerson(person.id, 'telephone', e.target.value)}
                                            isInvalid={contactPersonErrors[person.id]?.telephoneInvalid as boolean}
                                            isValid={contactPersonErrors[person.id]?.telephoneValid as boolean}
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Email address"
                                            value={person.email}
                                            onChange={(e) => updateContactPerson(person.id, 'email', e.target.value)}
                                            validationType="email"
                                            required
                                        />
                                        <Select disabled={isViewMode} value={person.preferred_type} onValueChange={(v) => updateContactPerson(person.id, 'preferred_type', v)}>
                                            <SelectTrigger className={cn("bg-white border-[#0A0B1F]/10 h-11 text-sm leading-normal pt-[12px] pl-[12px] placeholder:text-[#0B1A3C99] font-['Instrument_Sans'] rounded-[6px]", isViewMode ? "text-black opacity-100" : "text-black")}><SelectValue placeholder="Preferred Type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Email">Email</SelectItem>
                                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                                <SelectItem value="Phone">Phone</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="relative">
                                            <Select disabled={isViewMode} value={person.address_type} onValueChange={(v) => updateContactPerson(person.id, 'address_type', v)}>
                                                <SelectTrigger className={cn("bg-white border-[#0A0B1F]/10 h-11 text-sm leading-normal pt-[12px] pl-[12px] placeholder:text-[#0B1A3C99] font-['Instrument_Sans'] rounded-[6px] shadow-sm", isViewMode ? "text-black opacity-100" : "text-black")}><SelectValue placeholder="Address Type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Billing">Billing</SelectItem>
                                                    <SelectItem value="Shipping">Shipping</SelectItem>
                                                    <SelectItem value="Both">Both</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {contactPersons.length > 1 && (
                                                <Button
                                                    disabled={isViewMode}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -top-3 -right-2 xl:-right-8 xl:top-1/2 xl:-translate-y-1/2 h-8 w-8 placeholder:text-slate-400/70 text-slate-500 hover:text-red-500 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeContactPerson(person.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                    <Tabs defaultValue="address_info" className="w-full space-y-0 flex flex-col">
                        <div className="flex items-center shrink-0 w-full overflow-x-auto no-scrollbar">
                            <TabsList className="bg-transparent p-0 w-auto flex justify-start items-end h-[46px] gap-[1px] min-w-max">
                                <TabsTrigger
                                    value="address_info"
                                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 text-slate-500 bg-[#E8EAED] rounded-t-[6px] rounded-b-none px-4 h-[46px] text-[14px] font-normal font-['Instrument_Sans'] transition-all shadow-sm border-t border-l border-r border-b-0 border-slate-200 hover:bg-slate-50 opacity-100 font-medium"
                                >
                                    Address Information
                                </TabsTrigger>
                                <TabsTrigger
                                    value="details"
                                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 text-slate-500 bg-[#E8EAED] rounded-t-[6px] rounded-b-none px-4 h-[46px] text-[14px] font-normal font-['Instrument_Sans'] transition-all shadow-sm border-t border-l border-r border-b-0 border-slate-200 hover:bg-slate-50 opacity-100 font-medium"
                                >
                                    Details
                                </TabsTrigger>
                                <TabsTrigger
                                    value="live_log"
                                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 text-slate-500 bg-[#E8EAED] rounded-t-[6px] rounded-b-none px-4 h-[46px] text-[14px] font-normal font-['Instrument_Sans'] transition-all shadow-sm border-t border-l border-r border-b-0 border-slate-200 hover:bg-slate-50 opacity-100 font-medium"
                                >
                                    Live Log
                                </TabsTrigger>
                                <TabsTrigger
                                    value="task_scheduled"
                                    className="relative data-[state=active]:bg-white 
                                                data-[state=active]:text-blue-600 
                                                data-[state=active]:border-t-2 
                                                data-[state=active]:border-t-blue-600 
                                                text-slate-500 bg-[#E8EAED] 
                                                rounded-t-[6px] rounded-b-none 
                                                px-4 h-[46px] text-[14px] 
                                                font-['Instrument_Sans'] 
                                                transition-all shadow-sm 
                                                border-t border-l border-r border-b-0 
                                                border-slate-200 hover:bg-slate-50 
                                                font-medium flex items-center gap-2"
                                >
                                    <span>Task Scheduled</span>

                                    {taskCount > 0 && (
                                        <span className="bg-green-500 text-white text-[10px] 
                                                            min-w-[18px] h-[18px] 
                                                            px-1.5 flex items-center 
                                                            justify-center rounded-full 
                                                            font-semibold leading-none">
                                            {taskCount > 99 ? "99+" : taskCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="meetings"
                                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                                    data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 
                                    text-slate-500 bg-[#E8EAED] rounded-t-[6px] rounded-b-none px-4 
                                    h-[46px] text-[14px] font-normal font-['Instrument_Sans'] 
                                    transition-all shadow-sm border-t border-l border-r border-b-0 
                                    border-slate-200 hover:bg-slate-50 opacity-100 font-medium gap-2"
                                >
                                    <span>Meetings</span>
                                    {meetingCounts > 0 && (
                                        <span className="bg-green-500 text-white text-[10px] 
                                                            min-w-[18px] h-[18px] 
                                                            px-1.5 flex items-center 
                                                            justify-center rounded-full 
                                                            font-semibold leading-none">
                                            {meetingCounts > 99 ? "99+" : meetingCounts}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="attachments"
                                    className="relative data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 text-slate-500 bg-[#E8EAED] rounded-t-[6px] rounded-b-none px-4 h-[46px] text-[14px] font-medium transition-all shadow-sm border-t border-l border-r border-b-0 border-slate-200 hover:bg-slate-50 gap-2"
                                >
                                    <span>Attachments</span>
                                    {attachmentCount > 0 && (
                                        <span className="bg-green-500 text-white text-[10px] 
                                                            min-w-[18px] h-[18px] 
                                                            px-1.5 flex items-center 
                                                            justify-center rounded-full 
                                                            font-semibold leading-none">
                                            {attachmentCount > 99 ? "99+" : attachmentCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg rounded-tl-none shadow-sm p-6 -mt-[1px] relative z-10 m-0 flex-1 overflow-y-auto">
                            <TabsContent value="address_info" className="mt-0 p-0">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-['Instrument_Sans'] font-semibold text-[16px] leading-[1.45] h-[23px] text-slate-700 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-blue-600 " /> Bill To Address
                                        </h3>
                                        <div className="space-y-4">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="w-full">
                                                        <FloatingLabelInput
                                                            disabled={isViewMode}
                                                            label="Address Line 1"
                                                            value={billingAddress.street}
                                                            onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="max-w-[300px] break-words">{billingAddress.street || "Empty"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="w-full">
                                                        <FloatingLabelInput
                                                            disabled={isViewMode}
                                                            label="Address Line 2"
                                                            value={billingAddress.street2}
                                                            onChange={(e) => setBillingAddress({ ...billingAddress, street2: e.target.value })}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="max-w-[300px] break-words">{billingAddress.street2 || "Empty"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FloatingLabelSelect
                                                    disabled={isViewMode}
                                                    items={countries}
                                                    value={billingAddress.country}
                                                    onValueChange={handleBillingCountryChange}
                                                    placeholder="Country"
                                                />
                                                <FloatingLabelSelect
                                                    disabled={isViewMode}
                                                    items={billingAddress.country ? State.getStatesOfCountry(billingAddress.country).map(s => ({ label: s.name, value: s.isoCode })) : []}
                                                    value={billingAddress.state}
                                                    onValueChange={handleBillingStateChange}
                                                    placeholder="State"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FloatingLabelSelect
                                                    disabled={isViewMode}
                                                    items={billingAddress.state ? City.getCitiesOfState(billingAddress.country, billingAddress.state).map(c => ({ label: c.name, value: c.name })) : []}
                                                    value={billingAddress.city}
                                                    onValueChange={(v) => setBillingAddress({ ...billingAddress, city: v })}
                                                    placeholder="City"
                                                />
                                                <FloatingLabelInput
                                                    disabled={isViewMode}
                                                    type='number'
                                                    label="Pincode"
                                                    value={billingAddress.zip}
                                                    onChange={(e) => setBillingAddress({ ...billingAddress, zip: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Checkbox
                                                disabled={isViewMode}
                                                id="same_address"
                                                checked={isShippingSameAsBilling}
                                                onCheckedChange={(checked) => {
                                                    const val = checked as boolean;
                                                    setIsShippingSameAsBilling(val);
                                                    if (!val) {
                                                        setShippingAddress({
                                                            street: '',
                                                            street2: '',
                                                            city: '',
                                                            state: '',
                                                            country: '',
                                                            zip: ''
                                                        });
                                                    }
                                                }}
                                                className="border-slate-300"
                                            />
                                            <Label htmlFor="same_address" className="text-slate-600 text-[14px] font-normal font-['Instrument_Sans']">Ship as same billing address</Label>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-['Instrument_Sans'] font-semibold text-[16px] leading-[1.45] h-[23px] text-slate-700 flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-blue-600" /> Shipping to Address
                                        </h3>
                                        <div className="space-y-4">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="w-full">
                                                        <FloatingLabelInput
                                                            disabled={isViewMode}
                                                            label="Address Line 1"
                                                            value={shippingAddress.street}
                                                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="max-w-[300px] break-words">{shippingAddress.street || "Empty"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="w-full">
                                                        <FloatingLabelInput
                                                            disabled={isViewMode}
                                                            label="Address Line 2"
                                                            value={shippingAddress.street2}
                                                            onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="max-w-[300px] break-words">{shippingAddress.street2 || "Empty"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FloatingLabelSelect
                                                    disabled={isViewMode}
                                                    items={countries}
                                                    value={shippingAddress.country}
                                                    onValueChange={handleShippingCountryChange}
                                                    placeholder="Country"
                                                />
                                                <FloatingLabelSelect
                                                    disabled={isViewMode}
                                                    items={shippingAddress.country ? State.getStatesOfCountry(shippingAddress.country).map(s => ({ label: s.name, value: s.isoCode })) : []}
                                                    value={shippingAddress.state}
                                                    onValueChange={handleShippingStateChange}
                                                    placeholder="State"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FloatingLabelSelect
                                                    disabled={isViewMode}
                                                    items={shippingAddress.state ? City.getCitiesOfState(shippingAddress.country, shippingAddress.state).map(c => ({ label: c.name, value: c.name })) : []}
                                                    value={shippingAddress.city}
                                                    onValueChange={(v) => setShippingAddress({ ...shippingAddress, city: v })}
                                                    placeholder="City"
                                                />
                                                <FloatingLabelInput
                                                    disabled={isViewMode}
                                                    label="Pincode"
                                                    value={shippingAddress.zip}
                                                    onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="details" className="mt-0 p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-['Instrument_Sans'] font-semibold text-[16px] leading-[1.45] h-[23px] text-slate-700 flex items-center gap-2">
                                                    <Share2 className="h-5 w-5 text-blue-600" /> Social Media
                                                </h3>
                                                {!isViewMode && (
                                                    <Button
                                                        disabled={isViewMode}
                                                        variant="link"
                                                        className="text-blue-600 h-auto p-0 text-[14px] font-normal font-['Instrument_Sans'] hover:no-underline"
                                                        onClick={addSocialField}
                                                    >
                                                        + Add Fields
                                                    </Button>
                                                )}
                                            </div>
                                            <FloatingLabelInput
                                                disabled={isViewMode}
                                                label="Linked In url"
                                                value={formData.linkedin_url}
                                                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                            />
                                            {socialFields.map((field) => (
                                                <FloatingLabelInput
                                                    disabled={isViewMode}
                                                    key={field.id}
                                                    label="Social Media URL"
                                                    value={field.value}
                                                    onChange={(e) => updateSocialField(field.id, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-['Instrument_Sans'] font-semibold text-[16px] leading-[1.45] h-[23px] text-slate-700 flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-blue-600" /> Financial Details
                                        </h3>
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="GST details"
                                            value={detailsData.gst_details}
                                            onChange={(e) => setDetailsData({ ...detailsData, gst_details: e.target.value })}
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Credit Limit"
                                            value={detailsData.credit_limit}
                                            onChange={(e) => setDetailsData({ ...detailsData, credit_limit: e.target.value })}
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Payment Terms"
                                            value={detailsData.payment_terms}
                                            onChange={(e) => setDetailsData({ ...detailsData, payment_terms: e.target.value })}
                                        />
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Multi Currency"
                                            value={detailsData.multi_currency}
                                            onChange={(e) => setDetailsData({ ...detailsData, multi_currency: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-['Instrument_Sans'] font-semibold text-[16px] leading-[1.45] h-[23px] text-slate-700 flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-blue-600" /> Sales Details
                                        </h3>
                                        <FloatingLabelInput
                                            disabled={isViewMode}
                                            label="Annual Revenue"
                                            value={detailsData.annual_revenue}
                                            onChange={(e) => setDetailsData({ ...detailsData, annual_revenue: e.target.value })}
                                        />
                                        <div className="relative w-full group">
                                            <Select
                                                disabled={isViewMode}
                                                value={formData.sales_owner_id}
                                                onValueChange={(v) => setFormData({ ...formData, sales_owner_id: v })}
                                            >
                                                <SelectTrigger className={cn("peer bg-white border border-slate-300 h-11 rounded-[6px] text-sm leading-normal pt-4 pb-1 pl-[12px] placeholder:text-transparent font-['Instrument_Sans'] focus:ring-0 focus:ring-offset-0 focus:border-primary focus:outline-none focus:bg-white", isViewMode ? "text-black opacity-100" : "text-black")}>
                                                    <SelectValue placeholder="" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="owner1">Sales Owner 1</SelectItem>
                                                    <SelectItem value="owner2">Sales Owner 2</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <label
                                                className={cn(
                                                    "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                                                    "text-[#0B1A3C99] text-[14px] top-1/2 -translate-y-1/2",
                                                    "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
                                                    formData.sales_owner_id ? "top-0 text-[12px]" : ""
                                                )}
                                            >
                                                Sales Owner
                                            </label>
                                        </div>
                                        <div className="relative w-full group">
                                            <Select
                                                disabled={isViewMode}
                                                value={formData.source}
                                                onValueChange={(v) => setFormData({ ...formData, source: v })}
                                            >
                                                <SelectTrigger className={cn("peer bg-white border border-slate-300 h-11 rounded-[6px] text-sm leading-normal pt-4 pb-1 pl-[12px] placeholder:text-transparent font-['Instrument_Sans'] focus:ring-0 focus:ring-offset-0 focus:border-primary focus:outline-none focus:bg-white", isViewMode ? "text-black opacity-100" : "text-black")}>
                                                    <SelectValue placeholder="" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Referral">Referral</SelectItem>
                                                    <SelectItem value="Event">Event</SelectItem>
                                                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                                                    <SelectItem value="Website">Website</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <label
                                                className={cn(
                                                    "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                                                    "text-[#0B1A3C99] text-[14px] top-1/2 -translate-y-1/2",
                                                    "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
                                                    formData.source ? "top-0 text-[12px]" : ""
                                                )}
                                            >
                                                Lead Source
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative w-full group">
                                                <Select
                                                    disabled={isViewMode}
                                                    value={detailsData.priority}
                                                    onValueChange={(v) => setDetailsData({ ...detailsData, priority: v })}
                                                >
                                                    <SelectTrigger className={cn("peer bg-white border border-slate-300 h-11 rounded-[6px] text-sm leading-normal pt-4 pb-1 pl-[12px] placeholder:text-transparent font-['Instrument_Sans'] focus:ring-0 focus:ring-offset-0 focus:border-primary focus:outline-none focus:bg-white", isViewMode ? "text-black opacity-100" : "text-black")}>
                                                        <SelectValue placeholder="" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="low">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <label
                                                    className={cn(
                                                        "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                                                        "text-[#0B1A3C99] text-[14px] top-1/2 -translate-y-1/2",
                                                        "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
                                                        detailsData.priority ? "top-0 text-[12px]" : ""
                                                    )}
                                                >
                                                    Priority
                                                    <span className="text-red-500">*</span>
                                                </label>
                                            </div>
                                            <FloatingLabelInput
                                                disabled={isViewMode}
                                                label="Engagement Probability"
                                                value={detailsData.probability}
                                                onChange={(e) => setDetailsData({ ...detailsData, probability: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative w-full group">
                                            <Select
                                                disabled={isViewMode}
                                                value={formData.status}
                                                onValueChange={(v) => setFormData({ ...formData, status: v })}
                                            >
                                                <SelectTrigger className={cn("peer bg-slate-50/50 border border-slate-300 h-[44px] rounded-[6px] text-[14px] leading-[1.45] pt-4 pb-1 pl-[12px] placeholder:text-transparent font-['Instrument_Sans'] focus:ring-0 focus:ring-offset-0 focus:border-primary focus:outline-none focus:bg-white", isViewMode ? "text-black opacity-100" : "text-black")}>
                                                    <SelectValue placeholder="Account Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <label
                                                className={cn(
                                                    "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                                                    "text-black text-[14px] top-1/2 -translate-y-1/2",
                                                    "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
                                                    formData.status ? "top-0 text-[12px]" : ""
                                                )}
                                            >
                                                Account Status
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="live_log" className="mt-0 p-0">
                                <div className="text-slate-500 text-[14px] font-normal font-['Instrument_Sans'] py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    No recent activity
                                </div>
                            </TabsContent>
                            <TabsContent value="task_scheduled" className="mt-0 p-0 max-h-[400px] overflow-y-auto">
                                <TaskListView entityId={realCustomerId ?? ""} entityType="customer" onCountChange={setTaskCount} />
                            </TabsContent>
                            <TabsContent value="attachments">
                                {realCustomerId && (
                                    <CustomerAttachmentsTab recordId={realCustomerId} bucketName="Customer_attachments" onCountChange={setAttachmentCount} />
                                )}
                            </TabsContent>
                            <TabsContent value="meetings" className="mt-0 p-0 max-h-[400px] overflow-y-auto">
                                <MeetingsTab
                                    entityId={realCustomerId || ""}
                                    entityType="customer"
                                    onCountChange={setMeetingCounts}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="sticky bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-4 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        className="w-32 h-[44px] rounded-[6px] text-[14px] font-normal font-['Instrument_Sans']"
                        onClick={() => navigate('/contacts')}
                    >
                        {isViewMode ? 'Back' : 'Cancel'}
                    </Button>
                    {!isViewMode ? (
                        <Button
                            className="w-32 h-[44px] bg-primary hover:bg-primary/90 text-white rounded-[6px] text-[14px] font-normal font-['Instrument_Sans']"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
                        </Button>
                    ) : (
                        <Button
                            className="w-32 h-[44px] bg-primary hover:bg-primary/90 text-white rounded-[6px] text-[14px] font-normal font-['Instrument_Sans']"
                            onClick={() => navigate(`/contacts/edit/${id}`)}
                        >
                            Edit
                        </Button>
                    )}
                </div>
                <ActivityPopup
                    isOpen={open}
                    onClose={() => setOpen(false)}
                    entityId={realCustomerId || ""}
                    entityType="customer"
                    onTaskCreate={() => {
                        fetchTaskCount(realCustomerId);
                        fetchTasks(realCustomerId);
                    }}
                />
            </div>
        </TooltipProvider>
    );
}

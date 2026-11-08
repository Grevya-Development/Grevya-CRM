import React, { useEffect, useState } from 'react';
import {
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    Row,
    Col,
    Card,
    Space,
    Typography,
    Tabs,
    Table,
    InputNumber,
    Divider,
    message,
    Tag,
    Modal,
    Badge,
    Timeline,
    Avatar,
    Checkbox,
    Switch
} from 'antd';
import {
    Save,
    X,
    Plus,
    Trash2,
    FileText,
    User,
    Calendar,
    DollarSign,
    ChevronRight,
    Send,
    Eye,
    CheckCircle,
    Truck,
    Hash,
    Activity,
    Package,
    MessageSquare,
    Paperclip,
    History,
    MoreHorizontal,
    ArrowLeft,
    Circle
} from 'lucide-react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { supabase } from '../supabase/supabaseClient';
import { getCurrentUserName } from '@/lib/currentUser';
import { Product } from '@/types';

// Rows from `crm_leads` (opportunities), used by the Opportunity picker.
interface OpportunityLead {
    id: string;
    lead_name: string | null;
    subject: string | null;
    crm_customers: { name: string | null } | null;
}

// Rows from `crm_customers`, used by the Customer picker. quotations.contact_id stores crm_customers.id.
interface CustomerOption {
    id: string;
    name: string | null;
    billing_address: string | null;
}

// Formats the crm_addresses row of a customer (billing, falling back to company address).
// The embed may come back as an object (one-to-one) or an array depending on PostgREST's detection.
const formatCustomerAddress = (addresses: any): string | null => {
    const a = Array.isArray(addresses) ? addresses[0] : addresses;
    if (!a) return null;
    const billing = [a.billing_address, a.billing_city, a.billing_state, a.billing_zip, a.billing_country].filter(Boolean);
    const company = [a.company_address, a.company_city, a.company_state, a.company_zip, a.company_country].filter(Boolean);
    const parts = billing.length ? billing : company;
    return parts.length ? parts.join(', ') : null;
};
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { StageProgress } from '@/components/Leads/StageProgress';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

interface QuotationItem {
    id?: string;
    key: string;
    item_type: 'product' | 'section' | 'note';
    product_id?: number;
    product_name?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    taxes?: string;
    is_optional: boolean;
    discount_percent: number;
}

interface QuotationLog {
    id: string;
    action: string;
    performed_by: string;
    details: string;
    created_at: string;
}

interface PaymentTerm {
    id: string;
    name: string;
    days: number;
}

const AddQuotation = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const lead_id = searchParams.get('lead_id');
    const { formatCurrency } = useCurrency();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(false);
    const [fetchLogsLoading, setFetchLogsLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [contacts, setContacts] = useState<CustomerOption[]>([]);
    const [leads, setLeads] = useState<OpportunityLead[]>([]);
    const [orderLines, setOrderLines] = useState<QuotationItem[]>([]);
    const [optionalProducts, setOptionalProducts] = useState<QuotationItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [status, setStatus] = useState('draft');
    const [logs, setLogs] = useState<QuotationLog[]>([]);
    const [showChatter, setShowChatter] = useState(true);
    const [noteText, setNoteText] = useState('');
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [lastSaved, setLastSaved] = useState<dayjs.Dayjs | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
    const [invoiceType, setInvoiceType] = useState<'regular' | 'percentage' | 'fixed'>('regular');
    const [downPaymentAmount, setDownPaymentAmount] = useState(0);
    const [downPaymentPercent, setDownPaymentPercent] = useState(0);
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

    const QUOTATION_STAGES = [
        { key: 'draft', label: 'Quotation', activeColor: '#2563eb' },
        { key: 'sent', label: 'Sent Approval', activeColor: '#2563eb' },
        { key: 'sales_order', label: 'Order', activeColor: '#059669' },
    ];

    useEffect(() => {
        fetchProducts();
        fetchContacts();
        fetchLeads();
        fetchPaymentTerms();
        if (id) {
            fetchQuotation();
            fetchLogs();
        } else if (lead_id) {
            prefillFromLead();
        }
    }, [id, lead_id]);

    const fetchLeads = async () => {
        const { data } = await supabase
            .from('crm_leads')
            .select('id, lead_name, subject, crm_customers(name)')
            .eq('is_deleted', false)
            .order('lead_name');
        if (data) setLeads(data as unknown as OpportunityLead[]);
    };

    const fetchPaymentTerms = async () => {
        const { data } = await supabase.from('payment_terms').select('*').order('days');
        if (data) setPaymentTerms(data);
    };

    interface GstTreatment {
        id: string;
        name: string;
    }

    const [gstTreatments, setGstTreatments] = useState<GstTreatment[]>([]);

    useEffect(() => {
        const fetchGstTreatments = async () => {
            const { data } = await supabase.from('gst_treatments').select('*').order('name');
            if (data) setGstTreatments(data);
        };
        fetchGstTreatments();
    }, []);

    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`quotation_updates_${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'quotations',
                filter: `id=eq.${id}`
            }, (payload: any) => {
                if (payload.new) {
                    setStatus(payload.new.status);
                    form.setFieldsValue({
                        ...payload.new,
                        expiration_date: payload.new.expiration_date ? dayjs(payload.new.expiration_date) : null,
                        delivery_date: payload.new.delivery_date ? dayjs(payload.new.delivery_date) : null,
                    });
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'quotation_logs',
                filter: `quotation_id=eq.${id}`
            }, (payload: any) => {
                // Skip entries already shown (a refetch may have loaded them first).
                setLogs(prev => prev.some(l => l.id === payload.new.id) ? prev : [payload.new as QuotationLog, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('status', 'active');
        if (data) setProducts(data);
    };

    const fetchContacts = async () => {
        const { data } = await supabase
            .from('crm_customers')
            .select('id, name, addresses:crm_addresses(*)')
            .order('name');
        if (data) {
            setContacts(data.map((c: any) => ({
                id: c.id,
                name: c.name,
                billing_address: formatCustomerAddress(c.addresses),
            })));
        }
    };

    const fetchQuotation = async () => {
        try {
            setLoading(true);
            const { data: q, error } = await supabase
                .from('quotations')
                .select('*, quotation_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (q) {
                form.setFieldsValue({
                    ...q,
                    expiration_date: q.expiration_date ? dayjs(q.expiration_date) : null,
                    delivery_date: q.delivery_date ? dayjs(q.delivery_date) : null,
                });
                setStatus(q.status);

                const lines = q.quotation_items
                    .filter((i: any) => !i.is_optional)
                    .map((i: any) => ({ ...i, key: i.id }));
                const optional = q.quotation_items
                    .filter((i: any) => i.is_optional)
                    .map((i: any) => ({ ...i, key: i.id }));

                setOrderLines(lines);
                setOptionalProducts(optional);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!id) return;
        try {
            setFetchLogsLoading(true);
            const { data } = await supabase
                .from('quotation_logs')
                .select('*')
                .eq('quotation_id', id)
                .order('created_at', { ascending: false });
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setFetchLogsLoading(false);
        }
    };

    const prefillFromLead = async () => {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select('*, crm_customers(name, addresses:crm_addresses(*))')
            .eq('id', lead_id)
            .single();

        if (lead) {
            // lead_owner_id is an auth.users id; resolve it to an email via the get_users RPC (same as AddLeads).
            let salesperson = '';
            if (lead.lead_owner_id) {
                const { data: users } = await supabase.rpc('get_users');
                salesperson = (users || []).find((u: any) => u.id === lead.lead_owner_id)?.email || '';
            }

            form.setFieldsValue({
                contact_id: lead.customer_id,
                opportunity_id: lead.id,
                quotation_number: `QT-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000)}`,
                expiration_date: dayjs().add(30, 'day'),
                salesperson,
                source: lead.lead_source,
                billing_address: formatCustomerAddress(lead.crm_customers?.addresses)
            });
        }
    };

    const addLog = async (action: string, details: string) => {
        if (!id) return;
        await supabase.from('quotation_logs').insert({
            quotation_id: id,
            action,
            details,
            performed_by: await getCurrentUserName()
        });
        fetchLogs();
    };

    const updateStatus = async (newStatus: string) => {
        const values = form.getFieldsValue();
        if (newStatus === status && newStatus !== 'sent') return;

        if (newStatus === 'sent') setEmailLoading(true);
        if (newStatus === 'sales_order') setConfirmLoading(true);

        await onFinish(values, false, newStatus);

        setEmailLoading(false);
        setConfirmLoading(false);
    };

    const handleCreateInvoice = async () => {
        if (!id) return;
        try {
            setInvoiceLoading(true);

            // Generate invoice number
            const invNumber = `INV/${dayjs().format('YYYY')}/${Math.floor(10000 + Math.random() * 90000)}`;

            const quotationData = form.getFieldsValue();

            // Calculate totals based on type
            let finalSubtotal = subtotal;
            let invoiceItems: any[] = [];

            if (invoiceType === 'regular') {
                finalSubtotal = subtotal;
                invoiceItems = [
                    ...orderLines.filter(l => l.item_type === 'product').map(l => ({
                        product_id: l.product_id,
                        product_name: l.product_name,
                        description: l.description,
                        quantity: l.quantity,
                        unit_price: l.unit_price,
                        discount_percent: l.discount_percent,
                        total: l.quantity * l.unit_price * (1 - l.discount_percent / 100)
                    })),
                    ...optionalProducts.filter(l => l.item_type === 'product').map(l => ({
                        product_id: l.product_id,
                        product_name: l.product_name,
                        description: l.description,
                        quantity: l.quantity,
                        unit_price: l.unit_price,
                        discount_percent: l.discount_percent,
                        total: l.quantity * l.unit_price * (1 - l.discount_percent / 100)
                    }))
                ];
            } else if (invoiceType === 'percentage') {
                finalSubtotal = subtotal * (downPaymentPercent / 100);
                invoiceItems = [{
                    product_name: 'Down payment',
                    description: `Down payment of ${downPaymentPercent}%`,
                    quantity: 1,
                    unit_price: finalSubtotal,
                    discount_percent: 0,
                    total: finalSubtotal
                }];
            } else if (invoiceType === 'fixed') {
                finalSubtotal = downPaymentAmount;
                invoiceItems = [{
                    product_name: 'Down payment',
                    description: 'Down payment (fixed amount)',
                    quantity: 1,
                    unit_price: finalSubtotal,
                    discount_percent: 0,
                    total: finalSubtotal
                }];
            }

            // Create Invoice
            const { data: inv, error: invError } = await supabase
                .from('invoices')
                .insert({
                    invoice_number: invNumber,
                    quotation_id: id,
                    contact_id: quotationData.contact_id,
                    status: 'draft',
                    invoice_date: dayjs().format('YYYY-MM-DD'),
                    payment_terms: quotationData.payment_terms,
                    currency: 'INR',
                    subtotal: finalSubtotal,
                    total_amount: finalSubtotal,
                    amount_due: finalSubtotal
                })
                .select()
                .single();

            if (invError) throw invError;

            // Create Invoice Items
            if (invoiceItems.length > 0) {
                const itemsToInsert = invoiceItems.map(item => ({
                    ...item,
                    invoice_id: inv.id
                }));
                const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }

            // Create Log for Invoice
            await supabase.from('invoice_logs').insert({
                invoice_id: inv.id,
                action: 'created',
                details: `Invoice created from Sales Order ${form.getFieldValue('quotation_number')}`,
                performed_by: await getCurrentUserName()
            });

            await addLog('invoice_created', `Invoice ${invNumber} created from Sales Order`);

            message.success('Invoice created successfully');
            setIsInvoiceModalVisible(false);
            navigate(`/invoices/${inv.id}`);

        } catch (err) {
            console.error(err);
            message.error('Failed to create invoice');
        } finally {
            setInvoiceLoading(false);
        }
    };

    const postNote = async () => {
        if (!noteText.trim() || !id) return;
        await addLog('note', noteText);
        setNoteText('');
        message.success('Note posted');
        fetchLogs();
    };

    const calculateTotals = (lines: QuotationItem[]) => {
        return lines.reduce((acc, current) => {
            if (current.item_type === 'product') {
                const lineTotal = (current.quantity || 0) * (current.unit_price || 0) * (1 - (current.discount_percent || 0) / 100);
                return acc + lineTotal;
            }
            return acc;
        }, 0);
    };

    useEffect(() => {
        setSubtotal(calculateTotals(orderLines));
    }, [orderLines]);

    const addItem = (type: 'product' | 'section' | 'note', isOptional: boolean = false) => {
        const newItem: QuotationItem = {
            key: Math.random().toString(36).substr(2, 9),
            item_type: type,
            quantity: type === 'product' ? 1 : 0,
            unit_price: 0,
            is_optional: isOptional,
            discount_percent: 0,
            description: type === 'section' ? 'New Section' : type === 'note' ? 'New Note' : ''
        };
        if (isOptional) setOptionalProducts([...optionalProducts, newItem]);
        else setOrderLines([...orderLines, newItem]);
    };

    const removeItem = (key: string, isOptional: boolean) => {
        if (isOptional) setOptionalProducts(optionalProducts.filter(item => item.key !== key));
        else setOrderLines(orderLines.filter(item => item.key !== key));
    };

    const updateItem = (key: string, field: keyof QuotationItem, value: any, isOptional: boolean) => {
        const updater = (prev: QuotationItem[]) => prev.map(item => {
            if (item.key === key) {
                if (field === 'product_id' && item.item_type === 'product') {
                    const prod = products.find(p => p.id === value);
                    return {
                        ...item,
                        [field]: value,
                        product_name: prod?.name,
                        unit_price: Number(prod?.base_price || 0),
                        description: prod?.description || ''
                    };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        if (isOptional) setOptionalProducts(updater);
        else setOrderLines(updater);
    };

    const onFinish = async (values: any, isAutoSave = false, newStatus?: string) => {
        try {
            if (!isAutoSave && !newStatus) setLoading(true);

            let qId = id;
            const targetStatus = newStatus || status;
            let currentQuotationNumber = values.quotation_number;

            // Generate unique quotation number if moving from draft
            if (newStatus && (newStatus === 'sent' || newStatus === 'sales_order') && status === 'draft') {
                const prefix = newStatus === 'sales_order' ? 'SO' : 'QT';
                currentQuotationNumber = `${prefix}-${dayjs().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`;
                form.setFieldValue('quotation_number', currentQuotationNumber);
            }

            const payload = {
                ...values,
                status: targetStatus,
                quotation_number: currentQuotationNumber,
                expiration_date: values.expiration_date?.format('YYYY-MM-DD'),
                delivery_date: values.delivery_date?.format('YYYY-MM-DD'),
                subtotal: subtotal,
                total_amount: subtotal,
                require_signature: !!values.require_signature,
                require_payment: !!values.require_payment,
                payment_percentage: values.payment_percentage || 100,
                tags: values.tags || []
            };

            if (qId) {
                const { error } = await supabase.from('quotations').update(payload).eq('id', qId);
                if (error) throw error;
                if (newStatus && newStatus !== status) {
                    const actionLabel = newStatus === 'sent' ? 'Approval request sent' : `Status: ${status} → ${newStatus}`;
                    await addLog('status_change', `${actionLabel}${currentQuotationNumber !== values.quotation_number ? ` (Number: ${currentQuotationNumber})` : ''}`);
                }
            } else if (!isAutoSave) {
                const { data, error } = await supabase.from('quotations').insert([payload]).select().single();
                if (error) throw error;
                qId = data.id;
                await addLog('created', 'Quotation created');
            } else {
                return;
            }

            await supabase.from('quotation_items').delete().eq('quotation_id', qId);
            const allItems = [
                ...orderLines.map(l => ({ ...l, quotation_id: qId, is_optional: false })),
                ...optionalProducts.map(l => ({ ...l, quotation_id: qId, is_optional: true }))
            ].map(({ key, id: _, ...rest }) => rest);

            if (allItems.length > 0) {
                const { error: iError } = await supabase.from('quotation_items').insert(allItems);
                if (iError) throw iError;
            }

            if (newStatus) setStatus(newStatus);

            if (!isAutoSave) {
                if (newStatus === 'sent') message.success('Approval request sent successfully');
                else if (newStatus) message.success(`Quotation updated to ${newStatus}`);
                else message.success('Quotation saved');

                if (!id && qId) navigate(`/quotations/${qId}`, { replace: true });
                else fetchQuotation();
            }

        } catch (error: any) {
            if (!isAutoSave) message.error('Failed to save');
            console.error(error);
        } finally {
            if (!isAutoSave && !newStatus) setLoading(false);
        }
    };

    const productTableColumns = (isOptional: boolean) => [
        {
            title: 'Product',
            dataIndex: 'product_id',
            key: 'product',
            width: '30%',
            render: (text: any, record: QuotationItem) => {
                if (record.item_type === 'section') return <Input value={record.description} onChange={e => updateItem(record.key, 'description', e.target.value, isOptional)} className="font-bold border-none bg-slate-100" />;
                if (record.item_type === 'note') return <Input.TextArea autoSize value={record.description} onChange={e => updateItem(record.key, 'description', e.target.value, isOptional)} className="italic border-none bg-yellow-50" />;
                return (
                    <Select showSearch className="w-full" placeholder="Select Product" value={text} onChange={val => updateItem(record.key, 'product_id', val, isOptional)}>
                        {products.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                );
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text: any, record: QuotationItem) => record.item_type === 'product' ? <Input value={text} onChange={e => updateItem(record.key, 'description', e.target.value, isOptional)} /> : null
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            render: (text: any, record: QuotationItem) => record.item_type === 'product' ? <InputNumber min={0} value={text} onChange={val => updateItem(record.key, 'quantity', val || 0, isOptional)} /> : null
        },
        {
            title: 'Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            width: 120,
            render: (text: any, record: QuotationItem) => record.item_type === 'product' ? <InputNumber prefix="₹" className="w-full" value={text} onChange={val => updateItem(record.key, 'unit_price', val || 0, isOptional)} /> : null
        },
        {
            title: 'Total',
            key: 'total',
            align: 'right' as const,
            width: 120,
            render: (text: any, record: QuotationItem) => {
                if (record.item_type !== 'product') return null;
                return <span className="font-bold">{formatCurrency(record.quantity * record.unit_price * (1 - record.discount_percent / 100))}</span>;
            }
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (text: any, record: QuotationItem) => <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => removeItem(record.key, isOptional)} />
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Header title={id ? "Quotation Details" : "New Quotation"} />

            <div className={`flex transition-all duration-300 ${showChatter && id ? 'mr-[400px]' : ''}`}>
                <div className="flex-1 px-8 py-6">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            icon={<ArrowLeft size={16} />}
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2"
                        >
                            Back
                        </Button>
                        <Space>
                            <Button
                                type="primary"
                                icon={<Save size={16} />}
                                onClick={() => {
                                    const values = form.getFieldsValue();
                                    onFinish(values, false);
                                }}
                                loading={loading}
                            >
                                Save
                            </Button>
                            <Button icon={<Eye size={16} />} onClick={() => setIsPreviewVisible(true)}>Preview</Button>

                            <Button
                                icon={<Send size={16} />}
                                onClick={() => updateStatus('sent')}
                                loading={emailLoading}
                                disabled={status === 'sent'}
                            >
                                Send for Approval
                            </Button>

                            <Button
                                type={status === 'sent' ? 'primary' : 'default'}
                                icon={<CheckCircle size={16} />}
                                onClick={() => updateStatus('sales_order')}
                                loading={confirmLoading}
                                className={status === 'sent' ? 'bg-emerald-600 border-none' : ''}
                                disabled={status === 'sales_order'}
                            >
                                Confirm Order
                            </Button>

                            {status === 'sales_order' && (
                                <Button
                                    type="primary"
                                    icon={<FileText size={16} />}
                                    onClick={() => setIsInvoiceModalVisible(true)}
                                    className="bg-indigo-600"
                                >
                                    Create Invoice
                                </Button>
                            )}
                        </Space>
                    </div>

                    {/* Stage Progress */}
                    <div className="mb-8">
                        <StageProgress
                            currentStage={status}
                            stages={QUOTATION_STAGES}
                            onStageChange={(stage) => updateStatus(stage)}
                            logs={logs || []}
                            readOnly={true}
                        />
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onValuesChange={(changedValues) => {
                            if (changedValues.contact_id) {
                                const c = contacts.find(contact => contact.id === changedValues.contact_id);
                                if (c && c.billing_address) {
                                    form.setFieldsValue({ billing_address: c.billing_address });
                                }
                            }
                        }}
                    >
                        <div className="mb-8 flex justify-between">
                            <div>
                                <Title level={2}>{id ? form.getFieldValue('quotation_number') : 'New'}</Title>
                                {id && <Badge status={status === 'sales_order' ? 'success' : 'processing'} text={status.toUpperCase()} />}
                            </div>
                        </div>

                        <Form.Item name="quotation_number" hidden><Input /></Form.Item>

                        <Row gutter={48}>
                            <Col span={12}>
                                <Form.Item label="Customer" name="contact_id" rules={[{ required: true }]}>
                                    <Select showSearch placeholder="Select customer" optionFilterProp="children">
                                        {contacts.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                    </Select>
                                </Form.Item>

                                <Form.Item label="Address" name="billing_address">
                                    <Input.TextArea rows={3} placeholder="Customer Address" />
                                </Form.Item>
                                <Form.Item label="GST Treatment" name="gst_treatment">
                                    <Select
                                        placeholder="Select GST Treatment"
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {gstTreatments.map(t => (
                                            <Option key={t.id} value={t.name}>{t.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Opportunity" name="opportunity_id">
                                    <Select showSearch placeholder="Select opportunity" allowClear>
                                        {leads.map(l => <Option key={l.id} value={l.id}>{l.lead_name || l.subject}{l.crm_customers?.name ? ` (${l.crm_customers.name})` : ''}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Expiration" name="expiration_date"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item>
                                <Form.Item label="Payment Terms" name="payment_terms">
                                    <Select
                                        placeholder="Select Payment Terms"
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {paymentTerms.map(term => (
                                            <Option key={term.id} value={term.name}>{term.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Customer Reference" name="customer_reference"><Input placeholder="e.g. PO#123" /></Form.Item>
                            </Col>
                        </Row>

                        <Tabs items={[
                            {
                                key: 'lines',
                                label: 'Order Lines',
                                children: (
                                    <>
                                        <Table dataSource={orderLines} columns={productTableColumns(false)} pagination={false} size="small" />
                                        <div className="p-2 bg-slate-50 border-dashed border border-slate-200 mt-2 rounded flex gap-4">
                                            <Button type="link" onClick={() => addItem('product')} icon={<Plus size={14} />}>Add product</Button>
                                            <Button type="link" onClick={() => addItem('section')} icon={<Plus size={14} />}>Add section</Button>
                                            <Button type="link" onClick={() => addItem('note')} icon={<Plus size={14} />}>Add note</Button>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <div className="w-64 space-y-2">
                                                <div className="flex justify-between"><span>Untaxed Amount:</span><span>{formatCurrency(subtotal)}</span></div>
                                                <div className="flex justify-between text-xl font-bold border-t pt-2"><span>Total:</span><span>{formatCurrency(subtotal)}</span></div>
                                            </div>
                                        </div>
                                    </>
                                )
                            },

                            {
                                key: 'info',
                                label: 'Other Info',
                                children: (
                                    <Row gutter={48} className="py-4">
                                        <Col span={12}>
                                            <Title level={5} className="mb-4">Sales & Delivery</Title>
                                            <Form.Item label="Salesperson" name="salesperson"><Input /></Form.Item>
                                            <Form.Item label="Sales Team" name="sales_team"><Input /></Form.Item>
                                            <Form.Item label="Delivery Date" name="delivery_date"><DatePicker className="w-full" /></Form.Item>

                                            <Title level={5} className="mt-8 mb-4">Online Confirmation</Title>
                                            <div className="space-y-4">
                                                <Form.Item name="require_signature" valuePropName="checked" className="mb-0">
                                                    <Checkbox>Online Signature</Checkbox>
                                                </Form.Item>
                                                <Form.Item name="require_payment" valuePropName="checked" className="mb-0">
                                                    <Checkbox>Online Payment</Checkbox>
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.require_payment !== curr.require_payment}>
                                                    {({ getFieldValue }) => getFieldValue('require_payment') ? (
                                                        <Form.Item label="Payment Percentage" name="payment_percentage" className="mt-2 ml-6">
                                                            <InputNumber min={1} max={100} suffix="%" className="w-full" />
                                                        </Form.Item>
                                                    ) : null}
                                                </Form.Item>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <Title level={5} className="mb-4">Tracking</Title>
                                            <Form.Item label="Tags" name="tags">
                                                <Select mode="tags" placeholder="Select or create tags" />
                                            </Form.Item>
                                            <Form.Item label="Fiscal Position" name="fiscal_position"><Input /></Form.Item>
                                            <Form.Item label="Source Document" name="source_document"><Input /></Form.Item>
                                            <Divider />
                                            <Form.Item label="Campaign" name="campaign"><Input /></Form.Item>
                                            <Form.Item label="Medium" name="medium"><Input /></Form.Item>
                                            <Form.Item label="Source" name="source"><Input /></Form.Item>
                                        </Col>
                                    </Row>
                                )
                            }
                        ]} />
                    </Form>
                </div>

                {/* Chatter */}
                {id && showChatter && (
                    <div className="fixed right-0 top-16 bottom-0 w-[400px] border-l bg-slate-50 flex flex-col z-40 shadow-xl">
                        <div className="p-4 bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <Title level={4} className="m-0">Notes & Activity</Title>
                                <Button
                                    type="text"
                                    icon={<X size={20} />}
                                    onClick={() => setShowChatter(false)}
                                />
                            </div>

                            <div className="mb-8">
                                <Input.TextArea
                                    placeholder="Write a note..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    rows={3}
                                    className="mb-2"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="primary"
                                        icon={<Send size={16} />}
                                        onClick={postNote}
                                        className="bg-primary"
                                    >
                                        Post Note
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-8">
                                {logs.map((log) => {
                                    const isStatusChange = log.action === 'status_change';
                                    return (
                                        <div key={log.id} className="relative pl-8">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[9px] top-0 shadow-sm bg-white rounded-full p-[2px]">
                                                <Circle size={14} className="fill-blue-500 text-blue-500" />
                                            </div>

                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-800">{log.performed_by}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {dayjs(log.created_at).fromNow()} • {dayjs(log.created_at).format('MMM D, YYYY h:mm A')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-700 mt-1">
                                                {log.action === 'created' ? 'Quotation Created' :
                                                    log.action === 'status_change' ? 'Status Changed' : log.action}
                                            </div>
                                            {log.details && (
                                                <div className={`mt-2 text-sm p-3 rounded-lg border ${log.action === 'note' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                    {log.details}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {id && !showChatter && (
                    <Button className="fixed right-0 top-16 z-50 rounded-l-full bg-indigo-600 border-none h-6 w-6 flex items-center justify-center p-0" onClick={() => setShowChatter(true)}>
                        <MessageSquare className="text-white" size={12} />
                    </Button>
                )}
            </div>

            <Modal title="Quotation Preview" open={isPreviewVisible} onCancel={() => setIsPreviewVisible(false)} width={800} footer={<Button onClick={() => setIsPreviewVisible(false)}>Close</Button>}>
                <div className="p-8 border shadow-sm rounded bg-white font-serif">
                    <div className="flex justify-between mb-8">
                        <Title level={3}>QUOTATION</Title>
                        <Text>Ref: {form.getFieldValue('quotation_number')}</Text>
                    </div>
                    <Row className="mb-8">
                        <Col span={12}><Text type="secondary">Customer:</Text><div className="font-bold text-lg">{contacts.find(c => c.id === form.getFieldValue('contact_id'))?.name}</div></Col>
                        <Col span={12} className="text-right"><Text type="secondary">Status:</Text><div className="font-bold uppercase text-primary">{status}</div></Col>
                    </Row>
                    <Table dataSource={orderLines} columns={[{ title: 'Product', dataIndex: 'product_name' }, { title: 'Qty', dataIndex: 'quantity', align: 'right' }, { title: 'Unit Price', dataIndex: 'unit_price', align: 'right', render: p => formatCurrency(p) }, { title: 'Subtotal', align: 'right', render: (_, r) => formatCurrency(r.quantity * r.unit_price) }]} pagination={false} size="small" />
                    <div className="flex justify-end mt-8"><div className="w-48 text-right space-y-1"><div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between text-xl font-bold border-t pt-2"><span>Total:</span><span>{formatCurrency(subtotal)}</span></div></div></div>
                </div>
            </Modal>
            <Modal
                title="Create invoices"
                open={isInvoiceModalVisible}
                onCancel={() => setIsInvoiceModalVisible(false)}
                footer={null}
                width={600}
            >
                <div className="py-4">
                    <Form layout="vertical">
                        <Form.Item label="Create Invoice">
                            <Select
                                value={invoiceType}
                                onChange={(val: any) => setInvoiceType(val)}
                                className="w-full"
                            >
                                <Option value="regular">Regular invoice</Option>
                                <Option value="percentage">Down payment (percentage)</Option>
                                <Option value="fixed">Down payment (fixed amount)</Option>
                            </Select>
                        </Form.Item>

                        {invoiceType === 'percentage' && (
                            <Form.Item label="Down Payment Amount (Percentage)">
                                <InputNumber
                                    min={0}
                                    max={100}
                                    suffix="%"
                                    className="w-full"
                                    value={downPaymentPercent}
                                    onChange={val => setDownPaymentPercent(val || 0)}
                                />
                            </Form.Item>
                        )}

                        {invoiceType === 'fixed' && (
                            <Form.Item label="Down Payment Amount (Fixed)">
                                <InputNumber
                                    min={0}
                                    prefix="₹"
                                    className="w-full"
                                    value={downPaymentAmount}
                                    onChange={val => setDownPaymentAmount(val || 0)}
                                />
                            </Form.Item>
                        )}

                        <div className="flex gap-2 mt-8">
                            <Button
                                type="primary"
                                className="bg-indigo-600"
                                onClick={handleCreateInvoice}
                                loading={invoiceLoading}
                            >
                                Create Draft Invoice
                            </Button>
                            <Button onClick={() => setIsInvoiceModalVisible(false)}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal>
        </div >
    );
};

export default AddQuotation;

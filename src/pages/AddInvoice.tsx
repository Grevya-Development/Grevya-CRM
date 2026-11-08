import React, { useEffect, useState } from 'react';
import {
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    Row,
    Col,
    Typography,
    Tabs,
    Table,
    InputNumber,
    Divider,
    message,
    Tag,
    Space,
    Timeline,
    Badge,
    Modal
} from 'antd';
import {
    Save,
    X,
    Trash2,
    FileText,
    History,
    MessageSquare,
    ChevronRight,
    CheckCircle,
    Printer,
    CreditCard,
    RotateCcw,
    Eye,
    Send,
    ArrowLeft,
    Circle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { supabase } from '../supabase/supabaseClient';
import { Contact, Product, Invoice, InvoiceItem } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { StageProgress } from '@/components/Leads/StageProgress';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

interface InvoiceLog {
    id: string;
    action: string;
    performed_by: string;
    details: string;
    created_at: string;
}

const AddInvoice = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { formatCurrency } = useCurrency();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [status, setStatus] = useState<'draft' | 'posted' | 'cancelled' | 'paid'>('draft');
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [paymentForm] = Form.useForm();
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [logs, setLogs] = useState<InvoiceLog[]>([]);
    const [showChatter, setShowChatter] = useState(true);
    const [noteText, setNoteText] = useState('');
    const [confirmLoading, setConfirmLoading] = useState(false);

    const INVOICE_STAGES = [
        { key: 'draft', label: 'Draft', activeColor: '#0b66f4' },
        { key: 'posted', label: 'Posted', activeColor: '#059669' },
        { key: 'paid', label: 'Paid', activeColor: '#10b981' },
    ];


    useEffect(() => {
        fetchContacts();
        fetchProducts();
        if (id) {
            fetchInvoice();
            fetchLogs();
            subscribeToInvoice();
        }
    }, [id]);

    const fetchContacts = async () => {
        const { data } = await supabase.from('contacts').select('*').order('name');
        if (data) setContacts(data);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('status', 'active');
        if (data) setProducts(data);
    };

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('*, invoice_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setInvoice(data);
                setStatus(data.status);
                form.setFieldsValue({
                    ...data,
                    invoice_date: data.invoice_date ? dayjs(data.invoice_date) : null,
                });
                setItems(data.invoice_items.map((item: any) => ({ ...item, key: item.id })));
            }
        } catch (err) {
            console.error(err);
            message.error('Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('invoice_logs')
            .select('*')
            .eq('invoice_id', id)
            .order('created_at', { ascending: false });
        if (data) setLogs(data);
    };

    const subscribeToInvoice = () => {
        const channel = supabase
            .channel(`invoice_updates_${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'invoices',
                filter: `id=eq.${id}`
            }, (payload: any) => {
                if (payload.new) {
                    setStatus(payload.new.status);
                    setInvoice(payload.new);
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'invoice_logs',
                filter: `invoice_id=eq.${id}`
            }, (payload: any) => {
                setLogs(prev => [payload.new as InvoiceLog, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const addLog = async (action: string, details: string) => {
        if (!id) return;
        await supabase.from('invoice_logs').insert({
            invoice_id: id,
            action,
            details,
            performed_by: 'Mitchell Admin'
        });
    };

    const handleConfirm = async () => {
        try {
            setConfirmLoading(true);
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'posted', updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            await addLog('status_change', 'Draft → Posted (Status)');
            message.success('Invoice confirmed and posted');
            fetchInvoice();
            fetchLogs();
        } catch (err) {
            console.error(err);
            message.error('Failed to confirm invoice');
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleResetToDraft = async () => {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'draft', updated_at: new Date().toISOString(), amount_due: invoice?.total_amount || 0 })
                .eq('id', id);

            if (error) throw error;
            await addLog('status_change', 'Posted → Draft (Status)');
            message.success('Invoice reset to draft');
            fetchInvoice();
            fetchLogs();
        } catch (err) {
            console.error(err);
            message.error('Failed to reset invoice');
        }
    };

    const handleCreatePayment = async (values: any) => {
        try {
            setPaymentLoading(true);
            const paymentData = {
                invoice_id: id,
                journal: values.journal,
                payment_method: 'manual',
                amount: values.amount,
                payment_date: values.payment_date.format('YYYY-MM-DD'),
                memo: values.memo,
            };

            const { error: paymentError } = await supabase.from('payments').insert(paymentData);
            if (paymentError) throw paymentError;

            const { error: invoiceError } = await supabase
                .from('invoices')
                .update({
                    status: 'paid',
                    amount_due: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (invoiceError) throw invoiceError;

            await addLog('payment', `Payment of ${formatCurrency(values.amount)} registered via ${values.journal}`);
            await addLog('status_change', 'Posted → Paid (Status)');

            message.success('Payment registered successfully');
            setIsPaymentModalVisible(false);
            paymentForm.resetFields();
            fetchInvoice();
            fetchLogs();
        } catch (err) {
            console.error(err);
            message.error('Failed to register payment');
        } finally {
            setPaymentLoading(false);
        }
    };

    const postNote = async () => {
        if (!noteText.trim() || !id) return;
        await addLog('note', noteText);
        setNoteText('');
        message.success('Note posted');
        fetchLogs();
    };

    const updateStatus = async (newStatus: string) => {
        if (newStatus === status) return;
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            await addLog('status_change', `Status: ${status} → ${newStatus}`);
            message.success(`Invoice updated to ${newStatus}`);
            fetchInvoice();
            fetchLogs();
        } catch (err) {
            console.error(err);
            message.error('Failed to update status');
        }
    };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'product_name',
            key: 'product_name',
            width: '30%',
            render: (text: string) => <span className="font-medium">{text || 'Custom Item'}</span>
        },
        {
            title: 'Label',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'right' as const,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            width: 120,
            align: 'right' as const,
            render: (price: number) => formatCurrency(price)
        },
        {
            title: 'Taxes',
            dataIndex: 'taxes',
            key: 'taxes',
            width: 120,
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            width: 120,
            align: 'right' as const,
            render: (total: number) => <span className="font-bold">{formatCurrency(total)}</span>
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Header title={status === 'draft' ? "Draft Invoice" : invoice?.invoice_number || "Invoice"} />

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
                            {status === 'draft' && (
                                <>
                                    <Button type="primary" className="bg-indigo-600" onClick={handleConfirm} loading={confirmLoading}>Confirm</Button>
                                    <Button icon={<Eye size={16} />}>Preview</Button>
                                    <Button onClick={() => updateStatus('cancelled')}>Cancel</Button>
                                </>
                            )}
                            {status === 'posted' && (
                                <>
                                    <Button icon={<Send size={16} />}>Send & Print</Button>
                                    <Button
                                        type="primary"
                                        className="bg-indigo-600 outline outline-indigo-200"
                                        icon={<CreditCard size={16} />}
                                        onClick={() => {
                                            paymentForm.setFieldsValue({
                                                journal: 'bank',
                                                amount: invoice?.amount_due,
                                                payment_date: dayjs(),
                                                memo: invoice?.invoice_number
                                            });
                                            setIsPaymentModalVisible(true);
                                        }}
                                    >
                                        Register Payment
                                    </Button>
                                    <Button icon={<Eye size={16} />}>Preview</Button>
                                    <Button>Credit Note</Button>
                                    <Button icon={<RotateCcw size={16} />} onClick={handleResetToDraft}>Reset to Draft</Button>
                                </>
                            )}
                            {status === 'paid' && (
                                <>
                                    <Button icon={<Send size={16} />}>Send & Print</Button>
                                    <Button icon={<Eye size={16} />}>Preview</Button>
                                    <Button>Credit Note</Button>
                                    <Button icon={<RotateCcw size={16} />} onClick={handleResetToDraft}>Reset to Draft</Button>
                                </>
                            )}

                            {status === 'cancelled' && (
                                <Button icon={<RotateCcw size={16} />} onClick={handleResetToDraft}>Reset to Draft</Button>
                            )}
                        </Space>
                    </div>

                    {/* Stage Progress */}
                    <div className="mb-8">
                        <StageProgress
                            currentStage={status}
                            stages={INVOICE_STAGES}
                            onStageChange={updateStatus}
                            logs={logs || []}
                            readOnly={true}
                        />
                    </div>

                    <Form form={form} layout="vertical">
                        <div className="mb-8 relative">
                            <Title level={2} className="mb-0">
                                {status === 'draft' ? `Draft Invoice` : invoice?.invoice_number}
                            </Title>
                            {status === 'paid' && (
                                <div className="absolute top-0 right-0 overflow-hidden w-32 h-32 -mr-8 -mt-6 pointer-events-none">
                                    <div className="bg-green-500 text-white text-xs font-bold py-1 px-10 transform rotate-45 translate-x-10 translate-y-4 shadow-lg border-2 border-white/20 uppercase tracking-widest text-center">
                                        Paid
                                    </div>
                                </div>
                            )}
                        </div>


                        <Row gutter={48}>
                            <Col span={12}>
                                <Form.Item label="Customer" name="contact_id">
                                    <Select disabled={status === 'posted'}>
                                        {contacts.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Payment Reference" name="payment_reference">
                                    <Input disabled={status === 'posted'} placeholder="e.g. INV/2026/0001" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Invoice Date" name="invoice_date">
                                    <DatePicker className="w-full" disabled={status === 'posted'} />
                                </Form.Item>
                                <Form.Item label="Payment Terms" name="payment_terms">
                                    <Select disabled={status === 'posted'}>
                                        <Option value="immediate">Immediate Payment</Option>
                                        <Option value="15">15 Days</Option>
                                        <Option value="30">30 Days</Option>
                                        <Option value="end_of_month">End of Following Month</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Tabs items={[
                            {
                                key: 'lines',
                                label: 'Invoice Lines',
                                children: (
                                    <div className="mt-4">
                                        <Table dataSource={items} columns={columns} pagination={false} size="middle" />
                                        <div className="flex justify-end mt-8">
                                            <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-lg border">
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Untaxed Amount:</span>
                                                    <span className="font-medium">{formatCurrency(invoice?.subtotal || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Taxes:</span>
                                                    <span className="font-medium">{formatCurrency(invoice?.total_tax || 0)}</span>
                                                </div>
                                                <Divider className="my-2" />
                                                <div className="flex justify-between text-2xl font-bold text-slate-900 pt-2">
                                                    <span>Total:</span>
                                                    <span>{formatCurrency(invoice?.total_amount || 0)}</span>
                                                </div>
                                                {(status === 'posted' || status === 'paid') && (
                                                    <div className={`flex justify-between font-bold border-t pt-2 ${status === 'paid' ? 'text-green-600 border-green-100' : 'text-primary border-primary/20'}`}>
                                                        <span>Amount Due:</span>
                                                        <span>{formatCurrency(invoice?.amount_due || 0)}</span>
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'other',
                                label: 'Other Info',
                                children: (
                                    <div className="py-4">
                                        <Row gutter={48}>
                                            <Col span={12}>
                                                <Title level={5}>Invoice Information</Title>
                                                <Form.Item label="Customer Reference" name="customer_reference"><Input disabled={status === 'posted'} /></Form.Item>
                                                <Form.Item label="Salesperson" name="salesperson"><Input disabled={status === 'posted'} /></Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Title level={5}>Accounting</Title>
                                                <Form.Item label="Journal" name="journal"><Input disabled={status === 'posted'} defaultValue="Customer Invoices (INR)" /></Form.Item>
                                                <Form.Item label="Currency" name="currency"><Input disabled={status === 'posted'} defaultValue="INR" /></Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                )
                            }
                        ]} />
                    </Form>
                </div>

                {/* Notes & Activity Sidebar */}
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
                                <div className="flex justify-end gap-2">
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
                                    return (
                                        <div key={log.id} className="relative pl-8">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[9px] top-0 shadow-sm bg-white rounded-full p-[2px]">
                                                <Circle size={14} className="fill-primary text-primary" />
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
                                                {log.action === 'status_change' ? 'Status Changed' : log.action}
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

            <Modal
                title="Register Payment"
                open={isPaymentModalVisible}
                onCancel={() => setIsPaymentModalVisible(false)}
                footer={null}
                width={800}
                centered
            >
                <Form
                    form={paymentForm}
                    layout="vertical"
                    onFinish={handleCreatePayment}
                    className="mt-4"
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item label="Journal" name="journal" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="bank">Bank</Option>
                                    <Option value="cash">Cash</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Payment Method" name="payment_method">
                                <span className="text-slate-500">Manual</span>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
                                <InputNumber
                                    className="w-full"
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                    addonAfter={invoice?.currency || 'INR'}
                                />
                            </Form.Item>
                            <Form.Item label="Payment Date" name="payment_date" rules={[{ required: true }]}>
                                <DatePicker className="w-full" />
                            </Form.Item>
                            <Form.Item label="Memo" name="memo">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-start gap-2 mt-8">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="bg-indigo-600"
                            loading={paymentLoading}
                        >
                            Create Payment
                        </Button>
                        <Button onClick={() => setIsPaymentModalVisible(false)}>
                            Discard
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>

    );
};

export default AddInvoice;

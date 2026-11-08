import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Input, Space, Card, Typography } from 'antd';
import { Search, Plus, Eye, FileText, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/supabaseClient';
import { Invoice } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const InvoicesManagement = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('*, crm_customers(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Invoice Number',
            dataIndex: 'invoice_number',
            key: 'invoice_number',
            render: (text: string, record: any) => (
                <Button type="link" onClick={() => navigate(`/invoices/${record.id}`)} className="p-0 font-bold">
                    {text}
                </Button>
            ),
        },
        {
            title: 'Customer',
            dataIndex: 'crm_customers',
            key: 'customer',
            render: (customer: any) => customer?.name || 'Unknown',
        },
        {
            title: 'Date',
            dataIndex: 'invoice_date',
            key: 'date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Amount',
            dataIndex: 'total_amount',
            key: 'amount',
            align: 'right' as const,
            render: (amount: number) => formatCurrency(amount),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'gold';
                if (status === 'posted') color = 'green';
                if (status === 'cancelled') color = 'red';
                return <Tag color={color} className="uppercase">{status}</Tag>;
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: Invoice) => (
                <Space>
                    <Button icon={<Eye size={16} />} onClick={() => navigate(`/invoices/${record.id}`)} />
                </Space>
            ),
        },
    ];

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchText.toLowerCase()) ||
        (inv as any).crm_customers?.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Card className="shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={4} className="mb-0">Customer Invoices</Title>
                    <Text type="secondary">View and manage all customer invoices</Text>
                </div>
            </div>

            <div className="flex justify-between mb-4 gap-4">
                <Input
                    placeholder="Search invoices..."
                    prefix={<Search size={16} className="text-slate-400" />}
                    className="max-w-md"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
                <Button icon={<Filter size={16} />}>Filters</Button>
            </div>

            <Table
                columns={columns}
                dataSource={filteredInvoices}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
};

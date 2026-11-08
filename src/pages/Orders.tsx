import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CircleDollarSign, FileClock, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/supabase/supabaseClient';
import { useCurrency } from '@/hooks/useCurrency';
import {
  EmptyState,
  ListSurface,
  SearchField,
  StatTile,
  StatusPill,
  clickableRow,
  formatDate,
  includesText,
  recordLinkClass,
} from './SalesListKit';

// AddQuotation.tsx sets status 'sales_order' when the user clicks "Confirm Order"
// (quotation statuses: 'draft' | 'sent' | 'sales_order' | 'cancelled').
const SALES_ORDER_STATUS = 'sales_order';

interface OrderRow {
  id: string;
  quotation_number: string | null;
  salesperson: string | null;
  total_amount: number | null;
  created_at: string;
  crm_customers: { name: string | null } | null;
}

type InvoiceState = 'invoiced' | 'partial' | 'none';

export default function Orders() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  // Sum of non-cancelled invoice totals per quotation id.
  const [invoicedByOrder, setInvoicedByOrder] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    const [ordRes, invRes] = await Promise.all([
      supabase
        .from('quotations')
        .select('id, quotation_number, salesperson, total_amount, created_at, crm_customers(name)')
        .eq('status', SALES_ORDER_STATUS)
        .order('created_at', { ascending: false }),
      supabase.from('invoices').select('quotation_id, total_amount, status').not('quotation_id', 'is', null),
    ]);
    if (ordRes.error) {
      console.error(ordRes.error);
      toast.error('Could not load sales orders');
      setLoadFailed(true);
      setOrders([]);
    } else {
      setOrders((ordRes.data ?? []) as unknown as OrderRow[]);
    }
    if (invRes.error) {
      console.error(invRes.error);
      toast.error('Could not load invoice status for orders');
    } else {
      const map = new Map<string, number>();
      (invRes.data as { quotation_id: string; total_amount: number | null; status: string }[]).forEach((inv) => {
        if (inv.status === 'cancelled') return;
        map.set(inv.quotation_id, (map.get(inv.quotation_id) ?? 0) + (Number(inv.total_amount) || 0));
      });
      setInvoicedByOrder(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invoiceState = useCallback(
    (o: OrderRow): InvoiceState => {
      if (!invoicedByOrder.has(o.id)) return 'none';
      const invoiced = invoicedByOrder.get(o.id) ?? 0;
      const total = Number(o.total_amount) || 0;
      // Down-payment invoices cover only part of the order.
      return invoiced + 0.005 >= total ? 'invoiced' : 'partial';
    },
    [invoicedByOrder],
  );

  const stats = useMemo(() => {
    let value = 0;
    let toInvoice = 0;
    let toInvoiceValue = 0;
    for (const o of orders) {
      const total = Number(o.total_amount) || 0;
      value += total;
      if (invoiceState(o) !== 'invoiced') {
        toInvoice += 1;
        toInvoiceValue += Math.max(0, total - (invoicedByOrder.get(o.id) ?? 0));
      }
    }
    return { count: orders.length, value, toInvoice, toInvoiceValue };
  }, [orders, invoiceState, invoicedByOrder]);

  const filtered = useMemo(
    () => orders.filter((o) => includesText([o.quotation_number, o.crm_customers?.name, o.salesperson], search)),
    [orders, search],
  );

  const columns: ColumnsType<OrderRow> = [
    {
      title: 'Number',
      dataIndex: 'quotation_number',
      key: 'number',
      render: (num: string | null, r) => (
        <button type="button" className={recordLinkClass} onClick={() => navigate(`/quotations/${r.id}`)}>
          {num || 'Untitled order'}
        </button>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => <span className="text-slate-700">{r.crm_customers?.name || '—'}</span>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      render: (d: string) => <span className="whitespace-nowrap text-slate-600">{formatDate(d)}</span>,
    },
    {
      title: 'Salesperson',
      dataIndex: 'salesperson',
      key: 'salesperson',
      render: (s: string | null) => <span className="text-slate-600">{s || '—'}</span>,
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total',
      align: 'right',
      sorter: (a, b) => (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0),
      render: (v: number | null) => <span className="whitespace-nowrap font-medium text-slate-900">{formatCurrency(Number(v) || 0)}</span>,
    },
    {
      title: 'Invoiced',
      key: 'invoiced',
      render: (_, r) => {
        const s = invoiceState(r);
        if (s === 'invoiced') return <StatusPill label="Invoiced" tone="emerald" />;
        if (s === 'partial') return <StatusPill label="Partly invoiced" tone="blue" />;
        return <StatusPill label="To invoice" tone="amber" />;
      },
    },
  ];

  const newQuotation = (
    <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => navigate('/quotations/new')}>
      New Quotation
    </Button>
  );

  const emptyText = loading ? (
    ' '
  ) : loadFailed ? (
    <EmptyState
      icon={ShoppingCart}
      title="Couldn't load sales orders"
      description="Check your connection and try again."
      action={<Button onClick={load}>Retry</Button>}
    />
  ) : orders.length === 0 ? (
    <EmptyState
      icon={ShoppingCart}
      title="No sales orders yet"
      description='A quotation becomes a sales order when you click "Confirm Order" on it.'
      action={newQuotation}
    />
  ) : (
    <EmptyState
      icon={ShoppingCart}
      title="No orders match"
      description="Try a different search."
      action={<Button onClick={() => setSearch('')}>Clear search</Button>}
    />
  );

  return (
    <div className="min-h-screen w-full">
      <Header title="Sales Orders" subtitle="Confirmed quotations ready to invoice" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Orders" value={stats.count} icon={ShoppingCart} tone="blue" loading={loading} />
          <StatTile label="Total value" value={formatCurrency(stats.value)} icon={CircleDollarSign} tone="emerald" loading={loading} />
          <StatTile
            label="To invoice"
            value={stats.toInvoice}
            hint={`${formatCurrency(stats.toInvoiceValue)} not yet invoiced`}
            icon={FileClock}
            tone="amber"
            loading={loading}
          />
        </div>

        <ListSurface
          toolbar={
            <>
              <SearchField
                label="Search sales orders"
                placeholder="Search by number, customer or salesperson"
                value={search}
                onChange={setSearch}
              />
              {newQuotation}
            </>
          }
        >
          <Table<OrderRow>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{ emptyText }}
            onRow={(r) => clickableRow(() => navigate(`/quotations/${r.id}`))}
            pagination={filtered.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          />
        </ListSurface>
      </div>
    </div>
  );
}

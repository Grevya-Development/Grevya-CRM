import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarCheck, HandCoins, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/supabase/supabaseClient';
import { useCurrency } from '@/hooks/useCurrency';
import {
  EmptyState,
  ListSurface,
  SearchField,
  StatTile,
  clickableRow,
  formatDate,
  includesText,
  recordLinkClass,
} from './SalesListKit';

interface PaymentRow {
  id: string;
  invoice_id: string;
  amount: number | null;
  payment_date: string | null;
  journal: string | null; // 'bank' | 'cash' (AddInvoice register-payment modal)
  memo: string | null;
  created_at: string;
  invoices: { invoice_number: string | null; crm_customers: { name: string | null } | null } | null;
}

const journalLabel = (j: string | null) => (j ? j.charAt(0).toUpperCase() + j.slice(1) : '—');

export default function Payments() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    const { data, error } = await supabase
      .from('payments')
      .select('id, invoice_id, amount, payment_date, journal, memo, created_at, invoices(invoice_number, crm_customers(name))')
      .order('payment_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Could not load payments');
      setLoadFailed(true);
      setPayments([]);
    } else {
      setPayments((data ?? []) as unknown as PaymentRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    let total = 0;
    let month = 0;
    let monthCount = 0;
    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      total += amt;
      if (p.payment_date && p.payment_date >= monthStart) {
        month += amt;
        monthCount += 1;
      }
    }
    return { total, month, monthCount, count: payments.length };
  }, [payments]);

  const filtered = useMemo(
    () =>
      payments.filter((p) =>
        includesText([p.invoices?.invoice_number, p.invoices?.crm_customers?.name, p.journal, p.memo], search),
      ),
    [payments, search],
  );

  const columns: ColumnsType<PaymentRow> = [
    {
      title: 'Payment date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      sorter: (a, b) => (a.payment_date ?? '').localeCompare(b.payment_date ?? ''),
      render: (d: string | null) => <span className="whitespace-nowrap text-slate-700">{formatDate(d)}</span>,
    },
    {
      title: 'Invoice',
      key: 'invoice',
      render: (_, r) => (
        <Link to={`/invoices/${r.invoice_id}`} className={recordLinkClass}>
          {r.invoices?.invoice_number || 'View invoice'}
        </Link>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => <span className="text-slate-700">{r.invoices?.crm_customers?.name || '—'}</span>,
    },
    {
      title: 'Journal',
      dataIndex: 'journal',
      key: 'journal',
      render: (j: string | null) => <span className="text-slate-600">{journalLabel(j)}</span>,
    },
    {
      title: 'Memo',
      dataIndex: 'memo',
      key: 'memo',
      render: (m: string | null) => <span className="text-slate-600">{m || '—'}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0),
      render: (v: number | null) => <span className="whitespace-nowrap font-medium text-slate-900">{formatCurrency(Number(v) || 0)}</span>,
    },
  ];

  const emptyText = loading ? (
    ' '
  ) : loadFailed ? (
    <EmptyState
      icon={Wallet}
      title="Couldn't load payments"
      description="Check your connection and try again."
      action={<Button onClick={load}>Retry</Button>}
    />
  ) : payments.length === 0 ? (
    <EmptyState
      icon={Wallet}
      title="No payments yet"
      description='Payments appear here when you click "Register Payment" on a posted invoice.'
    />
  ) : (
    <EmptyState
      icon={Wallet}
      title="No payments match"
      description="Try a different search."
      action={<Button onClick={() => setSearch('')}>Clear search</Button>}
    />
  );

  return (
    <div className="min-h-screen w-full">
      <Header title="Payments" subtitle="Customer payments registered against invoices" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Total received"
            value={formatCurrency(stats.total)}
            hint={`${stats.count} ${stats.count === 1 ? 'payment' : 'payments'}`}
            icon={HandCoins}
            tone="emerald"
            loading={loading}
          />
          <StatTile
            label="This month"
            value={formatCurrency(stats.month)}
            hint={`${stats.monthCount} ${stats.monthCount === 1 ? 'payment' : 'payments'} since ${dayjs().startOf('month').format('D MMM')}`}
            icon={CalendarCheck}
            tone="blue"
            loading={loading}
          />
          <StatTile
            label="Average payment"
            value={formatCurrency(stats.count ? stats.total / stats.count : 0)}
            icon={Wallet}
            tone="slate"
            loading={loading}
          />
        </div>

        <ListSurface
          toolbar={
            <SearchField
              label="Search payments"
              placeholder="Search by invoice, customer, journal or memo"
              value={search}
              onChange={setSearch}
            />
          }
        >
          <Table<PaymentRow>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{ emptyText }}
            onRow={(r) => clickableRow(() => navigate(`/invoices/${r.invoice_id}`))}
            pagination={filtered.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          />
        </ListSurface>
      </div>
    </div>
  );
}

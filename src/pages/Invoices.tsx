import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CircleDollarSign, FileClock, FilePen, ReceiptText, Wallet } from 'lucide-react';
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
  StatusPill,
  clickableRow,
  formatDate,
  includesText,
  recordLinkClass,
  type PillTone,
} from './SalesListKit';

// Status values written by src/pages/AddInvoice.tsx and AddQuotation.tsx (handleCreateInvoice):
// 'draft' | 'posted' | 'paid' | 'cancelled'.
type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'cancelled';

const STATUS_META: Record<InvoiceStatus, { label: string; tone: PillTone }> = {
  draft: { label: 'Draft', tone: 'slate' },
  posted: { label: 'Posted', tone: 'blue' },
  paid: { label: 'Paid', tone: 'emerald' },
  cancelled: { label: 'Cancelled', tone: 'rose' },
};

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  invoice_date: string | null;
  payment_terms: string | null;
  total_amount: number | null;
  amount_due: number | null;
  created_at: string;
  crm_customers: { name: string | null } | null;
}

type Filter = 'all' | InvoiceStatus;

/**
 * The invoices table has no due-date column, so the due date is derived from
 * invoice_date + payment terms. Terms are stored either as a payment_terms.name
 * (copied from the quotation) or as the AddInvoice select values
 * 'immediate' | '15' | '30' | 'end_of_month'.
 */
function dueDateFor(inv: InvoiceRow, termDays: Map<string, number>): string | null {
  if (!inv.invoice_date) return null;
  const base = dayjs(inv.invoice_date);
  const terms = (inv.payment_terms ?? '').trim();
  if (!terms) return null;
  if (terms === 'immediate') return base.format('YYYY-MM-DD');
  if (terms === 'end_of_month') return base.add(1, 'month').endOf('month').format('YYYY-MM-DD');
  if (/^\d+$/.test(terms)) return base.add(Number(terms), 'day').format('YYYY-MM-DD');
  const days = termDays.get(terms.toLowerCase());
  return days === undefined ? null : base.add(days, 'day').format('YYYY-MM-DD');
}

export default function Invoices() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [termDays, setTermDays] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    const [invRes, termsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, invoice_date, payment_terms, total_amount, amount_due, created_at, crm_customers(name)',
        )
        .order('created_at', { ascending: false }),
      supabase.from('payment_terms').select('name, days'),
    ]);
    if (invRes.error) {
      console.error(invRes.error);
      toast.error('Could not load invoices');
      setLoadFailed(true);
      setInvoices([]);
    } else {
      setInvoices((invRes.data ?? []) as unknown as InvoiceRow[]);
    }
    // Payment terms only refine the due date; ignore failures.
    if (!termsRes.error && termsRes.data) {
      setTermDays(
        new Map(
          (termsRes.data as { name: string; days: number }[]).map((t) => [t.name.trim().toLowerCase(), Number(t.days) || 0]),
        ),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    let invoiced = 0;
    let outstanding = 0;
    let outstandingCount = 0;
    let paid = 0;
    let paidCount = 0;
    let drafts = 0;
    for (const inv of invoices) {
      const total = Number(inv.total_amount) || 0;
      if (inv.status === 'posted' || inv.status === 'paid') invoiced += total;
      if (inv.status === 'posted') {
        outstanding += Number(inv.amount_due) || 0;
        outstandingCount += 1;
      }
      if (inv.status === 'paid') {
        paid += total;
        paidCount += 1;
      }
      if (inv.status === 'draft') drafts += 1;
    }
    return { invoiced, outstanding, outstandingCount, paid, paidCount, drafts };
  }, [invoices]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: invoices.length, draft: 0, posted: 0, paid: 0, cancelled: 0 };
    invoices.forEach((inv) => {
      if (inv.status in c) c[inv.status] += 1;
    });
    return c;
  }, [invoices]);

  const filtered = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          (filter === 'all' || inv.status === filter) &&
          includesText([inv.invoice_number, inv.crm_customers?.name], search),
      ),
    [invoices, filter, search],
  );

  const today = dayjs().format('YYYY-MM-DD');

  const columns: ColumnsType<InvoiceRow> = [
    {
      title: 'Number',
      dataIndex: 'invoice_number',
      key: 'number',
      render: (num: string | null, r) => (
        <button type="button" className={recordLinkClass} onClick={() => navigate(`/invoices/${r.id}`)}>
          {num || 'Draft invoice'}
        </button>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => <span className="text-slate-700">{r.crm_customers?.name || '—'}</span>,
    },
    {
      title: 'Invoice date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      sorter: (a, b) => (a.invoice_date ?? '').localeCompare(b.invoice_date ?? ''),
      render: (d: string | null) => <span className="whitespace-nowrap text-slate-600">{formatDate(d)}</span>,
    },
    {
      title: 'Due date',
      key: 'due_date',
      render: (_, r) => {
        const due = dueDateFor(r, termDays);
        const overdue = !!due && r.status === 'posted' && (Number(r.amount_due) || 0) > 0 && due < today;
        return (
          <span className={overdue ? 'whitespace-nowrap font-medium text-rose-600' : 'whitespace-nowrap text-slate-600'}>
            {formatDate(due)}
            {overdue && <span className="ml-1 text-xs">(overdue)</span>}
          </span>
        );
      },
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
      title: 'Amount due',
      dataIndex: 'amount_due',
      key: 'amount_due',
      align: 'right',
      render: (v: number | null, r) => {
        const due = r.status === 'paid' || r.status === 'cancelled' ? 0 : Number(v) || 0;
        return (
          <span className={due > 0 ? 'whitespace-nowrap font-medium text-slate-900' : 'whitespace-nowrap text-slate-400'}>
            {formatCurrency(due)}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: InvoiceStatus) => {
        const meta = STATUS_META[s] ?? { label: s, tone: 'slate' as PillTone };
        return <StatusPill label={meta.label} tone={meta.tone} />;
      },
    },
  ];

  const emptyText = loading ? (
    ' '
  ) : loadFailed ? (
    <EmptyState
      icon={ReceiptText}
      title="Couldn't load invoices"
      description="Check your connection and try again."
      action={<Button onClick={load}>Retry</Button>}
    />
  ) : invoices.length === 0 ? (
    <EmptyState icon={ReceiptText} title="No invoices yet" description="No invoices yet. Create one from a confirmed sales order." />
  ) : (
    <EmptyState
      icon={ReceiptText}
      title="No invoices match"
      description="Try a different search or status."
      action={
        <Button
          onClick={() => {
            setSearch('');
            setFilter('all');
          }}
        >
          Clear filters
        </Button>
      }
    />
  );

  const filterOptions: { label: string; value: Filter }[] = [
    { label: `All (${counts.all})`, value: 'all' },
    { label: `Draft (${counts.draft})`, value: 'draft' },
    { label: `Posted (${counts.posted})`, value: 'posted' },
    { label: `Paid (${counts.paid})`, value: 'paid' },
    { label: `Cancelled (${counts.cancelled})`, value: 'cancelled' },
  ];

  return (
    <div className="min-h-screen w-full">
      <Header title="Invoices" subtitle="Customer invoices raised from confirmed sales orders" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Total invoiced"
            value={formatCurrency(stats.invoiced)}
            hint="Posted and paid invoices"
            icon={CircleDollarSign}
            tone="blue"
            loading={loading}
          />
          <StatTile
            label="Outstanding"
            value={formatCurrency(stats.outstanding)}
            hint={`${stats.outstandingCount} posted ${stats.outstandingCount === 1 ? 'invoice' : 'invoices'} awaiting payment`}
            icon={FileClock}
            tone="amber"
            loading={loading}
          />
          <StatTile
            label="Paid"
            value={formatCurrency(stats.paid)}
            hint={`${stats.paidCount} paid ${stats.paidCount === 1 ? 'invoice' : 'invoices'}`}
            icon={Wallet}
            tone="emerald"
            loading={loading}
          />
          <StatTile label="Drafts" value={stats.drafts} hint="Not yet posted" icon={FilePen} tone="slate" loading={loading} />
        </div>

        <ListSurface
          toolbar={
            <>
              <SearchField
                label="Search invoices"
                placeholder="Search by number or customer"
                value={search}
                onChange={setSearch}
              />
              <Segmented<Filter>
                aria-label="Filter by status"
                options={filterOptions}
                value={filter}
                onChange={(v) => setFilter(v)}
                className="max-w-full overflow-x-auto"
              />
            </>
          }
        >
          <Table<InvoiceRow>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{ emptyText }}
            onRow={(r) => clickableRow(() => navigate(`/invoices/${r.id}`))}
            pagination={filtered.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          />
        </ListSurface>
      </div>
    </div>
  );
}

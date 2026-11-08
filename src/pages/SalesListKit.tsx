import type { MouseEvent, ReactNode } from 'react';
import { Input } from 'antd';
import { Search, type LucideIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

// Shared building blocks for the Invoices, Sales Orders and Payments list pages.
// Visual language follows the stat tiles on src/pages/Leads.tsx.

type Tone = 'blue' | 'amber' | 'emerald' | 'slate' | 'rose' | 'indigo';

const toneClasses: Record<Tone, { card: string; icon: string; label: string }> = {
  blue: { card: 'border-blue-100 bg-blue-50/40', icon: 'text-blue-600', label: 'text-blue-700/70' },
  amber: { card: 'border-amber-100 bg-amber-50/40', icon: 'text-amber-600', label: 'text-amber-700/70' },
  emerald: { card: 'border-emerald-100 bg-emerald-50/40', icon: 'text-emerald-600', label: 'text-emerald-700/70' },
  slate: { card: 'border-slate-200 bg-slate-50/60', icon: 'text-slate-600', label: 'text-slate-600' },
  rose: { card: 'border-rose-100 bg-rose-50/40', icon: 'text-rose-600', label: 'text-rose-700/70' },
  indigo: { card: 'border-indigo-100 bg-indigo-50/40', icon: 'text-indigo-600', label: 'text-indigo-700/70' },
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
  loading = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  loading?: boolean;
}) {
  const t = toneClasses[tone];
  return (
    <div className={cn('rounded-xl border p-4', t.card)}>
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg bg-white p-2 shadow-sm', t.icon)} aria-hidden="true">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-[11px] font-bold uppercase tracking-wider', t.label)}>{label}</p>
          {loading ? (
            <div className="mt-1 h-6 w-24 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="truncate text-xl font-bold text-slate-900">{value}</p>
          )}
          {hint && !loading && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <Input
      allowClear
      aria-label={label}
      placeholder={placeholder}
      prefix={<Search size={16} className="text-slate-400" aria-hidden="true" />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:max-w-sm"
    />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-400" aria-hidden="true">
        <Icon size={24} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export type PillTone = 'slate' | 'blue' | 'emerald' | 'rose' | 'amber';

const pillClasses: Record<PillTone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        pillClasses[tone],
      )}
    >
      {label}
    </span>
  );
}

/** Card surface that wraps a list table. */
export function ListSurface({ toolbar, children }: { toolbar: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        {toolbar}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export const formatDate = (d?: string | null) => (d ? dayjs(d).format('DD MMM YYYY') : '—');

export const includesText = (haystack: (string | null | undefined)[], needle: string) => {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => (h ?? '').toLowerCase().includes(q));
};

/**
 * Row props for an antd Table so a mouse click anywhere on the row opens the record.
 * Keyboard users reach the record through the link button rendered in the first cell.
 */
export const clickableRow = (go: () => void) => ({
  onClick: (e: MouseEvent) => {
    // Let buttons/links inside the row handle their own clicks.
    if ((e.target as HTMLElement).closest('a,button')) return;
    go();
  },
  className: 'cursor-pointer',
});

/** Classes for the record-number button in the first column (visible focus ring). */
export const recordLinkClass =
  'rounded font-semibold text-[#0b66f4] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b66f4] focus-visible:ring-offset-2';

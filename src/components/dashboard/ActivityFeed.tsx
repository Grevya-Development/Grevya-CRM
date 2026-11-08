import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users, FileText, Receipt } from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ActivitySource = 'lead' | 'quotation' | 'invoice';

type ActivityItem = {
  id: string;
  source: ActivitySource;
  title: string;
  relatedTo: string;
  user: string;
  createdAt: string;
  href: string | null;
};

type Embedded<T> = T | T[] | null;

type LogRow = {
  id: string;
  action: string | null;
  details: string | null;
  performed_by: string | null;
  created_at: string;
};

type LeadLogRow = LogRow & { lead_id: string | null; crm_leads: Embedded<{ lead_name: string | null }> };
type QuotationLogRow = LogRow & {
  quotation_id: string | null;
  quotations: Embedded<{ quotation_number: string | null }>;
};
type InvoiceLogRow = LogRow & {
  invoice_id: string | null;
  invoices: Embedded<{ invoice_number: string | null }>;
};

const FEED_LIMIT = 10;

const iconMap = {
  lead: Users,
  quotation: FileText,
  invoice: Receipt,
};

const colorMap = {
  lead: 'bg-info/10 text-info',
  quotation: 'bg-primary/10 text-primary',
  invoice: 'bg-success/10 text-success',
};

// Log actions are stored as e.g. 'STAGE_CHANGE', 'status_change', 'created'.
const humanizeAction = (action: string | null) => {
  if (!action) return 'Updated';
  const text = action.replace(/_/g, ' ').toLowerCase().trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const relativeTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
};

// Embedded parent rows can come back as an object or a one-element array.
const one = <T,>(value: Embedded<T> | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

async function getCurrentUserAndRole(): Promise<{ userId: string | null; role: string | null }> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  if (!userId) return { userId: null, role: null };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles ( name )')
    .eq('user_id', userId)
    .maybeSingle();

  const roles = (roleData as { roles?: { name?: string } | { name?: string }[] } | null)?.roles;
  const role = Array.isArray(roles) ? roles[0]?.name : roles?.name;
  return { userId, role: role ?? null };
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchActivity = async () => {
      setLoading(true);
      setError(false);

      const { userId, role } = await getCurrentUserAndRole();
      if (!userId) {
        if (!cancelled) {
          setActivities([]);
          setLoading(false);
        }
        return;
      }
      const isAdmin = role === 'Admin' || role === 'Super Admin';

      // Lead activity follows the dashboard's lead visibility rule:
      // admins see every lead, everyone else only leads they own or are assigned.
      let leadLogsQuery = supabase
        .from('lead_logs')
        .select(
          'id, lead_id, action, details, performed_by, created_at, crm_leads!inner(lead_name, lead_owner_id, lead_assign_to_id, is_deleted)'
        )
        .eq('crm_leads.is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(FEED_LIMIT);

      if (!isAdmin) {
        leadLogsQuery = leadLogsQuery.or(
          `lead_owner_id.eq.${userId},lead_assign_to_id.eq.${userId}`,
          { referencedTable: 'crm_leads' }
        );
      }

      const [leadLogs, quotationLogs, invoiceLogs] = await Promise.all([
        leadLogsQuery,
        supabase
          .from('quotation_logs')
          .select('id, quotation_id, action, details, performed_by, created_at, quotations(quotation_number)')
          .order('created_at', { ascending: false })
          .limit(FEED_LIMIT),
        supabase
          .from('invoice_logs')
          .select('id, invoice_id, action, details, performed_by, created_at, invoices(invoice_number)')
          .order('created_at', { ascending: false })
          .limit(FEED_LIMIT),
      ]);

      if (cancelled) return;

      if (leadLogs.error && quotationLogs.error && invoiceLogs.error) {
        setError(true);
        setActivities([]);
        setLoading(false);
        return;
      }

      const items: ActivityItem[] = [
        ...((leadLogs.data ?? []) as unknown as LeadLogRow[]).map((row): ActivityItem => {
          const lead = one(row.crm_leads);
          return {
            id: `lead-${row.id}`,
            source: 'lead',
            title: row.details || humanizeAction(row.action),
            relatedTo: lead?.lead_name || 'Lead',
            user: row.performed_by || 'Unknown user',
            createdAt: row.created_at,
            href: row.lead_id ? `/leads/${row.lead_id}` : null,
          };
        }),
        ...((quotationLogs.data ?? []) as unknown as QuotationLogRow[]).map((row): ActivityItem => {
          const quotation = one(row.quotations);
          return {
            id: `quotation-${row.id}`,
            source: 'quotation',
            title: row.details || humanizeAction(row.action),
            relatedTo: quotation?.quotation_number || 'Quotation',
            user: row.performed_by || 'Unknown user',
            createdAt: row.created_at,
            href: row.quotation_id ? `/quotations/${row.quotation_id}` : null,
          };
        }),
        ...((invoiceLogs.data ?? []) as unknown as InvoiceLogRow[]).map((row): ActivityItem => {
          const invoice = one(row.invoices);
          return {
            id: `invoice-${row.id}`,
            source: 'invoice',
            title: row.details || humanizeAction(row.action),
            relatedTo: invoice?.invoice_number || 'Invoice',
            user: row.performed_by || 'Unknown user',
            createdAt: row.created_at,
            href: row.invoice_id ? `/invoices/${row.invoice_id}` : null,
          };
        }),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, FEED_LIMIT);

      setActivities(items);
      setLoading(false);
    };

    fetchActivity().catch(() => {
      if (!cancelled) {
        setError(true);
        setActivities([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm border border-border animate-slide-up h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}

        {!loading && error && (
          <p className="text-sm text-muted-foreground text-center py-4">Couldn't load activity</p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
        )}

        {!loading &&
          !error &&
          activities.map((activity) => {
            const Icon = iconMap[activity.source];
            const content = (
              <>
                <div className={cn('rounded-lg p-2', colorMap[activity.source])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-0.5">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.relatedTo} • {activity.user} • {relativeTime(activity.createdAt)}
                  </p>
                </div>
              </>
            );
            const rowClass =
              'flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50';

            return activity.href ? (
              <Link key={activity.id} to={activity.href} className={rowClass}>
                {content}
              </Link>
            ) : (
              <div key={activity.id} className={rowClass}>
                {content}
              </div>
            );
          })}
      </div>
    </div>
  );
}

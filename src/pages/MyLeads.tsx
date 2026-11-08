import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { toast } from 'sonner';
import { Briefcase, CalendarClock, IndianRupee, Kanban, List, Plus, Trophy } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LeadsPipeline } from '@/components/Leads/LeadsPipeline';
import { LeadsListView } from '@/components/Leads/LeadsListView';
import { MobileLeadsView } from '@/components/Leads/MobileLeadsView';
import { PersistentToolbar } from '@/components/shared/PersistentToolbar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/supabase/supabaseClient';
import { cn } from '@/lib/utils';
import { Lead } from '@/types';

type Scope = 'all' | 'owned' | 'assigned';
const DAY = 24 * 60 * 60 * 1000;
const isOpen = (l: Lead) => !['Won', 'Lost'].includes(l.lead_stage || '');

/** Leads the signed-in user owns or is assigned to. */
export const MyLeadsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { formatCurrency } = useCurrency();
  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>('all');
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchLeads = async () => {
      const [leadsRes, profilesRes] = await Promise.all([
        supabase
          .from('crm_leads')
          .select('*, crm_customers(name)')
          .not('is_deleted', 'is', true)
          .or(`lead_owner_id.eq.${userId},lead_assign_to_id.eq.${userId}`)
          .order('created_at', { ascending: false }),
        supabase.from('crm_profile').select('id, full_name'),
      ]);

      if (leadsRes.error) {
        toast.error('Failed to load your leads');
        setLoading(false);
        return;
      }

      // Same owner/assignee shape the shared lead views expect.
      const names = new Map((profilesRes.data || []).map((p) => [p.id, { full_name: p.full_name }]));
      setLeads(
        ((leadsRes.data || []) as Lead[]).map((lead) => ({
          ...lead,
          lead_owner: lead.lead_owner_id ? names.get(lead.lead_owner_id) ?? null : null,
          lead_assignee: lead.lead_assign_to_id ? names.get(lead.lead_assign_to_id) ?? null : null,
        }))
      );
      setLoading(false);
    };

    fetchLeads();
    const channel = supabase
      .channel(`my_leads_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, fetchLeads)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const counts = useMemo(() => ({
    all: leads.length,
    owned: leads.filter((l) => l.lead_owner_id === userId).length,
    assigned: leads.filter((l) => l.lead_assign_to_id === userId).length,
  }), [leads, userId]);

  const scopedLeads = useMemo(() => {
    if (scope === 'owned') return leads.filter((l) => l.lead_owner_id === userId);
    if (scope === 'assigned') return leads.filter((l) => l.lead_assign_to_id === userId);
    return leads;
  }, [leads, scope, userId]);

  const stats = useMemo(() => {
    const open = scopedLeads.filter(isOpen);
    const won = scopedLeads.filter((l) => l.lead_stage === 'Won');
    const now = Date.now();
    const closingSoon = open.filter((l) => {
      if (!l.expected_close_date) return false;
      const t = new Date(l.expected_close_date).getTime();
      return t >= now - DAY && t <= now + 7 * DAY;
    });
    return {
      open: open.length,
      openValue: open.reduce((s, l) => s + Number(l.estimated_deal_value || 0), 0),
      closingSoon: closingSoon.length,
      won: won.length,
      wonValue: won.reduce((s, l) => s + Number(l.estimated_deal_value || 0), 0),
    };
  }, [scopedLeads]);

  const sortedLeads = useMemo(() => {
    if (!sortConfig) return scopedLeads;
    const { key, direction } = sortConfig;
    return [...scopedLeads].sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      if (av < bv) return direction === 'asc' ? -1 : 1;
      if (av > bv) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [scopedLeads, sortConfig]);

  // Views hand back only the leads they showed; merge those changes into the full list.
  const mergeLeads = (changed: Lead[]) =>
    setLeads((prev) => {
      const byId = new Map(changed.map((l) => [l.id, l]));
      const merged = prev.map((l) => byId.get(l.id) ?? l);
      const known = new Set(prev.map((l) => l.id));
      return [...merged, ...changed.filter((l) => !known.has(l.id))];
    });

  const pageLeads = sortedLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: keyof Lead) =>
    setSortConfig((cur) => (cur?.key === key ? (cur.direction === 'asc' ? { key, direction: 'desc' } : null) : { key, direction: 'asc' }));

  const statCards = [
    { label: 'Open Leads', value: String(stats.open), icon: Briefcase, tone: 'amber' },
    { label: 'Open Pipeline', value: formatCurrency(stats.openValue), icon: IndianRupee, tone: 'teal' },
    { label: 'Closing in 7 Days', value: String(stats.closingSoon), icon: CalendarClock, tone: 'purple' },
    { label: 'Won', value: `${stats.won} · ${formatCurrency(stats.wonValue)}`, icon: Trophy, tone: 'rose' },
  ] as const;

  const toneClasses: Record<string, { card: string; icon: string; label: string }> = {
    amber: { card: 'border-amber-100 bg-amber-50/40', icon: 'text-amber-600', label: 'text-amber-700/70' },
    teal: { card: 'border-teal-100 bg-teal-50/40', icon: 'text-teal-600', label: 'text-teal-700/70' },
    purple: { card: 'border-purple-100 bg-purple-50/40', icon: 'text-purple-600', label: 'text-purple-700/70' },
    rose: { card: 'border-rose-100 bg-rose-50/40', icon: 'text-rose-600', label: 'text-rose-700/70' },
  };

  const scopes: { key: Scope; label: string }[] = [
    { key: 'all', label: 'All my leads' },
    { key: 'owned', label: 'Owned by me' },
    { key: 'assigned', label: 'Assigned to me' },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="My Leads"
        breadcrumbAction={
          view === 'list' ? (
            <PersistentToolbar
              currentPage={currentPage}
              totalItems={scopedLeads.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              showPagination
              showPageCount={false}
              showViews={false}
            />
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={cn('rounded-xl border p-4', toneClasses[tone].card)}>
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg bg-white p-2 shadow-sm', toneClasses[tone].icon)}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-[11px] font-bold uppercase tracking-wider', toneClasses[tone].label)}>{label}</p>
                  <p className="truncate text-xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scope + view controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Which leads" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {scopes.map((s) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={scope === s.key}
                onClick={() => { setScope(s.key); setCurrentPage(1); }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  scope === s.key ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {s.label}
                <span className={cn('ml-1.5 text-xs', scope === s.key ? 'text-white/80' : 'text-slate-400')}>{counts[s.key]}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isMobile && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" aria-label="View">
                {([['pipeline', Kanban, 'Pipeline'], ['list', List, 'List']] as const).map(([key, Icon, label]) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    aria-pressed={view === key}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      view === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            )}
            <Button onClick={() => navigate('/Leads/add')} className="gap-1.5">
              <Plus size={16} /> Add Lead
            </Button>
          </div>
        </div>

        {/* Leads */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spin size="large" /></div>
        ) : scopedLeads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">
              {scope === 'assigned' ? 'No leads are assigned to you yet' : scope === 'owned' ? "You don't own any leads yet" : 'You have no leads yet'}
            </p>
            <p className="mt-1 text-sm text-slate-500">Leads you create or that are assigned to you will appear here.</p>
            <Button onClick={() => navigate('/Leads/add')} className="mt-5 gap-1.5"><Plus size={16} /> Add Lead</Button>
          </div>
        ) : isMobile ? (
          <MobileLeadsView leads={scopedLeads} onLeadsChange={mergeLeads} />
        ) : view === 'pipeline' ? (
          <LeadsPipeline Leads={scopedLeads} onLeadsChange={mergeLeads} />
        ) : (
          <LeadsListView
            leads={pageLeads}
            allLeads={scopedLeads}
            sortConfig={sortConfig}
            onSort={handleSort}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}
      </div>
    </div>
  );
};

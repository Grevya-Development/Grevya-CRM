import { Header } from '@/components/layout/Header';
import { LeadsPipeline } from "../components/Leads/LeadsPipeline"
import { LeadsListView } from '../components/Leads/LeadsListView';
import { MobileLeadsView } from '../components/Leads/MobileLeadsView';
import { DrillDownReport } from '@/components/reports/DrillDownReport';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Briefcase, IndianRupee, Activity, Trophy, X } from 'lucide-react';
import { PersistentToolbar } from '@/components/shared/PersistentToolbar';
import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '../supabase/supabaseClient';
import { Lead } from '@/types';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency } = useCurrency();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCustomerId, setFilterCustomerId] = useState<string | null>(location.state?.filterCustomerId || null);
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<'pipeline' | 'list' | 'calendar' | 'pivot' | 'graph' | 'activity'>(
    searchParams.get('view') === 'list' ? 'list' : 'pipeline'
  );

  const filters = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const filteredLeads = useMemo(() => {
    let data = [...leads];

    data = data.filter((lead) => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === "view") return true;

        const leadValue = (lead as any)[key];
        const leadStr = String(leadValue).trim().toLowerCase();
        const filterStr = value.trim().toLowerCase();

        if (filterStr === "unknown" || filterStr === "other") {
          return leadValue === null || leadValue === undefined || String(leadValue).trim() === "";
        }

        if (leadValue === null || leadValue === undefined) return false;

        // score range filter
        if (key === "lead_score" && filterStr.includes("-")) {
          const [min, max] = filterStr.split("-").map(Number);
          const score = Number(leadValue);
          return score >= min && score <= max;
        }

        // partial text match
        return leadStr.includes(filterStr);
      });
    });

    return data;
  }, [leads, filters]);

  // Handle sorting
  const sortedLeads = useMemo(() => {
    const base = [...filteredLeads];
    if (!sortConfig) return base;

    const { key, direction } = sortConfig;
    return base.sort((a, b) => {
      const aValue = a[key] ?? '';
      const bValue = b[key] ?? '';

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortConfig]);

  // Calculate pagination
  const totalItems = filteredLeads.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  const handleSort = (key: keyof Lead) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const fetchLeads = async () => {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*, crm_customers(name)')
        .or('is_deleted.eq.false,is_deleted.is.null');

      if (filterCustomerId) {
        query = query.eq('customer_id', filterCustomerId);
      }

      const [leadsResponse, profilesResponse] = await Promise.all([
        query
          .order('created_at', { ascending: false })
          .order('id', { ascending: false }),
        supabase
          .from('crm_profile')
          .select('id, full_name')
      ]);

      if (leadsResponse.error) throw leadsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      const profilesMap = (profilesResponse.data || []).reduce((acc: any, p) => {
        acc[p.id] = { full_name: p.full_name };
        return acc;
      }, {});

      const leadsWithOwners = (leadsResponse.data || []).map((lead: any) => ({
        ...lead,
        lead_owner: lead.lead_owner_id ? profilesMap[lead.lead_owner_id] : null,
        lead_assignee: lead.lead_assign_to_id ? profilesMap[lead.lead_assign_to_id] : null,
      }));

      setLeads(leadsWithOwners);
    } catch (error: any) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes',
        { event: '*', table: 'crm_leads', schema: 'public' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [filterCustomerId]);

  const customerName = useMemo(() => {
    if (!filterCustomerId || leads.length === 0) return null;
    const leadWithCustomer = leads.find(l => (l as any).crm_customers?.name);
    return (leadWithCustomer as any)?.crm_customers?.name || 'Selected Customer';
  }, [filterCustomerId, leads]);

  const stats = {
    total: leads.length,
    totalValue: leads.reduce((sum, d) => sum + Number(d.estimated_deal_value || 0), 0),
    openValue: leads
      .filter((d) => !['Won', 'Lost'].includes(d.lead_stage || ''))
      .reduce((sum, d) => sum + Number(d.estimated_deal_value || 0), 0),
    wonValue: leads
      .filter((d) => (d.lead_stage || '') === 'Won')
      .reduce((sum, d) => sum + Number(d.estimated_deal_value || 0), 0),
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Leads"
        breadcrumbAction={
          <PersistentToolbar
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            currentView={view}
            onViewChange={(newView) => {
              setView(newView);
              setActiveTab('pipeline');
            }}
            showPagination={view === 'list'}
            showPageCount={!(view === 'list' || activeTab === 'analytics')}
            isDrilldown={activeTab === 'analytics'}
            onDrilldownClick={() => setActiveTab(activeTab === 'analytics' ? 'pipeline' : 'analytics')}
            showViews={true}
          />
        }
      />
      <div className="p-6 space-y-6">
        {filterCustomerId && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700">
                Showing leads for: <span className="font-bold">{customerName}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => {
                setFilterCustomerId(null);
                window.history.replaceState({}, document.title);
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear Filter
            </Button>
          </div>
        )}
        {/* Header with Stats */}
        <div className="flex justify-between items-center gap-6">
          <div className="grid gap-4 sm:grid-cols-4 flex-1">
            <div className="group relative overflow-hidden rounded-xl border border-amber-100 bg-amber-50/40 p-4 transition-all hover:bg-amber-50/60 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-amber-600 shadow-sm transition-colors group-hover:text-amber-700">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700/70">Total Leads</p>
                  <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-teal-100 bg-teal-50/40 p-4 transition-all hover:bg-teal-50/60 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-teal-600 shadow-sm transition-colors group-hover:text-teal-700">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700/70">Estimated Deal Value</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-purple-100 bg-purple-50/40 p-4 transition-all hover:bg-purple-50/60 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-purple-600 shadow-sm transition-colors group-hover:text-purple-700">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700/70">Open Pipeline</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.openValue)}</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-rose-100 bg-rose-50/40 p-4 transition-all hover:bg-rose-50/60 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-rose-600 shadow-sm transition-colors group-hover:text-rose-700">
                  <Trophy size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700/70">Won Value</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.wonValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsContent value="pipeline" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spin size="large" />
              </div>
            ) : isMobile ? (
              <MobileLeadsView leads={filteredLeads} onLeadsChange={setLeads} />
            ) : view === 'pipeline' ? (
              <LeadsPipeline Leads={filteredLeads} onLeadsChange={setLeads} />
            ) : view === 'list' ? (
              <LeadsListView
                leads={paginatedLeads}
                allLeads={filteredLeads}
                sortConfig={sortConfig}
                onSort={handleSort}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            ) : (
              <MobileLeadsView leads={filteredLeads} onLeadsChange={setLeads} />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <DrillDownReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

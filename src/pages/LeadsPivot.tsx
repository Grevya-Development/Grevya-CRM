import { Header } from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Lead } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, SlidersHorizontal, Plus, Minus } from 'lucide-react';
import { PersistentToolbar } from '@/components/shared/PersistentToolbar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { LEAD_STAGES_CONFIG } from '@/lib/lead-constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STAGES = LEAD_STAGES_CONFIG.map(stage => stage.name);

export default function LeadsPivot() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Group leads by month and stage
  const getLeadsByMonthAndStage = () => {
    const grouped: { [key: string]: { [key: string]: Lead[] } } = {};

    leads.forEach(lead => {
      const date = lead.created_at ? new Date(lead.created_at) : null;

      if (date) {
        const monthKey = format(date, 'MMM yyyy');
        if (!grouped[monthKey]) {
          grouped[monthKey] = Object.fromEntries(STAGES.map(stage => [stage, [] as Lead[]]));
        }
        const stage = lead.lead_stage || 'Qualification';
        if (grouped[monthKey][stage]) {
          grouped[monthKey][stage].push(lead);
        }
      }
    });

    return grouped;
  };

  const monthlyData = useMemo(() => getLeadsByMonthAndStage(), [leads]);

  const months = useMemo(() => {
    const monthNames = Object.keys(monthlyData);
    return monthNames.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [monthlyData]);

  const getTotalByStage = (stage: string) => {
    return leads
      .filter(l => l.lead_stage === stage)
      .reduce((sum, lead) => sum + Number(lead.estimated_deal_value || 0), 0);
  };

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedStages(newExpanded);
  };

  const getMonthTotal = (month: string) => {
    const monthLeads = monthlyData[month];
    return Object.values(monthLeads).flat().reduce((sum, lead) => sum + Number(lead.estimated_deal_value || 0), 0);
  };

  const grandTotal = leads.reduce((sum, lead) => sum + Number(lead.estimated_deal_value || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Leads - Pivot View"
        breadcrumbAction={
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-2 px-6 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/Leads/add')}>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <PersistentToolbar
              currentPage={currentPage}
              totalItems={leads.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              currentView="pivot"
              showPagination={true}
              showViews={true}
            />
          </div>
        }
      />

      <div className="p-6">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              {/* First Header Row - Stage Names */}
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-0">
                <TableHead className="w-[200px] border-r"></TableHead>
                {STAGES.map(stage => (
                  <TableHead key={stage} className="text-center border-r">
                    <div className="flex items-center justify-center gap-1">
                      <Plus className="h-3 w-3" />
                      <span>{stage}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center"></TableHead>
              </TableRow>
              {/* Second Header Row - Expected Revenue Labels */}
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[200px] border-r text-muted-foreground">Expected Revenue</TableHead>
                {STAGES.map(stage => (
                  <TableHead key={stage} className="text-center border-r text-muted-foreground">Expected Revenue</TableHead>
                ))}
                <TableHead className="text-center text-muted-foreground">Expected Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Total Row */}
              <TableRow className="bg-background hover:bg-background border-b-2">
                <TableCell className="font-semibold border-r">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-muted-foreground" />
                    <span>Total</span>
                  </div>
                </TableCell>
                {STAGES.map(stage => (
                  <TableCell key={stage} className="text-center font-semibold tabular-nums border-r">
                    {getTotalByStage(stage).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                ))}
                <TableCell className="text-center font-semibold tabular-nums">
                  {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>

              {/* Monthly Rows */}
              {months.map((month) => {
                const isExpanded = expandedStages.has(month);
                const monthData = monthlyData[month];

                return (
                  <TableRow key={month} className="hover:bg-muted/20">
                    <TableCell className="font-medium border-r">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleMonth(month)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                        >
                          {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                        <span>{month}</span>
                      </div>
                    </TableCell>
                    {STAGES.map(stage => (
                      <TableCell key={stage} className="text-center tabular-nums border-r">
                        {monthData[stage].reduce((sum, l) => sum + Number(l.estimated_deal_value || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold tabular-nums">
                      {getMonthTotal(month).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

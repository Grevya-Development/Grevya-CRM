import { Header } from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Lead } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PersistentToolbar } from '@/components/shared/PersistentToolbar';
import { Separator } from '@/components/ui/separator';
import { LEAD_STAGES_CONFIG } from '@/lib/lead-constants';

export default function LeadsGraph() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
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

  const stages = LEAD_STAGES_CONFIG.map(({ name, color }) => ({ key: name, label: name, color }));

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.lead_stage === stage);
  };

  const getTotalByStage = (stage: string) => {
    return getLeadsByStage(stage).reduce((sum, lead) => sum + Number(lead.estimated_deal_value || 0), 0);
  };

  const maxValue = Math.max(...stages.map(stage => getTotalByStage(stage.key)));

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Leads - Graph View"
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
              currentView="graph"
              showPagination={true}
              showViews={true}
            />
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Vertical Bar Chart */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Pipeline</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-sm bg-primary"></div>
              <span>Leads</span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-muted-foreground w-8">
              <span>4</span>
              <span>3.5</span>
              <span>3</span>
              <span>2.5</span>
              <span>2</span>
              <span>1.5</span>
              <span>1</span>
              <span>0.5</span>
              <span>0</span>
            </div>

            {/* Bars Container */}
            <div className="ml-12 flex items-end justify-around gap-4 h-[400px] border-l border-b border-border">
              {stages.map((stage) => {
                const value = getTotalByStage(stage.key);
                const count = getLeadsByStage(stage.key).length;
                const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                  <div key={stage.key} className="flex flex-col items-center flex-1 max-w-[200px]">
                    {/* Bar */}
                    <div className="w-full flex justify-center items-end h-[360px] pb-2">
                      <div
                        className="w-full bg-primary transition-all duration-500 rounded-t"
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                    {/* Label */}
                    <div className="mt-2 text-sm font-medium text-center">
                      {stage.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis label */}
            <div className="text-center mt-4 text-sm font-medium text-muted-foreground">
              Stage
            </div>
          </div>
        </div>

        {/* Pie Chart Representation */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-bold mb-4">Lead Distribution</h3>
            <div className="space-y-3">
              {stages.map((stage) => {
                const count = getLeadsByStage(stage.key).length;
                const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;

                return (
                  <div key={stage.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${stage.color}`} />
                      <span className="text-sm font-medium">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{count} leads</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-bold mb-4">Summary Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Total Leads</span>
                <span className="text-lg font-bold">{leads.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-lg font-bold">
                  ₹{leads.reduce((sum, lead) => sum + Number(lead.estimated_deal_value || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                <span className="text-sm font-medium">Won Deals</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{getTotalByStage('Won').toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">In Pipeline</span>
                <span className="text-lg font-bold text-primary">
                  ₹{stages
                    .filter(stage => stage.key !== 'Won' && stage.key !== 'Lost')
                    .reduce((sum, stage) => sum + getTotalByStage(stage.key), 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { PipelineChart } from '@/components/dashboard/PipelineChart';
import { TargetVsAchieveChart } from '@/components/dashboard/TargetVsAchieveChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TasksList } from '@/components/dashboard/TasksList';
import { DrillDownModal } from '@/components/drilldown/DrillDownModal';
import { revenueDrillDown, LeadsDrillDown, leadsDrillDown, conversionDrillDown } from '@/data/drillDownData';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Briefcase,
  Users,
  TrendingUp,
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/supabase/supabaseClient';
import log from '@/utils/logger'
import LeadScoreChart from '@/components/reports/LeadScoreChart';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leads } from '@/components/dashboard/Leads';




export default function Dashboard() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const { defaultCurrency, formatCurrency } = useCurrency();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageFilter = searchParams.get("lead_stage");
  const sourceFilter = searchParams.get("lead_source");
  const statusFilter = searchParams.get("conversion_status");
  const scoreFilter = searchParams.get("lead_score");

  const getCurrencyIcon = () => {
    switch (defaultCurrency.code) {
      case 'INR': return IndianRupee;
      case 'USD': return DollarSign;
      case 'EUR': return Euro;
      case 'GBP': return PoundSterling;
      default: return DollarSign;
    }
  };

  // Add this after filteredLeads useMemo:
  const realStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Total Revenue = sum of Won leads estimated_deal_value
    const totalRevenue = leads
      .filter(l => l.lead_stage === 'Won')
      .reduce((sum, l) => sum + Number(l.estimated_deal_value || 0), 0);

    // Open Deals = leads not Won or Lost
    const openDeals = leads.filter(
      l => !['Won', 'Lost'].includes(l.lead_stage)
    ).length;

    // New Leads this week
    const newLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= startOfWeek;
    }).length;

    // Conversion Rate = Won / total * 100
    const won = leads.filter(l => l.lead_stage === 'Won').length;
    const conversionRate = leads.length > 0
      ? ((won / leads.length) * 100).toFixed(1)
      : '0.0';

    return { totalRevenue, openDeals, newLeads, conversionRate };
  }, [leads]);


  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);

      if (!uid) return;

      // get role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select(`
        roles (
          name
        )
      `)
        .eq("user_id", uid)
        .single()

      if (roleData) {
        const roleName = Array.isArray(roleData.roles)
          ? roleData.roles?.[0]?.name
          : (roleData.roles as any)?.name;

        setUserRole(roleName || null);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!userId || userRole === null) return;

    const fetchLeads = async () => {
      setLoading(true);

      let query = supabase.from("crm_leads").select("*");

      if (userRole !== "Admin" && userRole !== "Super Admin") {
        query = query.or(
          `lead_owner_id.eq.${userId},lead_assign_to_id.eq.${userId}`
        );
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to fetch leads");
        return;
      }

      if (data) {
        setLeads(data);
        setLoading(false);
      }
    };
    fetchLeads()
  }, [userId, userRole])

  const filteredLeads = useMemo(() => {
    let data = [...leads];
    if (scoreFilter) {
      const [min, max] = scoreFilter.split("-").map(Number);

      data = data.filter(
        (lead) =>
          lead.lead_score !== null &&
          lead.lead_score !== undefined &&
          lead.lead_score >= min &&
          lead.lead_score <= max
      );
    }
    if (stageFilter) {
      data = data.filter(
        (lead) => lead.lead_stage?.toLowerCase() === stageFilter?.toLowerCase()
      );
    }
    if (sourceFilter) {
      data = data.filter(
        (lead) => lead.lead_source?.toLowerCase() === sourceFilter?.toLowerCase()
      );
    }
    if (statusFilter) {
      data = data.filter(
        (lead) => lead.conversion_status?.toLowerCase() === statusFilter?.toLowerCase()
      );
    }
    return data;
  }, [leads, scoreFilter, stageFilter, sourceFilter, statusFilter])

  const handleStatClick = (type: string) => {
    switch (type) {
      case 'revenue':
        setDrillDownData(revenueDrillDown);
        break;
      case 'Leads':
        setDrillDownData(LeadsDrillDown);
        break;
      case 'leads':
        setDrillDownData(leadsDrillDown);
        break;
      case 'conversion':
        setDrillDownData(conversionDrillDown);
        break;
    }
    setDrillDownOpen(true);
  };

  // useEffect(() => {
  //   const getSession = async () => {
  //     const { data } = await supabase.auth.getSession()
  //     const accessToken = data.session?.provider_token;

  //     log.debug("Google Access Token:", accessToken);
  //     if (accessToken) {
  //       localStorage.setItem("google_acess_token", accessToken);
  //     }
  //   };
  //   getSession()
  // })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" />
      <div className="p-4 space-y-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div onClick={() => handleStatClick('revenue')} className="cursor-pointer hover:scale-[1.02] transition-transform">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(realStats.totalRevenue)}
              change="+28% from last month"
              changeType="positive"
              icon={getCurrencyIcon()}
              iconColor="bg-success/10 text-success"
              chartData={[40, 48, 52, 56, 62, 68, 74, 80]}
              averageValue={formatCurrency(realStats.totalRevenue / 12)}
              barColor="bg-[#15803D]"
            />
          </div>

          <div onClick={() => handleStatClick('Leads')} className="cursor-pointer hover:scale-[1.02] transition-transform">
            <StatCard
              title="Open Deals"
              value={realStats.openDeals}
              change="active pipeline"
              changeType="positive"
              icon={Briefcase}
              iconColor="bg-orange-500/10 text-orange-500"
              chartData={[38, 42, 46, 50, 54, 58, 64, 70]}
              averageValue={realStats.openDeals > 0
                ? formatCurrency(leads
                  .filter(l => !['Won', 'Lost'].includes(l.lead_stage))
                  .reduce((sum, l) => sum + Number(l.estimated_deal_value || 0), 0) / realStats.openDeals)
                : formatCurrency(0)
              }
              barColor="bg-[#F97316]"
            />
          </div>

          <div onClick={() => handleStatClick('leads')} className="cursor-pointer hover:scale-[1.02] transition-transform">
            <StatCard
              title="New Leads"
              value={realStats.newLeads}
              change="this week"
              changeType="positive"
              icon={Users}
              iconColor="bg-info/10 text-info"
              chartData={[45, 50, 55, 62, 68, 75, 82, 88]}
              averageValue={`${leads.length} total`}
              barColor="bg-primary"
            />
          </div>

          <div onClick={() => handleStatClick('conversion')} className="cursor-pointer hover:scale-[1.02] transition-transform">
            <StatCard
              title="Conversion Rate"
              value={`${realStats.conversionRate}%`}
              change="won vs total leads"
              changeType="positive"
              icon={TrendingUp}
              iconColor="bg-warning/10 text-warning"
              chartData={[50, 54, 60, 65, 70, 76, 82, 88]}
              averageValue={`${leads.filter(l => l.lead_stage === 'Won').length} won`}
              barColor="bg-[#0F766E]"
            />
          </div>
        </div>


        <div className="grid gap-6 lg:grid-cols-3 ">
          <PipelineChart />
          <Card className="shadow-sm border-slate-200 h-[370px]">
            <CardHeader className=" px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold">Lead Score Mix</CardTitle>
            </CardHeader>
            <CardContent className="p-2 h-[370px]">
              <LeadScoreChart leads={filteredLeads} onScoreClick={(score) =>
                navigate(`/leads?lead_score=${encodeURIComponent(score)}&view=list`, { state: { from: "dashboard" } })
              } />
            </CardContent>
          </Card>
          <TargetVsAchieveChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Leads />
          <TasksList />
          <ActivityFeed />
        </div>
      </div>

      <DrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        data={drillDownData}
      />
    </div>
  );
}

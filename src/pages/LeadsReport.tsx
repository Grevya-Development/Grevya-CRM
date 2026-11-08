import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  Calendar,
  Target,
  RefreshCw,
  UserPlus,
  Megaphone,
  Zap,
  Star,
  IndianRupee,
  Activity,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from 'antd';
import LeadsTrendChart from '@/components/reports/LeadsTrendChart';
import LeadsBySourceChart from '@/components/reports/LeadsBySourceChart';
import LeadScoreChart from '@/components/reports/LeadScoreChart';
import IndustryFunnelChart from '@/components/reports/IndustryFunnelChart';
import IndustryChart from '@/components/reports/IndustryChart';
import TopLeadsChart from '@/components/reports/TopLeadsChart';
import ReportChart, { ChartType } from '@/components/reports/ReportChart';
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Filter } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface Lead {
  lead_score: number;
  conversion_status: string;
  lead_stage: string;
  industry: string;
  created_at: string;
}

export default function LeadsReport() {
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<undefined | string>(undefined);
  const [source, setSource] = useState<undefined | string>(undefined);
  const [valueRange, setValueRange] = useState<undefined | string>(undefined);
  const [status, setStatus] = useState<undefined | string>(undefined);
  const [stage, setStage] = useState<undefined | string>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [openPopup, setOpenPopup] = useState(false)
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [openGroupBy, setOpenGroupBy] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [trendType, setTrendType] = useState<ChartType>("line");
  const [funnelType, setFunnelType] = useState<ChartType>("funnel");
  const [sourceType, setSourceType] = useState<ChartType>("pie");
  const [scoreType, setScoreType] = useState<ChartType>("pie");
  const [industryType, setIndustryType] = useState<ChartType>("bar");
  const [topLeadsType, setTopLeadsType] = useState<ChartType>("bar");

  const defaultSelection = [
    { column: 'lead_source', type: 'pie' as ChartType },
    { column: 'lead_stage', type: 'funnel' as ChartType },
    { column: 'industry', type: 'bar' as ChartType },
    { column: 'conversion_status', type: 'line' as ChartType }
  ]

  const [selectedConfigs, setSelectedConfigs] = useState<{ column: string, type: ChartType }[]>(defaultSelection)
  const [displayConfigs, setDisplayConfigs] = useState<{ column: string, type: ChartType }[]>(defaultSelection)
  const [isCustomView, setIsCustomView] = useState(false)
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleStageClick = (stage: string) => {
    navigate(`/leads?lead_stage=${encodeURIComponent(stage)}&view=list`, { state: { from: "leads-report" } });
  };



  const filteredLeads = useMemo(() => {
    let data = [...leads];
    const now = new Date();

    // PERIOD FILTER
    if (period) {
      data = data.filter((lead) => {
        const created = new Date(lead.created_at);

        switch (period) {
          case "this-month":
            return (
              created.getMonth() === now.getMonth() &&
              created.getFullYear() === now.getFullYear()
            );

          case "last-month":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return (
              created.getMonth() === lastMonth.getMonth() &&
              created.getFullYear() === lastMonth.getFullYear()
            );

          case "this-year":
            return created.getFullYear() === now.getFullYear();

          case "last-year":
            return created.getFullYear() === now.getFullYear() - 1;

          case "this-quarter":
            const currentQuarter = Math.floor(now.getMonth() / 3);
            return (
              Math.floor(created.getMonth() / 3) === currentQuarter &&
              created.getFullYear() === now.getFullYear()
            );

          case "last-quarter":
            const lastQuarterDate = new Date(now);
            lastQuarterDate.setMonth(now.getMonth() - 3);
            const lastQuarter = Math.floor(lastQuarterDate.getMonth() / 3);

            return (
              Math.floor(created.getMonth() / 3) === lastQuarter &&
              created.getFullYear() === lastQuarterDate.getFullYear()
            );

          default:
            return true;
        }
      });
    }

    // SOURCE FILTER
    if (source && source !== "all") {
      data = data.filter(
        (lead) => lead.lead_source?.toLowerCase() === source?.toLowerCase()
      );
    }

    // status filter
    if (status && status !== "all") {
      data = data.filter(
        (lead) =>
          lead.conversion_status?.toLowerCase() === status.toLowerCase()
      );
    }

    // STAGE FILTER
    if (stage && stage !== "all") {
      data = data.filter(
        (lead) => lead.lead_stage?.toLowerCase() === stage.toLowerCase()
      );
    }

    // OWNER FILTER
    if (valueRange && valueRange !== "all") {
      data = data.filter(
        (lead) =>
          lead.lead_owner_id === valueRange ||
          lead.lead_assign_to_id === valueRange
      );
    }

    return data;
  }, [period, source, leads, status, stage, valueRange]);

  const totalRows = filteredLeads.length;

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLeads.slice(start, end);
  }, [filteredLeads, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [period, source, status, stage, valueRange]);

  const leadStats = useMemo(() => {
    if (!filteredLeads || filteredLeads.length === 0) return {};

    const totalLeads = filteredLeads.length;

    const qualified = filteredLeads.filter(
      (l) => l.conversion_status === "Qualified"
    ).length;

    const converted = filteredLeads.filter(
      (l) => l.conversion_status === "Converted / Won"
    ).length;

    const lost = filteredLeads.filter(
      (l) => l.conversion_status === "Lost"
    ).length;

    const avgLeadScore =
      filteredLeads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / totalLeads;

    const conversionRate =
      totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;

    const winProbability =
      converted + lost > 0
        ? ((converted / (converted + lost)) * 100).toFixed(1)
        : 0;

    const pipelineValue = filteredLeads
      .filter(l => l.conversion_status !== "Lost")
      .reduce((sum, l) => sum + (l.estimated_deal_value || 0), 0);

    return {
      totalLeads,
      qualified,
      converted,
      lost,
      avgLeadScore: Math.round(avgLeadScore),
      conversionRate,
      winProbability,
      pipelineValue
    };
  }, [filteredLeads]);

  const groupOptions = [
    "lead_source",
    "industry",
    "lead_stage",
    "conversion_status"
  ];

  const toggleGroupBy = (field: string) => {
    setGroupBy((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const groupedData = useMemo(() => {
    if (groupBy.length === 0) return [];

    const map: Record<string, number> = {};

    filteredLeads.forEach((lead) => {
      const key = groupBy
        .map((field) => lead[field] || "Unknown")
        .join(" | ");

      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredLeads, groupBy]);


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
        .single();

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
    if (!userId) return

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

  const fetchUsers = async () => {
    const { data: users, error } = await supabase
      .from("crm_profile")
      .select("id, display_name");

    if (users) {
      setUsers(users)
    }
  }
  useEffect(() => {
    fetchUsers()
  }, [])


  const statusOptions = useMemo(() => {
    const unique = new Set(
      leads
        .map((lead) => lead.conversion_status)
        .filter(Boolean)
    );

    return Array.from(unique);
  }, [leads]);

  const stageOptions = useMemo(() => {
    const unique = new Set(
      leads
        .map((lead) => lead.lead_stage)
        .filter(Boolean)
    );

    return Array.from(unique);
  }, [leads]);

  const sourceOptions = useMemo(() => {
    const unique = new Set(
      leads.map((lead) => lead.lead_source).filter(Boolean)
    );
    return Array.from(unique);
  }, [leads]);

  const hideColumns = ["id", "subject", "lead_name", "customer_id", "email", "is_decision_maker",
    "note", "created_at", "updated_at", "deleted_at", "address", "attachment_url", "is_deleted", "attachment_name",
    "lead_owner_id", "lead_assign_to_id", "user_id", "lead_owner", "lead_assign_to", "whatsapp_notification", "email_notification"
  ]
  const leadColumns = leads.length > 0 ? Object.keys(leads[0]).filter((col) => !hideColumns.includes(col)) : [];

  const handleToggleColumn = (column: string) => {
    setSelectedConfigs((prev) => {
      const exists = prev.find(c => c.column === column);
      if (exists) {
        return prev.filter((c) => c.column !== column)
      } else {
        return [...prev, { column, type: 'bar' }]
      }
    })
  }

  const handleUpdateType = (column: string, type: ChartType) => {
    setSelectedConfigs(prev => prev.map(c => c.column === column ? { ...c, type } : c))
  }

  // chart option for reuse
  function ChartOptions({
    onChange
  }: {
    onChange: (type: ChartType) => void
  }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded hover:bg-slate-100">
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onChange("bar")}>
            Bar Chart
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onChange("pie")}>
            Pie Chart
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onChange("line")}>
            Line Chart
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onChange("funnel")}>
            Funnel Chart
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function ChartCard({
    title,
    data,
    groupBy,
    type,
    onTypeChange
  }: {
    title: string
    data: any[]
    groupBy: string
    type: ChartType
    onTypeChange: (type: ChartType) => void
  }) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">
            {title}
          </CardTitle>

          <ChartOptions onChange={onTypeChange} />
        </CardHeader>

        <CardContent className="p-3 h-[320px]">
          <ReportChart
            data={data}
            groupBy={groupBy}
            type={type}
          />
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 space-y-4">
      <Header
        title="Customize Report"
        breadcrumbAction={
          <Button
            onClick={() => setOpenPopup(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Additional Filters
          </Button>
        }
      />
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-200 border border-slate-200 rounded-xl px-4 py-1 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger
                  className="w-fit min-w-[170px] bg-slate-50 border-slate-200 text-slate-700
               h-7 py-0 font-medium
               focus:outline-none focus:ring-0
               focus-visible:ring-0 focus-visible:outline-none font-semibold text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <SelectValue placeholder="Time Period" />
                  </div>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="last-quarter">Last Quarter</SelectItem>
                  <SelectItem value="next-quarter">Next Quarter</SelectItem>
                  <SelectItem value="this-half">This Half Year</SelectItem>
                  <SelectItem value="last-half">Last Half Year</SelectItem>
                  <SelectItem value="next-half">Next Half Year</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="next-year">Next Year</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom-range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(userRole === "Admin" || userRole === "Super Admin") && (
              <Select value={valueRange} onValueChange={setValueRange}>
                <SelectTrigger className="h-7 w-[160px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All</SelectItem>

                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-7 w-[150px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                <SelectValue placeholder="Conversion Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>

                {statusOptions.map((statusItem) => (
                  <SelectItem
                    key={statusItem}
                    value={statusItem.toLowerCase()}
                  >
                    {statusItem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 border-l border-slate-300 pl-3 ml-1">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-7 w-[120px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sourceOptions.map((src) => (
                    <SelectItem key={src} value={src.toLowerCase()}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-7 w-[140px] bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:ring-0 font-semibold text-xs">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>

                {stageOptions.map((stageItem) => (
                  <SelectItem
                    key={stageItem}
                    value={stageItem.toLowerCase()}
                  >
                    {stageItem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 border-l border-slate-300 pl-3 ml-1">
              <div className="relative">
                <Button variant="outline" className="h-7 text-xs" onClick={() => setOpenGroupBy(!openGroupBy)}>
                  Group By
                </Button>

                {openGroupBy && (
                  <div className="absolute bg-white border mt-1 rounded shadow p-2 w-40 z-50">

                    {groupOptions.map((field) => (
                      <label key={field} className="flex items-center gap-2 text-xs py-1">
                        <input
                          type="checkbox"
                          checked={groupBy.includes(field)}
                          onChange={() => toggleGroupBy(field)}
                        />
                        {field.replace("_", " ")}
                      </label>
                    ))}

                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPeriod(undefined);
                setSource(undefined);
                setValueRange(undefined);
                setStatus(undefined);
                setStage(undefined);
                setGroupBy([]);
                setOpenGroupBy(false);
              }}
              className="h-7 px-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition font-semibold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2 text-indigo-500" />
              Clear Filters
            </Button>
            {/* <Button
              variant="outline"
              className="h-7 px-3 border-slate-200 text-slate-700 hover:bg-slate-100 transition font-semibold text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-2 text-slate-500" />
              Export
            </Button> */}
          </div>
        </div>

        {/* KPI */}
        <div className="bg-gray-200 border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-indigo-700 to-indigo-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-indigo-100 uppercase tracking-wider text-nowrap">Total Leads</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.totalLeads}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <UserPlus className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-700 to-cyan-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-cyan-100 uppercase tracking-wider text-nowrap">Qualified (MQL)</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.qualified}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Target className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-700 to-emerald-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider text-nowrap">Conversion Rate</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.conversionRate}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-700 to-orange-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-orange-100 uppercase tracking-wider text-nowrap">Avg Lead Score</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.avgLeadScore}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Star className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-700 to-pink-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-pink-100 uppercase tracking-wider text-nowrap">Lost</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.lost}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Megaphone className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-fuchsia-700 to-fuchsia-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-fuchsia-100 uppercase tracking-wider text-nowrap">Converted Leads</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.converted}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <IndianRupee className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-lime-700 to-lime-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-lime-100 uppercase tracking-wider text-nowrap">Pipeline Value</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.pipelineValue}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sky-700 to-sky-500 border-none shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-3">
                <p className="text-[11px] font-semibold text-sky-100 uppercase tracking-wider text-nowrap">Win Probability</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xl font-bold text-white">{leadStats.winProbability}</p>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Activity className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 transition-all duration-500">

              {groupBy.length > 0 ? (
                /* GROUP BY VIEW */
                <Card className="shadow-sm border-slate-200 col-span-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      Leads grouped by {groupBy.map(g => g.replace("_", " ")).join(", ")}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 h-[420px]">
                    <ReportChart
                      data={groupedData}
                      groupBy="name"
                      type="bar"
                      color="#EF4444"
                    />
                  </CardContent>
                </Card>

              ) : !isCustomView ? (

                <>
                  {/* Default Dashboard View */}
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">Leads Conversion Trend</CardTitle>
                      <ChartOptions onChange={setTrendType} />
                    </CardHeader>
                    <CardContent className="p-3 h-[320px]">
                      {trendType === "line" ? (
                        <LeadsTrendChart leads={filteredLeads} onStatusClick={(status) =>
                          navigate(`/leads?conversion_status=${encodeURIComponent(status)}&view=list`)
                        } />
                      ) : (
                        <ReportChart
                          data={filteredLeads}
                          groupBy="conversion_status"
                          type={trendType}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">Lead Funnel</CardTitle>
                      <ChartOptions onChange={setFunnelType} />
                    </CardHeader>
                    <CardContent className="p-3 h-[320px]">
                      {funnelType === "funnel" ? (
                        <IndustryFunnelChart leads={filteredLeads} onStageClick={handleStageClick} />
                      ) : (
                        <ReportChart
                          data={filteredLeads}
                          groupBy="lead_stage"
                          type={funnelType}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">Leads by Source</CardTitle>
                      <ChartOptions onChange={setSourceType} />
                    </CardHeader>
                    <CardContent className="p-3 h-[320px]">
                      {sourceType === "pie" ? (
                        <LeadsBySourceChart leads={filteredLeads} onSourceClick={(source) =>
                          navigate(`/leads?lead_source=${encodeURIComponent(source)}&view=list`, { state: { from: "leads-report" } })
                        } />
                      ) : (
                        <ReportChart
                          data={filteredLeads}
                          groupBy="lead_source"
                          type={sourceType}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">Lead Score Mix</CardTitle>
                      <ChartOptions onChange={setScoreType} />
                    </CardHeader>
                    <CardContent className="p-3 h-[320px]">
                      {scoreType === "pie" ? (
                        <LeadScoreChart leads={filteredLeads} onScoreClick={(score) =>
                          navigate(`/leads?lead_score=${encodeURIComponent(score)}&view=list`, { state: { from: "leads-report" } })
                        } />
                      ) : (
                        <ReportChart
                          data={filteredLeads}
                          groupBy="lead_score"
                          type={scoreType}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">Industry</CardTitle>
                      <ChartOptions onChange={setIndustryType} />
                    </CardHeader>
                    <CardContent className="p-3 h-[320px]">
                      {industryType === "bar" ? (
                        <IndustryChart leads={filteredLeads} onIndustryClick={(industry) =>
                          navigate(`/leads?industry=${encodeURIComponent(industry)}&view=list`, { state: { from: "leads-report" } })
                        } />
                      ) : (
                        <ReportChart
                          data={filteredLeads}
                          groupBy="industry"
                          type={industryType}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">Top Leads</CardTitle>
                      <ChartOptions onChange={setTopLeadsType} />
                    </CardHeader>
                    <CardContent className="p-3 h-[320px]">
                      {topLeadsType === "bar" ? (
                        <TopLeadsChart leads={filteredLeads} onLeadScoreClick={(score) =>
                          navigate(`/leads?lead_score=${encodeURIComponent(score)}&view=list`, { state: { from: "leads-report" } })
                        } />
                      ) : (
                        <ReportChart
                          data={filteredLeads}
                          groupBy="lead_name"
                          type={topLeadsType}
                        />
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (

                <>
                  {/* Custom Report View */}
                  {displayConfigs.map((config, index) => (
                    <ChartCard
                      key={config.column}
                      title={config.column.replace("_", " ")}
                      data={filteredLeads}
                      groupBy={config.column}
                      type={config.type}
                      onTypeChange={(newType) => {
                        setDisplayConfigs(prev =>
                          prev.map((c, i) =>
                            i === index ? { ...c, type: newType } : c
                          )
                        )
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openPopup} onOpenChange={setOpenPopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Report</DialogTitle>
            <DialogDescription>
              Select the fields you want to include in the report
            </DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                onClick={() => setSelectedConfigs(leadColumns.map(c => ({ column: c, type: 'bar' })))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => setSelectedConfigs([])}
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={() => {
                  setIsCustomView(false);
                  setSelectedConfigs(defaultSelection);
                  setOpenPopup(false);
                }}
              >
                Reset to Default
              </Button>
            </div>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto space-y-2 mt-4">
            {leadColumns.length === 0 ? (
              <p className="text-sm text-gray-500">
                No data available
              </p>
            ) : (
              leadColumns.map((column) => {
                const config = selectedConfigs.find(c => c.column === column);
                const isSelected = !!config;
                return (
                  <div key={column} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleColumn(column)}
                      />
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {column.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
                        <button
                          onClick={() => handleUpdateType(column, 'bar')}
                          className={cn("p-1 rounded hover:bg-slate-100", config.type === 'bar' && "text-blue-600 bg-blue-50")}
                          title="Bar Chart"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateType(column, 'pie')}
                          className={cn("p-1 rounded hover:bg-slate-100", config.type === 'pie' && "text-blue-600 bg-blue-50")}
                          title="Pie Chart"
                        >
                          <PieChartIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateType(column, 'funnel')}
                          className={cn("p-1 rounded hover:bg-slate-100", config.type === 'funnel' && "text-blue-600 bg-blue-50")}
                          title="Funnel Chart"
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateType(column, 'line')}
                          className={cn("p-1 rounded hover:bg-slate-100", config.type === 'line' && "text-blue-600 bg-blue-50")}
                          title="Line Chart"
                        >
                          <LineChartIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <Button
            className="mt-4 w-full bg-[#0B64F4] hover:bg-blue-700"
            onClick={() => {
              setDisplayConfigs(selectedConfigs);
              setIsCustomView(true);
              setOpenPopup(false);
            }}
          >
            Update Dashboard
          </Button>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-slate-200 mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Leads Data</CardTitle>
        </CardHeader>

        <CardContent className="p-0">

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">Lead Score</th>
                  <th className="text-left p-3">Conversion Status</th>
                  <th className="text-left p-3">Stage</th>
                  <th className="text-left p-3">Industry</th>
                  <th className="text-left p-3">Created At</th>
                </tr>
              </thead>

              <tbody>
                {paginatedLeads.map((lead, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-slate-50"
                    onClick={() => navigate(`/leads/${lead.id}`, { state: { from: 'leads-report' } })}
                  >
                    <td className="p-3">{lead.lead_score}</td>
                    <td className="p-3">{lead.conversion_status}</td>
                    <td className="p-3">{lead.lead_stage}</td>
                    <td className="p-3">{lead.industry}</td>
                    <td className="p-3">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {paginatedLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t bg-slate-50">
            <span className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, totalRows)} of {totalRows}
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={currentPage * itemsPerPage >= totalRows}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

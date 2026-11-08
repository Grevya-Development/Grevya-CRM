import { useEffect, useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const stageColorsMap: Record<string, string> = {
  Qualification: '#0b66f4', // Primary Blue
  Proposal: '#64748B',      // Slate Blue
  Negotiation: '#B45309',   // Muted Amber
  Won: '#15803D',           // Muted Green
  Lost: '#6B7280',          // Cool Gray
};

const visualColors = [
  '#0b66f4', // Primary Blue
  '#64748B', // Slate blue
  '#0F766E', // Dark Teal
  '#15803D', // Muted green
];

type PipelineStage = {
  stage: string;
  value: number;
  count: number;
};

export function PipelineChart() {
  const [filter, setFilter] = useState('Monthly');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { convertCurrency, displayCurrency, defaultCurrency, autoConvert } = useCurrency();
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleStageClick = (stage: string) => {
    navigate(`/leads?lead_stage=${encodeURIComponent(stage)}&view=list`, { state: { from: "dashboard" } });
  };

  useEffect(() => {
    if (!leads.length) return;

    const stageMap: Record<string, PipelineStage> = {};

    leads.forEach((lead) => {
      if (!lead.lead_stage) return;
      const stage = lead.lead_stage;
      const value = lead.estimated_deal_value || 0;

      if (!stageMap[stage]) {
        stageMap[stage] = {
          stage,
          value: 0,
          count: 0
        };
      }

      stageMap[stage].value += value;
      stageMap[stage].count += 1;
    });

    const order = ["Qualification", "Proposal", "Negotiation", "Won", "Lost"];

    const result = Object.values(stageMap).sort(
      (a, b) => order.indexOf(a.stage) - order.indexOf(b.stage)
    );

    setPipelineData(result);

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

      let query = supabase.from("crm_leads").select("lead_stage, estimated_deal_value");

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


  // 1. Filter & Sort Data
  const rawData = pipelineData
    .filter(item => item.stage !== 'Lost')
    .sort((a, b) => {
      const order = ['Qualification', 'Proposal', 'Negotiation', 'Won'];
      return order.indexOf(a.stage) - order.indexOf(b.stage);
    });

  const totalStages = rawData.length;
  const chartData = rawData.map((item, index) => ({
    ...item,
    // Create a linear step down: e.g. 100, 75, 50, 25
    displayValue: 100 - (index * (80 / (totalStages - 1 || 1))),
    fill: visualColors[index % visualColors.length]
  }));

  // Custom Label Renderer for centered, multi-line text
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    const item = chartData[index];

    // Convert value if autoConvert is enabled
    const convertedValue = autoConvert
      ? convertCurrency(item.value, defaultCurrency.code, displayCurrency.code)
      : item.value;
    const symbol = autoConvert ? displayCurrency.symbol : defaultCurrency.symbol;
    if (height < 28) return null;

    return (
      <text
        x={x + width / 2}
        y={y + height / 1.5}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan x={x + width / 2} dy="-1.2em" fontSize="14" fontWeight="bold">
          {`${symbol}${(convertedValue / 1000).toFixed(0)}k`}
        </tspan>
        <tspan x={x + width / 2} dy="1.6em" fontSize="12">
          {item.stage}
        </tspan>
      </text>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-2 shadow-sm animate-slide-up h-[370px] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Sales Pipeline</h3>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              formatter={(value, name, props) => {
                const realValue = props.payload.value; // Access the real value from the payload

                // Convert value if autoConvert is enabled
                const convertedValue = autoConvert
                  ? convertCurrency(realValue, defaultCurrency.code, displayCurrency.code)
                  : realValue;
                const symbol = autoConvert ? displayCurrency.symbol : defaultCurrency.symbol;

                return [`${symbol}${convertedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, props.payload.stage];
              }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Funnel
              data={chartData}
              dataKey="displayValue"
              nameKey="stage"
              isAnimationActive
              lastShapeType="rectangle"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="none"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleStageClick(entry.stage)}
                />
              ))}
              <LabelList position="inside" content={renderCustomLabel} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

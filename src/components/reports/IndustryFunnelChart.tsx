import { useMemo } from "react";
import {
    ResponsiveContainer,
    FunnelChart,
    Funnel,
    Tooltip,
    LabelList,
    Cell,
} from "recharts";

interface Lead {
    lead_stage?: string;
}

interface Props {
    leads: Lead[];
    onStageClick?: (stage: string) => void;
}

const COLORS = [
    "#3B82F6",
    "#22C55E",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#0EA5E9",
    "#10B981",
    "#F59E0B",
];

const stageOrder = [
    "Qualification",
    "Identify Decision Makers",
    "Need Analysis",
    "Value Proposition",
    "Proposal",
    "Won",
    "Lost",
    "Negotiation"
];

const LeadStageFunnelChart = ({ leads, onStageClick }: Props) => {

    const funnelData = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        const stageMap: Record<string, number> = {};

        leads.forEach((lead) => {
            const stage = lead.lead_stage;

            if (!stage) return;

            if (!stageMap[stage]) {
                stageMap[stage] = 0;
            }

            stageMap[stage] += 1;
        });

        return stageOrder
            .map((stage) => ({
                name: stage,
                value: stageMap[stage] || 0,
            }))
            .filter((stage) => stage.value > 0)
            .sort((a, b) => b.value - a.value);

    }, [leads]);

    return (
        <ResponsiveContainer width="100%" height={280}>
            <FunnelChart>
                <Tooltip />
                <Funnel
                    dataKey="value"
                    width="200%"
                    data={funnelData}
                    isAnimationActive
                    onClick={(data: any) => {
                        if (!data?.payload?.name) return;
                        onStageClick?.(data.payload.name);
                    }}
                >
                    <LabelList
                        position="center"
                        fill="#ffffff"
                        content={(props: any) => {
                            const { x, y, width, height, value, name } = props;
                            return (
                                <text
                                    x={x + width / 2}
                                    y={y + height / 2}
                                    fill="#ffffff"
                                    fontSize={11}
                                    fontWeight={500}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                >
                                    {name}: {value}
                                </text>
                            );
                        }}
                    />
                    {funnelData.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Funnel>
            </FunnelChart>
        </ResponsiveContainer>
    );
};

export default LeadStageFunnelChart;
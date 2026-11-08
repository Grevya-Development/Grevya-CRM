import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface Lead {
    lead_score?: number | null;
}

interface Props {
    leads: Lead[];
    onScoreClick: (score: string) => void;
}

const COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#0EA5E9", "#94A3B8"];

const LeadScoreChart = ({ leads, onScoreClick }: Props) => {

    const scoreData = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        let hot = 0;
        let warm = 0;
        let neutral = 0;
        let cool = 0;
        let cold = 0;

        leads.forEach((lead) => {
            const score = lead.lead_score;

            if (score === null || score === undefined) return;

            if (score >= 90) hot++;
            else if (score >= 70) warm++;
            else if (score >= 50) neutral++;
            else if (score >= 30) cool++;
            else cold++;
        });

        return [
            { name: "Hot (90-100)", value: hot, min: 90, max: 100 },
            { name: "Warm (70-89)", value: warm, min: 70, max: 89 },
            { name: "Neutral (50-69)", value: neutral, min: 50, max: 69 },
            { name: "Cool (30-49)", value: cool, min: 30, max: 49 },
            { name: "Cold (0-29)", value: cold, min: 0, max: 29 },
        ];
    }, [leads]);

    return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Tooltip />
                <Legend />

                <Pie
                    data={scoreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                    // label
                    onClick={(data: any) => {
                        if (data?.payload && onScoreClick) {
                            const { min, max } = data.payload;
                            onScoreClick(`${min}-${max}`);
                        }
                    }}
                >
                    {scoreData.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>

            </PieChart>
        </ResponsiveContainer>
    );
};

export default LeadScoreChart;
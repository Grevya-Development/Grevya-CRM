import { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

interface Lead {
    lead_score?: number | null;
}

interface Props {
    leads: Lead[];
    onLeadScoreClick: (score: string) => void;
}

const TopLeadsChart = ({ leads, onLeadScoreClick }: Props) => {
    const chartData = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        return leads
            .filter((lead) => lead.lead_score !== null && lead.lead_score !== undefined)
            .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
            .slice(0, 10) // top 10 leads
            .map((lead, index) => ({
                name: `Lead ${index + 1}`,
                score: lead.lead_score,
            }));
    }, [leads]);

    return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} onClick={(data) => {
                if (data.activePayload && data.activePayload.length > 0) {
                    const score = data.activePayload[0].payload.score;
                    // Convert exact score to a range (±5 points, clamped 0-100)
                    const min = Math.max(0, score - 5);
                    const max = Math.min(100, score + 5);
                    onLeadScoreClick(`${min}-${max}`);
                }
            }}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />
                <YAxis />

                <Tooltip />

                <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default TopLeadsChart;
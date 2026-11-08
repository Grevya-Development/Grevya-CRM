import { useMemo } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
} from "recharts";

interface Lead {
    industry?: string;
}

interface Props {
    leads: Lead[];
    onIndustryClick: (industry: string) => void;
}

const COLORS = [
    "#3B82F6",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#0EA5E9",
    "#14B8A6",
    "#A855F7",
];

const IndustryChart = ({ leads, onIndustryClick }: Props) => {

    const industryData = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        const industryMap: Record<string, number> = {};

        leads.forEach((lead) => {
            const industry = lead.industry || "Other";

            if (!industryMap[industry]) {
                industryMap[industry] = 0;
            }

            industryMap[industry] += 1;
        });

        return Object.entries(industryMap).map(([name, value]) => ({
            name,
            value,
        }));

    }, [leads]);

    return (
        <ResponsiveContainer width="100%" height={260}>
            <BarChart data={industryData} onClick={(data) => {
                if (data.activePayload && data.activePayload.length > 0) {
                    onIndustryClick(data.activePayload[0].payload.name);
                }
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />

                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {industryData.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Bar>

            </BarChart>
        </ResponsiveContainer>
    );
};

export default IndustryChart;
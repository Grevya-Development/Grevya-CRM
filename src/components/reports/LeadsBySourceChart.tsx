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
    lead_source?: string;
}

interface Props {
    leads: Lead[];
    onSourceClick: (source: string) => void;
}

const COLORS = [
    "#1e40af",
    "#0ea5e9",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
];

const LeadsBySourceChart = ({ leads, onSourceClick }: Props) => {
    const sourceData = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        const sourceMap: Record<string, number> = {};

        leads.forEach((lead) => {
            const source = lead.lead_source || "Unknown";

            if (!sourceMap[source]) {
                sourceMap[source] = 0;
            }

            sourceMap[source] += 1;
        });

        return Object.entries(sourceMap).map(([name, value]) => ({
            name,
            value,
        }));
    }, [leads]);

    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Tooltip />
                <Legend formatter={(value) => (
                    <span style={{ fontSize: '10px', color: '#555' }}>{value}</span>
                )}
                    wrapperStyle={{
                        paddingTop: '16px',
                        fontSize: '10px',
                        lineHeight: '1.6',
                    }} />

                <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="40%"
                    outerRadius={80}
                    labelLine={false}
                    // label
                    onClick={(data: { name: string; }) => {
                        if (data?.name && onSourceClick) {
                            onSourceClick(data.name);
                        }
                    }}
                >
                    {sourceData.map((_, index) => (
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

export default LeadsBySourceChart;
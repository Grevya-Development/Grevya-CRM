import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
    LineChart,
    Line,
    FunnelChart,
    Funnel,
    LabelList,
} from "recharts";
import { useNavigate } from "react-router-dom";

export type ChartType = 'bar' | 'pie' | 'line' | 'funnel';

interface Props {
    data: any[];
    groupBy: string;
    title?: string;
    type?: ChartType;
    color?: string
}

const COLORS = [
    "#0B64F4", // Brand Blue
    "#10b981", // Emerald 500
    "#f59e0b", // Amber 500
    "#6366f1", // Indigo 500
    "#ec4899", // Pink 500
    "#06b6d4", // Cyan 500
    "#f43f5e", // Rose 500
    "#8b5cf6", // Violet 500
];

const ReportChart = ({ data, groupBy, title, type = 'bar', }: Props) => {

    const navigate = useNavigate();

    const handleChartClick = (data: any) => {
        navigate(`/leads?${groupBy}=${encodeURIComponent(data.name)}&view=list`, { state: { from: "leads-report" } });
    };

    const chartData = useMemo(() => {
        if (!data || data.length === 0 || !groupBy) return [];

        const groupMap: Record<string, number> = {};

        data.forEach((item) => {
            const rawValue = item[groupBy];
            let value = "Unknown";

            if (rawValue === null || rawValue === undefined || rawValue === "") {
                value = "Not Specified";
            } else if (typeof rawValue === 'boolean') {
                value = rawValue ? "Yes" : "No";
            } else {
                value = String(rawValue);
            }

            if (!groupMap[value]) {
                groupMap[value] = 0;
            }

            groupMap[value] += 1;
        });

        return Object.entries(groupMap)
            .map(([name, count]) => ({
                name,
                value: count, // Standardizing to 'value' for Pie/Funnel
                count: count, // Keeping 'count' for backward/Bar compatibility
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [data, groupBy]);

    if (chartData.length === 0) return null;

    const displayTitle = title || groupBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const renderChart = () => {
        switch (type) {
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="35%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            labelLine={false}
                        // label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={60} iconSize={8}
                            formatter={(value) => (
                                <span style={{ fontSize: '10px', color: '#555' }}>{value}</span>
                            )}
                            wrapperStyle={{
                                paddingTop: '16px',
                                fontSize: '10px',
                                lineHeight: '1.6',
                            }} />
                    </PieChart>
                );
            case 'line':
                return (
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={50}
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                        />
                        <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#0B64F4"
                            strokeWidth={2}
                            dot={{ fill: '#0B64F4', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                );
            case 'funnel':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip />
                            <Funnel
                                dataKey="value"
                                data={chartData}
                                isAnimationActive
                                width="200%"
                                onClick={handleChartClick}
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
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                );
            default: // bar
                return (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={50}
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                        />
                        <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '11px',
                                fontFamily: "'Instrument Sans', sans-serif"
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32} onClick={handleChartClick}>
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                );
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* <h3 className="text-sm font-bold text-slate-700 mb-4 px-1">{displayTitle}</h3> */}
            <div className="flex-1 min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ReportChart;

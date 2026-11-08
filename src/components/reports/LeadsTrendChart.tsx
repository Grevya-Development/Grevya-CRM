import { useMemo, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

interface Lead {
    created_at: string;
    conversion_status?: string;
}

interface Props {
    leads: Lead[];
    onStatusClick: (status: string) => void;
}

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const statuses = [
    "New / Uncontacted",
    "Contacted",
    "Qualified",
    "Opportunity",
    "Negotiation",
    "Converted / Won",
    "Lost",
    "Disqualified"
];

const LeadsTrendChart = ({ leads, onStatusClick }: Props) => {

    const currentMonth = new Date().getMonth();
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const chartData = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        const statusMap: Record<string, number> = {};

        statuses.forEach((status) => {
            statusMap[status] = 0;
        });

        leads.forEach((lead) => {
            if (!lead.created_at) return;

            const leadMonth = new Date(lead.created_at).getUTCMonth();

            if (leadMonth !== selectedMonth) return;

            const status = lead.conversion_status;

            if (status && statusMap[status] !== undefined) {
                statusMap[status]++;
            }
        });

        return statuses.map((status) => ({
            status,
            value: statusMap[status],
        }));

    }, [leads, selectedMonth]);

    return (
        <div className="w-full">

            <div className="flex justify-end mb-2">
                <select
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-0 focus:border-blue-500"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                    {months.map((month, index) => (
                        <option key={month} value={index}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>

            <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} onClick={(data) => {
                    if (data?.activeLabel && onStatusClick) {
                        onStatusClick(data.activeLabel);
                    }
                }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="status"
                        tick={{ fontSize: 9 }}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        interval={0}
                    />
                    <YAxis />
                    <Tooltip />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}

                    />
                </AreaChart>
            </ResponsiveContainer>

        </div>
    );
};

export default LeadsTrendChart;

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { targetVsAchieveData } from '@/data/sampleData';
import { useCurrency } from '@/hooks/useCurrency';

export function TargetVsAchieveChart() {
    const { formatCurrency, displayCurrency } = useCurrency();
    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Target vs Achieve</h3>
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#B45309]"></div>
                        <span className="text-muted-foreground font-medium">Target</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#0b66f4]"></div>
                        <span className="text-muted-foreground font-medium">Achieved</span>
                    </div>
                </div>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={targetVsAchieveData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            className="text-xs font-medium fill-muted-foreground"
                            tick={{ dy: 8 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            className="text-xs font-medium fill-muted-foreground"
                            tickFormatter={(value) => `${displayCurrency.symbol}${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            formatter={(value: number) => [formatCurrency(value), '']}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Bar
                            dataKey="target"
                            name="Target"
                            fill="#B45309"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                        />
                        <Bar
                            dataKey="achieved"
                            name="Achieved"
                            fill="#0b66f4"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

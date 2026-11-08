import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/supabase/supabaseClient';
import { useCurrency } from '@/hooks/useCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TargetUnit = 'revenue' | 'count';

type TargetRow = {
    id: string;
    name: string;
    unit: TargetUnit;
    target: number;
    achieved: number;
};

type WonLead = {
    lead_owner_id: string | null;
    lead_assign_to_id: string | null;
    estimated_deal_value: number | string | null;
    expected_close_date: string | null;
    created_at: string;
};

// Local calendar date as YYYY-MM-DD, comparable with Postgres `date` columns.
type MemberRow = { user_id: string; target_value: number | string | null };

type TargetQueryRow = {
    id: string;
    name: string;
    target_type: string | null;
    target_value: number | string | null;
    start_date: string;
    end_date: string;
    members: MemberRow[] | null;
    team: { members: { user_id: string }[] | null } | { members: { user_id: string }[] | null }[] | null;
};

const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// crm_leads has no "won at" column, so a Won lead counts on its close date
// (expected_close_date), falling back to when the lead was created.
const wonDateKey = (lead: WonLead) =>
    lead.expected_close_date
        ? lead.expected_close_date.slice(0, 10)
        : toDateKey(new Date(lead.created_at));

// Which target types we can measure from crm_leads. Others (e.g. Products,
// Service) have no achievement data in the schema, so they are not charted.
const unitForType = (targetType: string | null): TargetUnit | null => {
    switch ((targetType || '').toLowerCase()) {
        case 'revenue':
            return 'revenue';
        case 'lead':
        case 'leads':
            return 'count';
        default:
            return null;
    }
};

const truncate = (text: string, max = 12) =>
    text.length > max ? `${text.slice(0, max - 1)}…` : text;

async function getCurrentUserAndRole(): Promise<{ userId: string | null; role: string | null }> {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    if (!userId) return { userId: null, role: null };

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('roles ( name )')
        .eq('user_id', userId)
        .maybeSingle();

    const roles = (roleData as { roles?: { name?: string } | { name?: string }[] } | null)?.roles;
    const role = Array.isArray(roles) ? roles[0]?.name : roles?.name;
    return { userId, role: role ?? null };
}

export function TargetVsAchieveChart() {
    const { formatCurrency, displayCurrency } = useCurrency();
    const [rows, setRows] = useState<TargetRow[]>([]);
    const [untrackedCount, setUntrackedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [unit, setUnit] = useState<TargetUnit>('revenue');

    useEffect(() => {
        let cancelled = false;

        const fetchTargets = async () => {
            setLoading(true);
            setError(false);

            const { userId, role } = await getCurrentUserAndRole();
            if (!userId) {
                if (!cancelled) {
                    setRows([]);
                    setUntrackedCount(0);
                    setLoading(false);
                }
                return;
            }
            const isAdmin = role === 'Admin' || role === 'Super Admin';
            const today = toDateKey(new Date());

            // Active = today falls inside the target's date range.
            const { data: targets, error: targetsError } = await supabase
                .from('sales_targets')
                .select(
                    'id, name, target_type, target_value, start_date, end_date, members:sales_target_members(user_id, target_value), team:sales_teams(members:sales_team_members(user_id))'
                )
                .lte('start_date', today)
                .gte('end_date', today)
                .order('end_date', { ascending: true });

            if (cancelled) return;
            if (targetsError) {
                setError(true);
                setLoading(false);
                return;
            }

            // Who a target belongs to: its own members, else its team's members.
            // An empty list means a company-wide target.
            const withOwners = ((targets ?? []) as unknown as TargetQueryRow[]).map((t) => {
                const targetMembers = t.members ?? [];
                const team = Array.isArray(t.team) ? t.team[0] : t.team;
                const teamMemberIds = (team?.members ?? []).map((m) => m.user_id);
                const ownerIds = targetMembers.length
                    ? targetMembers.map((m) => m.user_id)
                    : teamMemberIds;
                return { ...t, targetMembers, ownerIds };
            });

            // Non-admins only see targets they are part of, measured against their own leads.
            const visible = isAdmin
                ? withOwners
                : withOwners.filter((t) => t.ownerIds.includes(userId));

            const measurable = visible.filter((t) => unitForType(t.target_type) !== null);
            const untracked = visible.length - measurable.length;

            if (measurable.length === 0) {
                setRows([]);
                setUntrackedCount(untracked);
                setLoading(false);
                return;
            }

            let leadsQuery = supabase
                .from('crm_leads')
                .select('lead_owner_id, lead_assign_to_id, estimated_deal_value, expected_close_date, created_at')
                .eq('lead_stage', 'Won')
                .eq('is_deleted', false);

            if (!isAdmin) {
                leadsQuery = leadsQuery.or(
                    `lead_owner_id.eq.${userId},lead_assign_to_id.eq.${userId}`
                );
            }

            const { data: wonLeads, error: leadsError } = await leadsQuery;

            if (cancelled) return;
            if (leadsError) {
                setError(true);
                setLoading(false);
                return;
            }

            const leads = (wonLeads ?? []) as WonLead[];

            const result: TargetRow[] = measurable.map((t) => {
                const targetUnit = unitForType(t.target_type) as TargetUnit;
                const start = String(t.start_date).slice(0, 10);
                const end = String(t.end_date).slice(0, 10);

                const counted = leads.filter((lead) => {
                    const key = wonDateKey(lead);
                    if (key < start || key > end) return false;
                    if (!isAdmin || t.ownerIds.length === 0) return true;
                    return (
                        (lead.lead_owner_id && t.ownerIds.includes(lead.lead_owner_id)) ||
                        (lead.lead_assign_to_id && t.ownerIds.includes(lead.lead_assign_to_id))
                    );
                });

                const achieved =
                    targetUnit === 'revenue'
                        ? counted.reduce((sum, l) => sum + Number(l.estimated_deal_value || 0), 0)
                        : counted.length;

                // A member's personal share, when one was set, is what they are measured against.
                const ownShare = !isAdmin
                    ? Number(t.targetMembers.find((m) => m.user_id === userId)?.target_value || 0)
                    : 0;
                const target = ownShare > 0 ? ownShare : Number(t.target_value || 0);

                return { id: t.id, name: t.name, unit: targetUnit, target, achieved };
            });

            setRows(result);
            setUntrackedCount(untracked);
            setUnit(result.some((r) => r.unit === 'revenue') ? 'revenue' : 'count');
            setLoading(false);
        };

        fetchTargets().catch(() => {
            if (!cancelled) {
                setError(true);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const hasRevenue = rows.some((r) => r.unit === 'revenue');
    const hasCount = rows.some((r) => r.unit === 'count');
    const chartData = useMemo(() => rows.filter((r) => r.unit === unit), [rows, unit]);

    const formatValue = (value: number) =>
        unit === 'revenue' ? formatCurrency(value) : value.toLocaleString();

    const formatTick = (value: number) => {
        if (unit === 'count') return value.toLocaleString();
        return Math.abs(value) >= 1000
            ? `${displayCurrency.symbol}${value / 1000}k`
            : `${displayCurrency.symbol}${value}`;
    };

    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-slide-up">
            <div className="mb-4 flex items-center justify-between gap-2">
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

            {hasRevenue && hasCount && (
                <div className="mb-2 flex gap-1 text-xs">
                    {(['revenue', 'count'] as TargetUnit[]).map((u) => (
                        <button
                            key={u}
                            type="button"
                            onClick={() => setUnit(u)}
                            className={cn(
                                'rounded-md px-2 py-0.5 font-medium transition-colors',
                                unit === u
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted/50'
                            )}
                        >
                            {u === 'revenue' ? 'Revenue' : 'Leads won'}
                        </button>
                    ))}
                </div>
            )}

            <div className="h-64">
                {loading ? (
                    <div className="flex h-full items-end gap-4 px-4 pb-6">
                        {[60, 85, 45, 70].map((h, i) => (
                            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Couldn't load targets
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                        <p className="text-sm text-muted-foreground">No active targets</p>
                        <Link to="/sales-targets" className="text-xs text-primary hover:underline">
                            Set up sales targets
                        </Link>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                className="text-xs font-medium fill-muted-foreground"
                                tick={{ dy: 8 }}
                                tickFormatter={(value: string) => truncate(value)}
                                interval={0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={unit === 'revenue'}
                                className="text-xs font-medium fill-muted-foreground"
                                tickFormatter={formatTick}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                formatter={(value: number, name: string) => [formatValue(value), name]}
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
                )}
            </div>

            {!loading && !error && untrackedCount > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                    {untrackedCount} active {untrackedCount === 1 ? 'target' : 'targets'} (products/service)
                    {' '}can't be measured here yet.
                </p>
            )}
        </div>
    );
}

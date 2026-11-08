// Real numbers for the dashboard stat cards: weekly mini-charts, month-over-month
// revenue change, and the drill-down breakdowns shown when a card is clicked.

type Lead = {
    id: string;
    lead_name?: string | null;
    subject?: string | null;
    lead_stage?: string | null;
    lead_source?: string | null;
    estimated_deal_value?: number | string | null;
    expected_close_date?: string | null;
    created_at?: string | null;
    crm_customers?: { name?: string | null } | null;
};

const DAY = 24 * 60 * 60 * 1000;
const value = (l: Lead) => Number(l.estimated_deal_value || 0);
const isWon = (l: Lead) => l.lead_stage === 'Won';
const isOpen = (l: Lead) => !['Won', 'Lost'].includes(l.lead_stage || '');
const created = (l: Lead) => (l.created_at ? new Date(l.created_at) : null);
// There is no "won at" column, so a won deal is dated by its expected close date, else creation.
const wonDate = (l: Lead) => {
    const d = l.expected_close_date || l.created_at;
    return d ? new Date(d) : null;
};

/** Sum of `amount` per week for the last `weeks` weeks (oldest first). */
function weekly(leads: Lead[], include: (l: Lead) => boolean, dateOf: (l: Lead) => Date | null, amount: (l: Lead) => number, weeks = 8) {
    const now = Date.now();
    const series = new Array(weeks).fill(0);
    for (const l of leads) {
        if (!include(l)) continue;
        const d = dateOf(l);
        if (!d) continue;
        const weeksAgo = Math.floor((now - d.getTime()) / (7 * DAY));
        if (weeksAgo >= 0 && weeksAgo < weeks) series[weeks - 1 - weeksAgo] += amount(l);
    }
    return series;
}

export function statCharts(leads: Lead[]) {
    return {
        revenue: weekly(leads, isWon, wonDate, value),
        openDeals: weekly(leads, isOpen, created, () => 1),
        newLeads: weekly(leads, () => true, created, () => 1),
        won: weekly(leads, isWon, wonDate, () => 1),
    };
}

/** "+12% vs last month" style text for won revenue, or a neutral label when there is no history. */
export function revenueChange(leads: Lead[]): { text: string; positive: boolean } {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let current = 0;
    let previous = 0;
    for (const l of leads.filter(isWon)) {
        const d = wonDate(l);
        if (!d) continue;
        if (d >= thisMonth) current += value(l);
        else if (d >= lastMonth) previous += value(l);
    }
    if (previous === 0) return { text: 'from won deals', positive: true };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { text: `${pct >= 0 ? '+' : ''}${pct}% vs last month`, positive: pct >= 0 };
}

const detail = (l: Lead) => ({
    id: l.id,
    name: l.lead_name || l.subject || 'Untitled lead',
    value: value(l),
    date: l.created_at ? l.created_at.slice(0, 10) : undefined,
    status: l.lead_stage || undefined,
    company: l.crm_customers?.name || undefined,
});

function groupBy(leads: Lead[], key: (l: Lead) => string) {
    const groups = new Map<string, Lead[]>();
    for (const l of leads) {
        const k = key(l);
        groups.set(k, [...(groups.get(k) || []), l]);
    }
    return groups;
}

/** Drill-down data for each dashboard card, built from the user's real leads. */
export function buildDrillDowns(leads: Lead[]) {
    const won = leads.filter(isWon);
    const open = leads.filter(isOpen);
    const weekAgo = Date.now() - 7 * DAY;
    const recent = leads.filter(l => (created(l)?.getTime() ?? 0) >= weekAgo);
    const total = leads.length;

    const monthLabel = (l: Lead) => {
        const d = wonDate(l);
        return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'No date';
    };

    const revenue = {
        type: 'revenue' as const,
        title: 'Total Revenue (won deals)',
        value: won.reduce((s, l) => s + value(l), 0),
        breakdown: [...groupBy(won, monthLabel)].map(([label, items]) => ({
            id: `rev-${label}`,
            label,
            value: items.reduce((s, l) => s + value(l), 0),
            subValue: `${items.length} won deal${items.length === 1 ? '' : 's'}`,
            details: items.map(detail),
        })),
    };

    const openDeals = {
        type: 'Leads' as const,
        title: 'Open Deals by Stage',
        value: open.length,
        breakdown: [...groupBy(open, l => l.lead_stage || 'No stage')].map(([label, items]) => ({
            id: `open-${label}`,
            label,
            value: items.length,
            subValue: `${items.reduce((s, l) => s + value(l), 0).toLocaleString()} pipeline value`,
            details: items.map(detail),
        })),
    };

    const newLeads = {
        type: 'leads' as const,
        title: 'New Leads This Week by Source',
        value: recent.length,
        breakdown: [...groupBy(recent, l => l.lead_source || 'Unknown source')].map(([label, items]) => ({
            id: `new-${label}`,
            label,
            value: items.length,
            details: items.map(detail),
        })),
    };

    const conversion = {
        type: 'conversion' as const,
        title: 'Leads by Stage (% of all leads)',
        value: total ? Number(((won.length / total) * 100).toFixed(1)) : 0,
        breakdown: [...groupBy(leads, l => l.lead_stage || 'No stage')].map(([label, items]) => ({
            id: `conv-${label}`,
            label,
            value: total ? Number(((items.length / total) * 100).toFixed(1)) : 0,
            subValue: `${items.length} lead${items.length === 1 ? '' : 's'}`,
            details: items.map(detail),
        })),
    };

    return { revenue, openDeals, newLeads, conversion };
}

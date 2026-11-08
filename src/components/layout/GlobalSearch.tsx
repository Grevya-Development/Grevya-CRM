import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { supabase } from '@/supabase/supabaseClient';
import {
    Building2,
    Users,
    Briefcase,
    CheckSquare,
    Package,
    LayoutDashboard,
    Calendar,
    Settings,
    BarChart3,
    Bot,
    Target,
    Network,
    Zap,
    Shield,
    UsersRound,
    FileText,
    Cog,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: 'Contact' | 'Company' | 'Leads' | 'Task' | 'Product' | 'Navigation';
    path: string;
}

export function GlobalSearch({ className }: { className?: string }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Overview and key metrics', path: '/', icon: LayoutDashboard },
        { id: 'nav-contacts', title: 'Contacts', subtitle: 'Manage your contacts', path: '/contacts', icon: Users },
        { id: 'nav-Leads', title: 'Leads', subtitle: 'Track your Leads', path: '/Leads', icon: Briefcase },
        { id: 'nav-companies', title: 'Companies', subtitle: 'Manage companies', path: '/companies', icon: Building2 },
        { id: 'nav-sales', title: 'Sales & Quotes', subtitle: 'Sales and quotation management', path: '/sales-quotation', icon: FileText },
        { id: 'nav-tasks', title: 'Tasks', subtitle: 'Manage your tasks', path: '/tasks', icon: CheckSquare },
        { id: 'nav-calendar', title: 'Calendar', subtitle: 'View your schedule', path: '/calendar', icon: Calendar },
        { id: 'nav-ai', title: 'AI Hub', subtitle: 'AI-powered features', path: '/ai-hub', icon: Bot },
        { id: 'nav-automation', title: 'Automation', subtitle: 'Workflow automation', path: '/automation', icon: Zap },
        { id: 'nav-reports', title: 'Reports', subtitle: 'Analytics and reports', path: '/reports', icon: BarChart3 },
        { id: 'nav-targets', title: 'Sales Targets', subtitle: 'Track sales targets', path: '/sales-targets', icon: Target },
        { id: 'nav-team', title: 'Team', subtitle: 'Team performance', path: '/team', icon: UsersRound },
        { id: 'nav-admin', title: 'Admin', subtitle: 'Administration settings', path: '/admin', icon: Shield },
        { id: 'nav-org', title: 'Organization', subtitle: 'Organization settings', path: '/organization', icon: Network },
        { id: 'nav-settings', title: 'Settings', subtitle: 'Application settings', path: '/settings', icon: Cog },
    ];

    const searchSupabase = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const searchResults: SearchResult[] = [];

        // Commas and brackets have meaning inside the API's or() filter, so strip them.
        const q = searchQuery.replace(/[,()%]/g, ' ').trim();

        try {

            const [contactsRes, customersRes, productsRes, leadsRes] = await Promise.all([
                supabase
                    .from('crm_contacts')
                    .select('id, name, email, mobile_no, designation, customer_id, customer:crm_customers(name)')
                    .or(`name.ilike.%${q}%,email.ilike.%${q}%,mobile_no.ilike.%${q}%,designation.ilike.%${q}%`)
                    .limit(5),
                supabase
                    .from('crm_customers')
                    .select('id, name, industry, website_link')
                    .or(`name.ilike.%${q}%,industry.ilike.%${q}%,website_link.ilike.%${q}%`)
                    .limit(5),
                supabase
                    .from('products')
                    .select('id, name, sku, base_price')
                    .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
                    .limit(5),
                supabase
                    .from('crm_leads')
                    .select('id, lead_name, subject, lead_number, lead_stage, crm_customers(name)')
                    .not('is_deleted', 'is', true)
                    .or(`lead_name.ilike.%${q}%,subject.ilike.%${q}%,email.ilike.%${q}%,lead_number.ilike.%${q}%`)
                    .limit(5)
            ]);

            if (leadsRes.data) {
                leadsRes.data.forEach((l: any) => {
                    searchResults.push({
                        id: l.id,
                        title: l.lead_name || l.subject || l.lead_number,
                        subtitle: [l.lead_number, l.lead_stage, l.crm_customers?.name].filter(Boolean).join(' • '),
                        category: 'Leads',
                        path: `/leads/${l.id}`
                    });
                });
            }

            if (contactsRes.data) {
                contactsRes.data.forEach((c: any) => {
                    const companyName = c.customer?.name;
                    const detail = c.email || c.mobile_no || c.designation || '';
                    searchResults.push({
                        id: c.id,
                        title: c.name || companyName || detail,
                        subtitle: companyName ? (detail ? `${detail} • ${companyName}` : companyName) : detail,
                        category: 'Contact',
                        path: `/contacts/view/${c.id}`
                    });
                });
            }

            if (customersRes.data) {
                customersRes.data.forEach((c: any) => {
                    searchResults.push({
                        id: c.id,
                        title: c.name,
                        subtitle: [c.industry, c.website_link].filter(Boolean).join(' • '),
                        category: 'Company',
                        path: `/contacts/view/${c.id}`
                    });
                });
            }

            if (productsRes.data) {
                productsRes.data.forEach((p: any) => {
                    searchResults.push({
                        id: String(p.id),
                        title: p.name,
                        subtitle: `${p.sku} • ₹${p.base_price}`,
                        category: 'Product',
                        path: `/products/${p.id}`
                    });
                });
            }

            const filteredNav = navItems.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(item => ({
                ...item,
                category: 'Navigation' as const
            }));

            searchResults.push(...filteredNav);

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchSupabase(query);
                setOpen(true);
            } else {
                setResults([]);
                setOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchSupabase]);

    const handleSelect = (path: string) => {
        navigate(path);
        setOpen(false);
        setQuery('');
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Contact': return Users;
            case 'Company': return Building2;
            case 'Leads': return Briefcase;
            case 'Task': return CheckSquare;
            case 'Product': return Package;
            case 'Navigation': return LayoutDashboard;
            default: return Users;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Contact': return 'text-blue-600';
            case 'Company': return 'text-purple-600';
            case 'Leads': return 'text-green-600';
            case 'Task': return 'text-orange-600';
            case 'Product': return 'text-cyan-600';
            case 'Navigation': return 'text-indigo-600';
            default: return 'text-gray-600';
        }
    };

    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.category]) {
            acc[result.category] = [];
        }
        acc[result.category].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div className="relative w-full max-w-md hidden md:block group">
            <Command shouldFilter={false} className="rounded-xl border bg-background shadow-none group-focus-within:ring-1 group-focus-within:ring-ring transition-all overflow-visible">
                <CommandInput
                    placeholder="Search"
                    value={query}
                    onValueChange={setQuery}
                    className="border-none focus:ring-0"
                    onFocus={() => { if (query) setOpen(true); }}
                    onBlur={() => {
                        setTimeout(() => setOpen(false), 200);
                    }}
                />

                {open && (query.length > 0) && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full rounded-xl border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 z-50 overflow-hidden">
                        <CommandList className="max-h-[400px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : results.length === 0 ? (
                                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                    No results found.
                                </CommandEmpty>
                            ) : (
                                Object.entries(groupedResults).map(([category, items]) => (
                                    <CommandGroup key={category} heading={category} className="mb-2 last:mb-0">
                                        {items.map((result) => {
                                            const Icon = getCategoryIcon(result.category);
                                            return (
                                                <CommandItem
                                                    key={`${result.category}-${result.id}`}
                                                    value={`${result.title} ${result.subtitle} ${result.category}`} // Not used for filter but good for accessibility/keying
                                                    onSelect={() => handleSelect(result.path)}
                                                    className="cursor-pointer rounded-lg px-3 py-2 aria-selected:bg-muted"
                                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur before click processing
                                                >
                                                    <div className={`mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-muted/50`}>
                                                        <Icon className={`h-4 w-4 ${getCategoryColor(result.category)}`} />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="truncate font-medium">{result.title}</div>
                                                        <div className="truncate text-xs text-muted-foreground">{result.subtitle}</div>
                                                    </div>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                ))
                            )}
                        </CommandList>
                    </div>
                )}
            </Command>
        </div>
    );
}


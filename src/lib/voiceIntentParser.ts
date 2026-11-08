export type IntentType =
    | 'navigate'
    | 'search'
    | 'create'
    | 'help'
    | 'greeting'
    | 'metric'
    | 'view_record'
    | 'lookup_customer'
    | 'close'
    | 'unknown';

export interface ParsedIntent {
    type: IntentType;
    route?: string;
    routeName?: string;
    searchQuery?: string;
    createType?: string;
    metricType?: 'total_leads' | 'estimated_deal_value' | 'open_pipeline' | 'won_monthly';
    targetName?: string;
    infoField?: 'email' | 'phone' | 'status' | 'general';
    response: string;
}

// Navigation routes map
const NAV_ROUTES: Record<string, { route: string; name: string }> = {
    // Core
    dashboard: { route: '/dashboard', name: 'Dashboard' },
    home: { route: '/', name: 'Home' },
    landing: { route: '/', name: 'Home' },
    overview: { route: '/dashboard', name: 'Dashboard' },
    login: { route: '/login', name: 'Login Space' },

    // SALES Module
    contacts: { route: '/contacts', name: 'Contacts' },
    leads: { route: '/Leads', name: 'Leads' },
    lead: { route: '/Leads', name: 'Leads' },
    quotation: { route: '/sales-quotation', name: 'Sales & Quotations' },
    quotations: { route: '/sales-quotation', name: 'Sales & Quotations' },
    sales: { route: '/sales-quotation', name: 'Sales & Quotations' },
    'sales quotation': { route: '/sales-quotation', name: 'Sales & Quotations' },
    targets: { route: '/sales-targets', name: 'Sales Targets' },
    'sales targets': { route: '/sales-targets', name: 'Sales Targets' },

    // REPORTING Module
    'forecast report': { route: '/forecast-report', name: 'Forecast Report' },
    'reporting forecast': { route: '/forecast-report', name: 'Forecast Report' },
    'pipeline report': { route: '/pipeline-report', name: 'Pipeline Report' },
    'reporting pipeline': { route: '/pipeline-report', name: 'Pipeline Report' },
    'leads report': { route: '/leads-report', name: 'Leads Report' },
    'reporting leads': { route: '/leads-report', name: 'Leads Report' },
    'activities report': { route: '/activities-report', name: 'Activities Report' },
    'reporting activities': { route: '/activities-report', name: 'Activities Report' },
    teams: { route: '/team', name: 'Teams' },
    'team management': { route: '/team', name: 'Team Management' },

    // CONFIGURATION Module
    'forecast settings': { route: '/forecast', name: 'Forecast Configuration' },
    forecast: { route: '/forecast', name: 'Forecast Configuration' },
    'pipeline settings': { route: '/settings/pipeline', name: 'Pipeline Settings' },
    'leads settings': { route: '/settings/leads', name: 'Leads Settings' },
    'activities calendar': { route: '/calendar', name: 'Activities Calendar' },
    calendar: { route: '/calendar', name: 'Calendar' },
    masters: { route: '/configuration/masters', name: 'Master Data' },
    'master data': { route: '/configuration/masters', name: 'Master Data' },

    // Advanced Items
    'ai hub': { route: '/ai-hub', name: 'AI Hub' },
    ai: { route: '/ai-hub', name: 'AI Hub' },
    grevya: { route: '/ai-hub', name: 'AI Hub' },
    automation: { route: '/automation', name: 'Automation' },
    workflows: { route: '/automation', name: 'Automation' },
    organization: { route: '/organization', name: 'Organization' },
    admin: { route: '/admin', name: 'Admin Panel' },
    administrator: { route: '/admin', name: 'Admin Panel' },
    profile: { route: '/profile', name: 'My Profile' },
    'my profile': { route: '/profile', name: 'My Profile' },

    // Products
    products: { route: '/products', name: 'Products' },
    product: { route: '/products', name: 'Products' },
    inventory: { route: '/products', name: 'Inventory' },
    categories: { route: '/categories', name: 'Categories' },

    // Settings
    settings: { route: '/settings', name: 'Settings' },
    'user settings': { route: '/settings', name: 'User Settings' },
    'sales teams': { route: '/settings/sales-teams', name: 'Sales Teams' },
    'activity types': { route: '/settings/activity-types', name: 'Activity Types' },
    'activity plans': { route: '/settings/activity-plans', name: 'Activity Plans' },
    tags: { route: '/settings/tags', name: 'Tags' },
    'lost reasons': { route: '/settings/lost-reasons', name: 'Lost Reasons' },
    'lead mining': { route: '/settings/lead-mining', name: 'Lead Mining' },

    // Finance/Others
    tasks: { route: '/tasks', name: 'Tasks' },
    invoices: { route: '/invoices', name: 'Invoices' },
    payments: { route: '/payments', name: 'Payments' },
    orders: { route: '/orders', name: 'Orders' },
    'meeting schedule': { route: '/calendar', name: 'Meeting Schedule' },
    'reset password': { route: '/reset-password', name: 'Reset Password' },
    pivot: { route: '/Leads/pivot', name: 'Leads Pivot' },
    graph: { route: '/Leads/graph', name: 'Leads Graph' },
    'lead activity': { route: '/Leads/activity', name: 'Leads Activity' },

    // Aliases
    'customer list': { route: '/contacts', name: 'Customer List' },
    'lead list': { route: '/Leads', name: 'Leads' },
    'product list': { route: '/products', name: 'Products' },
    'company list': { route: '/companies', name: 'Companies' },
    'quotation list': { route: '/sales-quotation', name: 'Sales & Quotations' },
};

// Create/add intents
const CREATE_MAP: Record<string, { route: string; name: string }> = {
    lead: { route: '/Leads/add', name: 'Lead' },
    leads: { route: '/Leads/add', name: 'Lead' },
    opportunity: { route: '/Leads/add', name: 'Lead' },
    contact: { route: '/contacts/add', name: 'Contact' },
    contacts: { route: '/contacts/add', name: 'Contact' },
    person: { route: '/contacts/add', name: 'Contact' },
    company: { route: '/companies/add', name: 'Company' },
    companies: { route: '/companies/add', name: 'Company' },
    product: { route: '/products/add', name: 'Product' },
    products: { route: '/products/add', name: 'Product' },
    quotation: { route: '/quotations/new', name: 'Quotation' },
    quote: { route: '/quotations/new', name: 'Quotation' },
    invoice: { route: '/invoices', name: 'Invoice' },
    meeting: { route: '/calendar', name: 'Meeting' },
    task: { route: '/tasks', name: 'Task' },
    target: { route: '/sales-targets', name: 'Sales Target' },
    category: { route: '/categories', name: 'Category' },
};

const NAV_VERBS = [
    'go to', 'open', 'show', 'navigate to', 'take me to',
    'visit', 'display', 'view', 'let me see', 'switch to', 'jump to',
];

const SEARCH_VERBS = [
    'search for', 'search', 'find', 'look for', 'look up',
    'get', 'fetch', 'locate', 'where is', 'show me',
];

const CREATE_VERBS = [
    'create', 'add', 'new', 'create a new', 'add a new',
    'make', 'make a new', 'create a', 'add a', 'start a',
];

const HELP_PHRASES = [
    'help', 'what can you do', 'commands', 'what do you know',
    'capabilities', 'options', 'features', 'what can i say',
];

const GREETINGS = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon',
    'good evening', 'good day', 'hi there', 'hey there',
];

const CLOSE_PHRASES = [
    'close', 'dismiss', 'stop', 'cancel', 'exit', 'quit', 'bye',
    'goodbye', 'bye bye', 'close grevya', 'stop listening',
    'close assistant', 'never mind', 'nevermind', 'that\'s all',
    'thats all', 'done', 'go away', 'hide',
];

// Verbs that indicate looking up info about a specific person/customer
const LOOKUP_VERBS = [
    'tell me about', 'info about', 'info on', 'details on', 'details about',
    'what is', "what's", 'status of', 'status for', 'email of', "email for",
    'phone of', 'phone for', 'contact info for', 'contact info of',
];

function normalize(text: string): string {
    return text.toLowerCase().trim().replace(/[.,!?]/g, '');
}

function extractAfterVerb(text: string, verbs: string[]): string | null {
    const prefixes = '(?:(?:please|i want to|can you|could you|i need to|i would like to|let\\s*s|let me)\\s+)?';
    for (const verb of verbs.sort((a, b) => b.length - a.length)) {
        const pattern = new RegExp(`^${prefixes}${verb}\\s+(.+)$`, 'i');
        const match = text.match(pattern);
        if (match) return match[1].trim().toLowerCase();
    }
    return null;
}

function matchRoute(query: string): { route: string; name: string } | null {
    if (NAV_ROUTES[query]) return NAV_ROUTES[query];
    for (const key of Object.keys(NAV_ROUTES).sort((a, b) => b.length - a.length)) {
        if (query.includes(key)) return NAV_ROUTES[key];
    }
    return null;
}

function matchCreate(query: string): { route: string; name: string } | null {
    for (const key of Object.keys(CREATE_MAP).sort((a, b) => b.length - a.length)) {
        if (query.includes(key)) return CREATE_MAP[key];
    }
    return null;
}

const MENU_CATEGORIES: Record<string, { name: string; options: string[] }> = {
    sales: { name: 'Sales', options: ['Contacts', 'Leads', 'Quotation'] },
    reporting: { name: 'Reporting', options: ['Forecast report', 'Pipeline report', 'Leads report', 'Activities report', 'Teams'] },
    configuration: { name: 'Configuration', options: ['Forecast settings', 'Pipeline settings', 'Leads settings', 'Activities calendar', 'Masters'] },
};

function matchCategory(query: string): { name: string; options: string[] } | null {
    const q = query.toLowerCase().trim();
    if (MENU_CATEGORIES[q]) return MENU_CATEGORIES[q];
    return null;
}

const METRIC_PHRASES: Record<string, { type: 'total_leads' | 'estimated_deal_value' | 'open_pipeline' | 'won_monthly'; name: string }> = {
    'total leads': { type: 'total_leads', name: 'Total Leads' },
    'total lead': { type: 'total_leads', name: 'Total Leads' },
    'estimated deal value': { type: 'estimated_deal_value', name: 'Estimated Deal Value' },
    'deal value': { type: 'estimated_deal_value', name: 'Estimated Deal Value' },
    'estimated value': { type: 'estimated_deal_value', name: 'Estimated Deal Value' },
    'open pipeline': { type: 'open_pipeline', name: 'Open Pipeline' },
    'total pipeline': { type: 'open_pipeline', name: 'Open Pipeline' },
    'pipeline': { type: 'open_pipeline', name: 'Open Pipeline' },
    'won monthly': { type: 'won_monthly', name: 'Won Monthly' },
    'monthly won': { type: 'won_monthly', name: 'Won Monthly' },
};

function matchMetric(query: string): { type: 'total_leads' | 'estimated_deal_value' | 'open_pipeline' | 'won_monthly'; name: string } | null {
    for (const key of Object.keys(METRIC_PHRASES).sort((a, b) => b.length - a.length)) {
        if (query.includes(key)) return METRIC_PHRASES[key];
    }
    return null;
}

/**
 * Detect if the phrase is asking for a specific field about a customer.
 */
function detectInfoField(text: string): 'email' | 'phone' | 'status' | 'general' {
    if (/\bemail\b/i.test(text)) return 'email';
    if (/\bphone\b|\bmobile\b|\bnumber\b/i.test(text)) return 'phone';
    if (/\bstatus\b|\bstage\b/i.test(text)) return 'status';
    return 'general';
}

/**
 * Strip common entity prefixes from a target like "the customer john" → "john"
 */
function cleanTargetName(name: string): string {
    return name
        .replace(/^(?:the\s+)?(?:customer|contact|lead|person|user|client)\s+/i, '')
        .trim();
}

export function parseVoiceIntent(rawText: string): ParsedIntent {
    const text = normalize(rawText);

    // Close / Dismiss
    if (CLOSE_PHRASES.some((c) => text === c || text.startsWith(c + ' ') || text.endsWith(' ' + c))) {
        return {
            type: 'close',
            response: 'Closing.',
        };
    }

    // Greetings
    if (GREETINGS.some((g) => text === g || text.startsWith(g + ' '))) {
        return {
            type: 'greeting',
            response: "Hey! You can say \"go to contacts\", \"find John\", or \"create a new lead\".",
        };
    }

    // Help
    if (HELP_PHRASES.some((h) => text.includes(h))) {
        return {
            type: 'help',
            response:
                "Say \"go to\" followed by a page, \"find\" to search, or \"create a new\" to add records. I can also fetch metrics like total leads or deal value.",
        };
    }

    // 1. Category Ambiguity (e.g. "go to sales")
    const genericQuery = extractAfterVerb(text, NAV_VERBS) || (NAV_VERBS.every(v => !text.startsWith(v)) ? text : null);
    if (genericQuery) {
        const categoryMatch = matchCategory(genericQuery);
        if (categoryMatch) {
            return {
                type: 'help',
                response: `Which part of ${categoryMatch.name}? I can take you to ${categoryMatch.options.join(', or ')}.`,
            };
        }
    }

    // 2. Lookup intent (e.g. "tell me about John", "what is John's email")
    const lookupQuery = extractAfterVerb(text, LOOKUP_VERBS);
    if (lookupQuery) {
        const cleanTarget = cleanTargetName(lookupQuery);
        // Make sure it's not matching a route
        if (cleanTarget && !matchRoute(cleanTarget)) {
            const infoField = detectInfoField(text);
            return {
                type: 'lookup_customer',
                targetName: cleanTarget,
                infoField,
                response: `Looking up ${cleanTarget}…`,
            };
        }
    }

    // 3. Navigation intent
    const navQuery = extractAfterVerb(text, NAV_VERBS);
    if (navQuery) {
        const match = matchRoute(navQuery);
        if (match) {
            return {
                type: 'navigate',
                route: match.route,
                routeName: match.name,
                response: `Opening ${match.name}…`,
            };
        }
    }

    // 4. Create intent
    const createQuery = extractAfterVerb(text, CREATE_VERBS);
    if (createQuery) {
        const match = matchCreate(createQuery);
        if (match) {
            return {
                type: 'create',
                route: match.route,
                routeName: match.name,
                response: `Opening the form to create a new ${match.name}…`,
            };
        }
    }

    // 5. Search intent
    const searchQuery = extractAfterVerb(text, SEARCH_VERBS);
    if (searchQuery) {
        return {
            type: 'search',
            searchQuery,
            response: `Searching for "${searchQuery}"…`,
        };
    }

    // 6. Metric intent
    const metricMatch = matchMetric(text);
    if (metricMatch) {
        return {
            type: 'metric',
            metricType: metricMatch.type,
            response: `Fetching ${metricMatch.name}…`,
        };
    }

    // 7. Explicit view intent (verb present, e.g. "view John", "open John Smith")
    const viewVerbs = ['view', 'show', 'open', 'details of', 'show me details of', 'find details for'];
    const explicitViewQuery = extractAfterVerb(text, viewVerbs);
    if (explicitViewQuery) {
        const match = matchRoute(explicitViewQuery);
        if (!match) {
            const cleanTarget = cleanTargetName(explicitViewQuery);
            return {
                type: 'view_record',
                targetName: cleanTarget,
                response: `Looking up ${cleanTarget}…`,
            };
        }
    }

    // 8. Direct route match with no verb (e.g., just "contacts")
    const directMatch = matchRoute(text);
    if (directMatch) {
        return {
            type: 'navigate',
            route: directMatch.route,
            routeName: directMatch.name,
            response: `Opening ${directMatch.name}…`,
        };
    }

    // 9. Bare name fallback — treat as customer lookup (no route match found)
    // Only trigger if text looks like a name (2+ chars, no command words)
    const commandWords = [...NAV_VERBS, ...SEARCH_VERBS, ...CREATE_VERBS, ...HELP_PHRASES, ...CLOSE_PHRASES];
    const isCommand = commandWords.some(v => text.includes(v));
    if (!isCommand && text.length > 2 && text.split(' ').length <= 4) {
        return {
            type: 'lookup_customer',
            targetName: text,
            infoField: 'general',
            response: `Looking up ${rawText}…`,
        };
    }

    return {
        type: 'unknown',
        response: `Didn't catch that. Try "go to contacts" or say "help".`,
    };
}

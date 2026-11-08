import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from "@/supabase/supabaseClient";
import ReactMarkdown from "react-markdown";
// custom chatbot styles
import "./AiAssistant.css";
import {
    Send,
    X,
    ChevronDown,
    Minus,
    Loader2,
    MessageSquare,
    Lightbulb,
    User,
    Bot,
} from "lucide-react";
import { salesPersons } from "@/data/salesData"; // UI sample data for top performers
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// logo for the chatbot – imported from assets folder
import BotLogo from '@/assets/ai-logo.png';
const BOT_LOGO = BotLogo;
interface Props {
    currentPath: string;
}

type Message = {
    id: string;
    role: "user" | "ai" | "assistant";
    content: string;
    timestamp: Date;
};

/* ===============================
PAGE DETECTION
================================ */

const detectPageType = (pathname: string): string => {
    const path = pathname.toLowerCase();

    if (path.includes("customer")) return "customers";
    if (path.includes("lead")) return "leads";
    if (path.includes("quotation")) return "quotation";
    if (path.includes("inbox")) return "inbox";

    if (path.includes("forecast")) return "forecast";
    if (path.includes("pipeline")) return "pipeline";
    if (path.includes("activities")) return "activities";
    if (path.includes("teams")) return "teams";

    if (path.includes("masters")) return "masters";

    return "dashboard";
};

/* ===============================
QUICK ACTION PROMPTS BY PAGE
================================ */

const getQuickPrompts = (pageType: string): Array<{ label: string; prompt: string }> => {
    const quickPromptsMap: Record<string, Array<{ label: string; prompt: string }>> = {
        "leads": [
            { label: "High-value deals", prompt: "Show me the highest value leads" },
            { label: "Recent activity", prompt: "What recent activity happened on leads?" },
            { label: "Top performers", prompt: "Who has the best performance on leads?" },
            { label: "Summary", prompt: "Summarize the current leads pipeline" },
        ],
        "customers": [
            { label: "Latest customers", prompt: "Who are our latest customers?" },
            { label: "First customer", prompt: "Who was our first customer and when did they join?" },
            { label: "Customer summary", prompt: "Give me a summary of all our customers" },
            { label: "Recent changes", prompt: "What changes happened recently with customers?" },
        ],
        "quotation": [
            { label: "Approved quotes", prompt: "How many quotes have been approved?" },
            { label: "Top salespeople", prompt: "Which salespeople have the highest quota values?" },
            { label: "Quote summary", prompt: "Summarize the status of all quotations" },
            { label: "Recent quotes", prompt: "What quotations were recently created?" },
        ],
        "pipeline": [
            { label: "Pipeline status", prompt: "What's the current pipeline status?" },
            { label: "Bottlenecks", prompt: "Which leads are stuck?" },
            { label: "Highest scoring leads", prompt: "Show me leads with the highest scores" },
            { label: "Next actions", prompt: "What's our next priority in the pipeline?" },
        ],
        "dashboard": [
            { label: "Overall summary", prompt: "Give me an overview of the CRM" },
            { label: "Key metrics", prompt: "What are our key metrics?" },
            { label: "Recent activity", prompt: "What's happened recently?" },
            { label: "Top priorities", prompt: "What should we focus on?" },
        ],
    };

    return quickPromptsMap[pageType] || quickPromptsMap["dashboard"];
};

export default function AIAssistant({ currentPath }: Props) {
    const { aiEnabled } = useLayout();
    // Hide the assistant when AI is turned off or on settings pages.
    // This check lives in a wrapper so the panel's hooks always run in the same order.
    if (!aiEnabled || currentPath.toLowerCase().startsWith('/settings')) return null;
    return <AIAssistantPanel currentPath={currentPath} />;
}

function AIAssistantPanel({ currentPath }: Props) {
    const [input, setInput] = useState("");
    // conversation always starts fresh on load (only last query is stored separately)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "initial",
            role: "ai",
            content: `🧠 **Welcome to Grevya CRM!**

I’m your AI assistant and I’m here to assist you with anything you need related to your CRM data. Feel free to ask any question or click a quick prompt to get started.`,
            timestamp: new Date(),
        },
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const contextCache = useRef<any>(null);

    const pageType = detectPageType(currentPath);
    const quickPrompts = getQuickPrompts(pageType); // still used for UI suggestions

    // track last user query separately
    const [lastUserQuery, setLastUserQuery] = useState<string>("");

    // Persistent toggle position via MotionValues
    const toggleX = useMotionValue(0);
    const toggleY = useMotionValue(0);

    useEffect(() => {
        try {
            const storedQuery = localStorage.getItem("aiAssistantLastQuery");
            if (storedQuery) setLastUserQuery(storedQuery);

            const storedPos = localStorage.getItem("aiAssistantTogglePos");
            if (storedPos) {
                const pos = JSON.parse(storedPos);
                toggleX.set(pos.x);
                toggleY.set(pos.y);
            }
        } catch (e) {
            console.warn("AI assistant: failed to read from storage", e);
        }
    }, [toggleX, toggleY]);

    // compute memoized array for rendering (only one element)
    const recentUserQueries = useMemo(() => (
        lastUserQuery ? [lastUserQuery] : []
    ), [lastUserQuery]);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollElement) {
                    scrollElement.scrollTop = scrollElement.scrollHeight;
                } else if (scrollRef.current.scroll) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [messages]);


    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    /* ===============================
       CONTEXT GENERATOR
    ================================ */

    const fetchContextData = async (forceFresh = false) => {
        // Force fresh fetch for company/contact-related questions
        if (forceFresh || contextCache.current === null || contextCache.current === undefined) {
            contextCache.current = null;  // Clear cache if forced
        }

        if (contextCache.current) {
            // make sure top_performers fallback runs even if we have a cache
            const cached = contextCache.current as any;
            if ((!cached.top_performers || cached.top_performers.length === 0) && salesPersons) {
                console.log('⚠️ Updating cached context with sample performers');
                cached.top_performers = [...salesPersons]
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((sp) => ({ name: sp.name, total_approved_revenue: sp.totalRevenue }));
                cached.database_status = cached.database_status || {};
                cached.database_status.is_using_sample_data = true;
            }
            return cached;
        }

        try {
            // Updated queries for UAT alignment
            const [
                leadsRes,
                contactsRes,
                quotesRes,
                latestCustomersRes,
                firstCustomerRes,
                allContactDetailsRes,
                globalLogsRes,
            ] = await Promise.all([
                supabase.from("crm_leads").select("*, customer:crm_customers(name)"),  // Include customer relationship like Leads page
                supabase.from("crm_contacts").select("*, customer:crm_customers(name)"),  // Include related company
                supabase.from("quotations").select("*"),
                supabase.from("crm_contacts").select("name").order("created_at", { ascending: false }).limit(3),
                supabase.from("crm_contacts").select("name, created_at").order("created_at", { ascending: true }).limit(1),
                supabase.from("crm_contacts").select("*, customer:crm_customers(name)").limit(100),  // Include company
                supabase.from("lead_logs").select("*").order("created_at", { ascending: false }).limit(10)
            ]);

            console.log("💾 SUPABASE FETCH RESULTS:");
            console.log("  Leads:", leadsRes.data?.length || 0, "records -", leadsRes.error ? `❌ ERROR: ${leadsRes.error.message}` : "✅");
            if (leadsRes.data && leadsRes.data.length > 0) {
                console.log("  Sample lead:", leadsRes.data[0]);
                console.log("  Lead has customer field:", leadsRes.data[0].customer ? "✅ YES" : "❌ NO");
            }
            console.log("  Contacts:", contactsRes.data?.length || 0, "records -", contactsRes.error ? `❌ ERROR: ${contactsRes.error.message}` : "✅");
            if (contactsRes.data && contactsRes.data.length > 0) {
                console.log("  Sample contact:", contactsRes.data[0]);
                console.log("  Company field present:", contactsRes.data[0].customer ? "✅ YES" : "❌ NO");
            }
            console.log("  Quotations:", quotesRes.data?.length || 0, "records -", quotesRes.error ? `❌ ERROR: ${quotesRes.error.message}` : "✅");
            console.log("  Lead Logs:", globalLogsRes.data?.length || 0, "records -", globalLogsRes.error ? `❌ ERROR: ${globalLogsRes.error.message}` : "✅");
            if (leadsRes.error) {
                console.error("  🔴 LEADS ERROR Details:", leadsRes.error);
                console.log("  → Check: Does 'leads' table exist with columns: lead_name, lead_stage, estimated_deal_value, lead_score, expected_close_date, subject");
            }
            if (contactsRes.error) {
                console.error("  🔴 CONTACTS ERROR Details:", contactsRes.error);
                console.log("  → Check: Does 'contacts' table exist with columns: id, name, email, created_at");
            }
            if (quotesRes.error) {
                console.error("  🔴 QUOTATIONS ERROR Details:", quotesRes.error);
                console.log("  → Check: Does 'quotations' table exist with columns: total_amount, status, salesperson");
            }

            const dbHasAny = (leadsRes.data?.length || 0) + (quotesRes.data?.length || 0) + (contactsRes.data?.length || 0) > 0;
            const globalStats: any = {
                summary: {
                    total_leads: leadsRes.data?.length || 0,
                    total_customers: contactsRes.data?.length || 0,
                    total_quotations: quotesRes.data?.length || 0,
                    quotations_getting_approved:
                        quotesRes.data?.filter((q) => q.status === "sent").length || 0,
                    latest_customers: latestCustomersRes.data?.map((c) => c.name) || [],
                    first_customer: firstCustomerRes.data?.[0] || null,
                    all_customer_details: (contactsRes.data?.length || 0) < 50 ? allContactDetailsRes.data : "Too many to list",
                    recent_activity_history: globalLogsRes.data || []
                },
                database_status: {
                    leads_empty: !leadsRes.data || leadsRes.data.length === 0,
                    quotations_empty: !quotesRes.data || quotesRes.data.length === 0,
                    is_using_sample_data: !dbHasAny,
                },
                system_instructions: `
            - Provide summaries, insights, and recommendations based ONLY on the provided CRM data.
            - **Activity History**: Use 'recent_activity_history' to answer questions about what happened recently or the history of actions.
            - **Deal Insights**: Use 'lead_score' (higher is better) and 'estimated_deal_value' to provide recommendations on which deals to prioritize.
            - **Ambiguity**: If a user query is ambiguous, lacks enough context, or could refer to multiple items, politely ask for clarification.
            - **No Hallucination**: Strictly avoid generating or hallucinating data that is not present in the provided context. If data is missing or not provided, state: "I don't have that information in the current CRM record."
            - If the user asks about leads, quotations, or performers and the corresponding database is empty (see database_status), inform them that the data is missing from the database.
            - Use 'first_customer' (name and created_at) to answer who the first customer is and when they joined.
            - Use 'all_customer_details' (name, email, created_at) to identify specific customers, when they joined, and their company affiliation (by looking at the email domain).
            - Always prioritize database records over sample data if they exist.
        `
            };

            if (quotesRes.data) {
                const approved = quotesRes.data.filter((q) => q.status === "sales_order");
                const performerMap: Record<string, number> = {};
                approved.forEach((q) => {
                    if (q.salesperson) {
                        performerMap[q.salesperson] = (performerMap[q.salesperson] || 0) + (q.total_amount || 0);
                    }
                });
                globalStats.top_performers = Object.entries(performerMap)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 5)
                    .map(([name, revenue]) => ({ name, total_approved_revenue: revenue }));
            }
            // fallback to UI sample data if no performers from DB
            if ((!globalStats.top_performers || globalStats.top_performers.length === 0) && salesPersons) {
                console.log('⚠️ No performers from DB; falling back to sample salesPersons');
                globalStats.top_performers = [...salesPersons]
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((sp) => ({ name: sp.name, total_approved_revenue: sp.totalRevenue }));
            }

            let pageDetails: any = {};
            if (pageType === "quotation") {
                pageDetails = { quotes_list: quotesRes.data?.slice(0, 20) || [] };
            } else if (pageType === "customers") {
                pageDetails = { customers_list: contactsRes.data?.slice(0, 20) || [] };
            } else if (pageType === "leads") {
                pageDetails = { leads_list: leadsRes.data?.slice(0, 20) || [] };
            } else if (pageType === "pipeline") {
                pageDetails = { pipeline_data: leadsRes.data?.slice(0, 20) || [] };
            }

            // Include ALL CRM data (not just page-specific) so AI can answer cross-page questions
            // also compute a precalculated total of lead values because the frontend has
            // direct access to the full table; the back-end may only see a subset via
            // context_data, which sometimes gets truncated by Supabase pagination.
            const totalLeadValue = (leadsRes.data || []).reduce((acc, l) => {
                const v = parseFloat(l.estimated_deal_value) || 0;
                return acc + v;
            }, 0);
            const allCrmData = {
                all_leads: leadsRes.data || [],
                all_contacts: contactsRes.data || [],
                all_quotations: quotesRes.data || [],
                total_lead_value: totalLeadValue,
            };

            contextCache.current = { ...globalStats, current_page_details: pageDetails, ...allCrmData };
            return contextCache.current;
        } catch (error) {
            console.error("Context fetch error:", error);
            return {};
        }
    };

    /* ===============================
       HANDLE SEND (AI RESPONSE)
    ================================ */

    const handleSend = async (message: string) => {
        if (!message.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: message,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setShowQuickPrompts(false);
        // record last query
        setLastUserQuery(message);
        try {
            localStorage.setItem("aiAssistantLastQuery", message);
        } catch (e) {
            console.warn("AI assistant: failed to save last query", e);
        }

        try {
            // User requested to only send the query and no context data
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/ask-ai`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    page_type: "global",
                    context_data: {},
                    user_role: "sales_rep",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Backend error");
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            // nothing persisted here – only last query stored when user sends

        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `❌ Error: ${error.message || "AI service unavailable. Please check backend connection."}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    /* ===============================
       UI
    ================================ */

    return (
        <>
            <div className={cn("chatbot-container fixed bottom-6 right-6 z-50 flex flex-col items-end text-gray-900 dark:text-gray-100 transition-all duration-300", { 'closed': !isOpen, 'minimized': isMinimized })}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ 
                                height: isMinimized ? 72 : 600, 
                                opacity: 1 
                            }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-96 border border-gray-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col mb-4"
                            style={{ 
                                background: 'rgba(10, 15, 30, 0.75)', 
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)' 
                            }}
                        >
                            {/* header with logo and title */}
                            <div 
                                className="chatbot-header flex items-center justify-between p-3 text-white cursor-pointer" 
                                style={{ background: 'linear-gradient(90deg, #00cfff 0%, #6e00ff 100%)' }}
                                onClick={() => isMinimized && setIsMinimized(false)}
                            >
                                <div className="flex items-center space-x-2">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                        <img src={BOT_LOGO} alt="AI Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="chatbot-header-title font-semibold text-sm">Grevya AI-Assistant</h3>
                                        {isMinimized && <p className="text-[10px] opacity-80">Click to expand</p>}
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    {/* minimize button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMinimized(!isMinimized);
                                        }}
                                        className="text-white hover:bg-white/20 p-1"
                                    >
                                        <Minus size={14} />
                                    </Button>
                                    {/* close button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsOpen(false);
                                            setIsMinimized(false);
                                        }}
                                        className="text-white hover:bg-white/20 p-1"
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="chatbot-messages flex-1 p-4 scrollbar-thumb-[#7B2FF7] scrollbar-track-[#000000]" ref={scrollRef} >
                                <div className="space-y-3">
                                    {messages.map((msg, index) => {
                                        const isUser = msg.role === "user";
                                        return (
                                            <div key={index} className={cn("message-row w-full flex items-start space-x-1.5", isUser ? "flex-row-reverse space-x-reverse justify-start" : "flex-row justify-start")}>
                                                {/* avatar for assistant / user */}
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm bg-gradient-to-r from-[#00cfff] to-[#6e00ff] text-white">
                                                    {isUser ? (
                                                        <User size={16} />
                                                    ) : (
                                                        <Bot size={18} />
                                                    )}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "message-bubble",
                                                        isUser ? "user-message" : "bot-message",
                                                        isUser ? "" : ""
                                                    )}
                                                >
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                                            li: ({ node, ...props }) => <li className="ml-2 mb-1" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                                            em: ({ node, ...props }) => <em className="italic" {...props} />,
                                                            code: ({ node, ...props }) => <code className="bg-primary/10 px-1 rounded text-xs" {...props} />,
                                                            table: ({ node, ...props }) => <table className="w-full border-collapse text-xs mb-2" {...props} />,
                                                            th: ({ node, ...props }) => <th className="border px-2 py-1 bg-primary/10 font-semibold" {...props} />,
                                                            td: ({ node, ...props }) => <td className="border px-2 py-1" {...props} />,
                                                            a: ({ node, href, ...props }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" {...props} />,
                                                        }}
                                                        skipHtml={true}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isLoading && (
                                        <div className="message-row w-full flex items-start space-x-1.5 flex-row justify-start">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm bg-gradient-to-r from-[#00cfff] to-[#6e00ff] text-white">
                                                <Bot size={18} />
                                            </div>
                                            <div className="message-bubble user-message">
                                                <div className="typing-indicator">
                                                    <div className="typing-dot"></div>
                                                    <div className="typing-dot"></div>
                                                    <div className="typing-dot"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Quick Prompts */}
                            {showQuickPrompts && messages.length === 1 && (
                                <div className="px-4 py-3 border-t border-gray-700" style={{ background: 'rgba(30,35,70,0.3)', backdropFilter: 'blur(10px)' }}>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 dark:text-muted-dark">
                                        <Lightbulb size={13} /> Try asking:
                                    </p>
                                    <div className="space-y-2">
                                        {quickPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(prompt.prompt)}
                                                className="w-full text-left text-xs p-2 rounded bg-[#1E1E1E] text-gray-100 border border-[#7B2FF7] hover:bg-[#2A2A2A] hover:border-[#6A24E3] transition-colors"
                                                disabled={isLoading}
                                            >
                                                {prompt.label}
                                            </button>
                                        ))}
                                        {recentUserQueries.map((q, idx) => (
                                            <button
                                                key={`recent-${idx}`}
                                                onClick={() => handleSend(q)}
                                                className="w-full text-left text-xs p-2 rounded bg-gradient-to-r from-[#6A0DAD] to-[#8A2BE2] text-white hover:opacity-90 transition-colors"
                                                disabled={isLoading}
                                            >
                                                {idx === recentUserQueries.length - 1 ? `Last: ${q}` : q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-t" style={{ background: 'rgba(30,35,70,0.3)', backdropFilter: 'blur(10px)' }}>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        className="chat-input w-full border rounded-lg py-2 px-3 text-sm text-gray-100 border-gray-600"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(input);
                                            }
                                        }}
                                        placeholder="Ask me anything..."
                                        disabled={isLoading}
                                    />
                                    <Button
                                        size="icon"
                                        className="chat-button send-button absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => handleSend(input)}
                                        disabled={isLoading || !input.trim()}
                                    >
                                        <Send size={18} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* floating toggle button - now outside restricted container */}
            {!isOpen && (
                <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={{ left: -window.innerWidth, right: window.innerWidth, top: -window.innerHeight, bottom: window.innerHeight }}
                    style={{ x: toggleX, y: toggleY, touchAction: 'none' }}
                    onDragEnd={() => {
                        try {
                            localStorage.setItem("aiAssistantTogglePos", JSON.stringify({
                                x: toggleX.get(),
                                y: toggleY.get()
                            }));
                        } catch (e) {
                            console.warn("AI assistant: failed to save toggle position", e);
                        }
                    }}
                    className="fixed bottom-24 right-6 z-55 cursor-grab active:cursor-grabbing"
                    whileDrag={{ scale: 1.1 }}
                >
                    <Button
                        onClick={() => setIsOpen(!isOpen)}
                        size="icon"
                        className="chat-toggle w-16 h-16 rounded-full shadow-lg bg-gradient-to-r from-[#00cfff] to-[#6e00ff]"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                            <img src={BOT_LOGO} alt="AI" className="w-full h-full object-contain" />
                        </div>
                    </Button>
                </motion.div>
            )}
        </>
    );
}
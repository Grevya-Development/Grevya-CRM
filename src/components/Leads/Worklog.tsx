import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/supabase/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Circle, Loader2, History } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

interface WorklogProps {
    leadId?: string;
    refreshTrigger?: number;
}

interface LogEntry {
    id: string;
    performed_by: string;
    action: string;
    details: string;
    created_at: string;
}

export const Worklog: React.FC<WorklogProps> = ({ leadId, refreshTrigger }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!leadId) {
            setLogs([{
                id: 'draft-1',
                performed_by: 'System',
                action: 'Draft Initialized',
                details: 'New lead form opened',
                created_at: new Date().toISOString()
            }]);
            return;
        }

        fetchLogs();

        const subscription = supabase
            .channel(`public:lead_logs:lead_id=eq.${leadId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lead_logs',
                    filter: `lead_id=eq.${leadId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLogs((prev) => [payload.new as LogEntry, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setLogs((prev) =>
                            prev.map((log) => (log.id === payload.new.id ? (payload.new as LogEntry) : log))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setLogs((prev) => prev.filter((log) => log.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [leadId, refreshTrigger]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lead_logs')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    dayjs.extend(relativeTime);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-xs">
                 No history available for this lead.
            </div>
        );
    }

    return (
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-8 mt-2">
            {logs.map((log) => {
                const isStageChange = log.action === 'STAGE_CHANGE';
                const displayAction = isStageChange ? 'Stage changed' : log.action;

                return (
                    <div key={log.id} className="relative pl-6">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[7px] top-0 shadow-sm bg-white rounded-full p-[2px] ${isStageChange ? 'border-2 border-blue-100' : ''}`}>
                            <Circle size={10} className={isStageChange ? "fill-blue-500 text-blue-500" : "fill-blue-500 text-blue-500"} />
                        </div>

                        {/* Content Card */}
                        <div className="bg-transparent">
                            <div className="flex justify-between items-start mb-0.5">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-semibold text-slate-800">
                                        {log.performed_by}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                        {dayjs(log.created_at).fromNow()}
                                    </span>
                                </div>
                            </div>

                            <div className="text-[10px] text-slate-700 mt-0.5">
                                {displayAction}
                            </div>

                            {log.details && (
                                <div className="mt-1">
                                    {isStageChange ? (
                                        <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-100 w-fit">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            {(() => {
                                                const rawText = log.details.replace('Stage changed • ', '');
                                                const parts = rawText.split('→');
                                                if (parts.length === 2) {
                                                    const oldS = parts[0].trim();
                                                    const newS = parts[1].trim();

                                                    const formatStage = (s: string) => {
                                                        if (s.includes('-') || s === s.toLowerCase()) {
                                                            return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                                        }
                                                        return s;
                                                    };
                                                    return <span className="text-[10px]">{formatStage(oldS)} <span className="text-slate-400 mx-1">→</span> {formatStage(newS)}</span>;
                                                }
                                                return rawText;
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                            {log.details}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

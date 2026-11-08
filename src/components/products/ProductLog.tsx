import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Paperclip, Smile, Send, X, Search, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase/supabaseClient';
import { ProductLog as ProductLogType } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { message } from 'antd';

dayjs.extend(relativeTime);

interface ProductLogProps {
    productId?: number;
    productName?: string;
    onClose?: () => void;
    className?: string;
}

export const ProductLog: React.FC<ProductLogProps> = ({ productId, productName, onClose, className }) => {
    const [activeTab, setActiveTab] = useState<'message' | 'note' | 'activities'>('message');
    const [logs, setLogs] = useState<ProductLogType[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchLogs();
        }
    }, [productId]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('product_logs')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            message.error('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || !productId) return;

        try {
            setSending(true);
            const { data: userData } = await supabase.auth.getUser();
            const user = userData.user;

            const newLog = {
                product_id: productId,
                user_id: user?.id || null,
                user_name: user?.email?.split('@')[0] || 'Mitchell Admin',
                action: activeTab === 'note' ? 'note' : 'note',
                content: inputValue.trim(),
            };

            const { error } = await supabase
                .from('product_logs')
                .insert([newLog]);

            if (error) throw error;

            setInputValue('');
            fetchLogs();
            message.success(activeTab === 'note' ? 'Note logged' : 'Message sent');
        } catch (error: any) {
            console.error('Error sending log:', error);
            message.error('Failed to send');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={cn("w-[400px] border-l bg-slate-50 flex flex-col h-full shadow-sm", className)}>
            {/* Header Actions */}
            <div className="p-4 border-b bg-white flex flex-col gap-4 sticky top-0 z-10">
                <div className="flex justify-between items-center text-muted-foreground">
                    <div className='flex gap-1'>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "text-xs font-semibold h-8",
                                activeTab === 'message' ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "text-slate-600"
                            )}
                            onClick={() => setActiveTab('message')}
                        >
                            Send message
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "text-xs font-semibold h-8",
                                activeTab === 'note' ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "text-slate-600"
                            )}
                            onClick={() => setActiveTab('note')}
                        >
                            Log note
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "text-xs font-semibold h-8",
                                activeTab === 'activities' ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "text-slate-600"
                            )}
                            onClick={() => setActiveTab('activities')}
                        >
                            Activities
                        </Button>
                    </div>
                    <div className='flex items-center gap-1'>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Search className="h-4 w-4" /></Button>
                        {onClose && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={onClose}><X className="h-4 w-4" /></Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm italic">
                        No activity recorded yet
                    </div>
                ) : (
                    <div className="relative">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-[1px] flex-1 bg-slate-200"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2">History</span>
                            <div className="h-[1px] flex-1 bg-slate-200"></div>
                        </div>

                        <div className="space-y-8 relative">
                            <div className="absolute left-[15px] top-2 bottom-0 w-[2px] bg-slate-100 -z-10"></div>

                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-3">
                                    {log.action === 'note' || log.action === 'created' ? (
                                        <>
                                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                                                    {(log.user_name || 'System').substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-slate-900">{log.user_name || 'System'}</p>
                                                    <span className="text-[10px] font-medium text-slate-400">{dayjs(log.created_at).fromNow()}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
                                                    {log.content}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                <Info className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-slate-900">System</p>
                                                    <span className="text-[10px] font-medium text-slate-400">{dayjs(log.created_at).fromNow()}</span>
                                                </div>
                                                <div className="text-sm text-slate-500 italic">
                                                    {log.content}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <textarea
                            className="w-full min-h-[80px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400"
                            placeholder={activeTab === 'message' ? "Send a message..." : activeTab === 'note' ? "Log a note..." : "Plan an activity..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={sending}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Paperclip className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Smile className="h-4 w-4" /></Button>
                            <Button
                                size="icon"
                                className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                                onClick={handleSend}
                                disabled={sending || !inputValue.trim()}
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

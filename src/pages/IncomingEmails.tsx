import { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/supabase/supabaseClient';
import { Mail, Search, RefreshCw, User, Inbox, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';



interface Email {
    id: string;
    message_id: string;
    from_email: string;
    from_name?: string;
    to_email: string;
    subject: string;
    body_text: string;
    body_html?: string;
    received_at: string;
    is_read: boolean;
    has_attachments?: boolean;
    in_reply_to?: string;
    references?: string;
    thread_id?: string;
}

const MAILER_API_URL = import.meta.env.VITE_MAILER_API_URL || 'http://localhost:3001/api';

export default function IncomingEmails() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);


    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('incoming_emails')
                .select('*')
                .order('received_at', { ascending: false });

            if (error) throw error;
            setEmails(data || []);
            if (data && data.length > 0 && !selectedEmail) {
                setSelectedEmail(data[0]);
            }
        } catch (error: any) {
            toast.error('Failed to fetch emails');
        } finally {
            setLoading(false);
        }
    };

    const syncEmails = async () => {
        setSyncing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.post(`${MAILER_API_URL}/sync-emails`, {}, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (response.data.success) {
                toast.success(`Synced ${response.data.count} emails`);
                fetchEmails();
            } else {
                toast.error(response.data.error || 'Sync failed');
            }
        } catch (error: any) {
            toast.error('Connection to sync service failed');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);



    const markAsRead = async (email: Email) => {
        if (email.is_read) return;

        try {
            const { error } = await supabase
                .from('incoming_emails')
                .update({ is_read: true })
                .eq('id', email.id);

            if (error) throw error;

            // Update local state
            setEmails(prev => prev.map(e =>
                e.id === email.id ? { ...e, is_read: true } : e
            ));

            if (selectedEmail?.id === email.id) {
                setSelectedEmail({ ...selectedEmail, is_read: true });
            }
        } catch (error) {
            console.error('Error marking email as read:', error);
        }
    };

    const handleEmailSelect = (email: Email) => {
        setSelectedEmail(email);
        markAsRead(email);
    };

    const filteredEmails = emails.filter(email =>
        email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );



    return (
        <div className="flex flex-col h-screen bg-background text-[#0f172a]">
            <Header title="Incoming Emails" showAddButton={false} />

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Email List Section */}
                <div className="w-1/3 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search inbox..."
                                className="pl-9 h-11 border-slate-200 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-lg border-slate-200"
                            onClick={syncEmails}
                            disabled={syncing}
                            title="Sync Now"
                        >
                            <RefreshCw className={cn("h-4 w-4 text-[#2563eb]", syncing && "animate-spin")} />
                        </Button>
                    </div>

                    <Card className="flex-1 overflow-hidden border border-slate-100 shadow-sm bg-white rounded-xl">
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <div className="divide-y divide-slate-50">
                                {loading && emails.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        Loading inbox...
                                    </div>
                                ) : filteredEmails.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                                        <Inbox className="h-12 w-12 opacity-10" />
                                        <p className="font-medium">No incoming emails found</p>
                                    </div>
                                ) : (
                                    filteredEmails.map((email) => (
                                        <div
                                            key={email.id}
                                            onClick={() => handleEmailSelect(email)}
                                            className={cn(
                                                "p-5 cursor-pointer transition-all hover:bg-slate-50 border-l-4",
                                                selectedEmail?.id === email.id
                                                    ? "bg-blue-50/50 border-[#2563eb]"
                                                    : !email.is_read
                                                        ? "bg-blue-50/20 border-blue-200"
                                                        : "border-transparent"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className={cn(
                                                    "text-[13px] truncate max-w-[150px]",
                                                    !email.is_read ? "font-bold text-[#0f172a]" : "font-semibold text-slate-700"
                                                )}>
                                                    {email.from_name || email.from_email}
                                                </span>
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    {dayjs(email.received_at).format('MMM DD')}
                                                </span>
                                            </div>
                                            <h4 className={cn(
                                                "text-[13px] line-clamp-1 mb-1",
                                                selectedEmail?.id === email.id ? "text-[#2563eb] font-bold" : !email.is_read ? "font-bold text-[#1e293b]" : "font-medium text-[#1e293b]"
                                            )}>
                                                {email.subject}
                                            </h4>
                                            <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                                                {email.body_text?.substring(0, 100) || email.body_html?.replace(/<[^>]*>/g, '').substring(0, 100)}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Email Preview Section */}
                <div className="flex-1 flex flex-col">
                    {selectedEmail ? (
                        <Card className="flex-1 flex flex-col shadow-sm border border-slate-100 overflow-hidden bg-white rounded-xl text-[#0f172a]">
                            <CardHeader className="border-b border-slate-50 px-8 py-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-bold tracking-tight text-[#0f172a]">{selectedEmail.subject}</CardTitle>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-2 font-semibold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                                                <User className="h-4 w-4" />
                                                {selectedEmail.from_name ? `${selectedEmail.from_name} <${selectedEmail.from_email}>` : selectedEmail.from_email}
                                            </div>
                                            <span className="text-slate-300 font-light">&bull;</span>
                                            <span className="text-slate-500 font-medium">{selectedEmail.from_email}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 font-medium px-4 py-1">
                                        {dayjs(selectedEmail.received_at).format('MMMM DD, YYYY | hh:mm A')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <ScrollArea className="flex-1">
                                <CardContent className="p-8">
                                    <div className="prose prose-slate max-w-none">
                                        {selectedEmail.body_html ? (
                                            <div
                                                className="text-[14px] leading-relaxed text-[#334155]"
                                                dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                                            />
                                        ) : (
                                            <div className="text-[14px] leading-relaxed text-[#334155] whitespace-pre-wrap font-sans">
                                                {selectedEmail.body_text}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </ScrollArea>
                        </Card>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
                            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                <Mail className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="text-lg font-medium">Select an email to read</p>
                            <p className="text-sm opacity-60">Your workspace is ready.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

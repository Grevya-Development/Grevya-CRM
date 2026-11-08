import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MapPin,
    Video,
    Copy,
    Plus,
    HelpCircle,
    Calendar as CalendarIcon,
    Loader2,
    CheckCircle2,
    XCircle,
    X,
    Clock,
    ChevronDown,
    CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';
import log from '@/utils/logger'
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/floating-label-input';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { localInputToISO, toLocalInput } from "@/lib/dateTime";

declare global {
    interface Window {
        google: any;
    }
}

interface CreateMeetingFormProps {
    entityId: string;
    entityType: "customer" | "lead";
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateMeetingForm({ entityId, entityType, onSuccess, onCancel }: CreateMeetingFormProps) {
    const [customerName, setCustomerName] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(() => !!localStorage.getItem('google_access_token'));
    const [useGoogleMeet, setUseGoogleMeet] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);

    const [formData, setFormData] = useState({
        subject: '',
        start: toLocalInput(new Date()),
        end: toLocalInput(new Date(Date.now() + 3600000)),
        duration: '01:00',
        allDay: false,
        location: 'Online Meeting',
        videoUrl: '',
        description: '',
        privacy: 'Public',
    });

    useEffect(() => {
        if (window.google) {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: "260904898827-e11s8o86446rn5omvs8rhlu5v126t95n.apps.googleusercontent.com",
                scope: "https://www.googleapis.com/auth/calendar",
                callback: (tokenResponse: any) => {
                    if (tokenResponse.access_token) {
                        localStorage.setItem('google_access_token', tokenResponse.access_token);
                        setIsConnected(true);
                        setIsConnecting(false);
                        toast.success("Connected to Google Calendar");
                    }
                },
            });
            setTokenClient(client);
        }
    }, []);

    useEffect(() => {
        if (!entityId) return;
        // Show the related record's name: a customer, or the lead's name for lead meetings.
        const fetchName = async () => {
            if (entityType === 'lead') {
                const { data } = await supabase.from('crm_leads').select('lead_name, subject').eq('id', entityId).maybeSingle();
                if (data) setCustomerName(data.lead_name || data.subject || null);
            } else {
                const { data } = await supabase.from('crm_customers').select('name').eq('id', entityId).maybeSingle();
                if (data) setCustomerName(data.name);
            }
        };
        fetchName();
    }, [entityId, entityType]);

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const duration = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(duration / 1000 / 60 / 60);
        const minutes = Math.floor((duration / 1000 / 60) % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const connectGoogle = () => {
        if (tokenClient) {
            setIsConnecting(true);
            tokenClient.requestAccessToken();
        } else {
            toast.error("Google Identity Services not yet loaded.");
        }
    };

    const createGoogleEvent = async () => {
        const token = localStorage.getItem("google_access_token");
        if (!token) return null;

        const eventBody = {
            summary: formData.subject,
            description: formData.description,
            location: formData.location,
            start: { dateTime: new Date(formData.start).toISOString(), timeZone: 'UTC' },
            end: { dateTime: new Date(formData.end).toISOString(), timeZone: 'UTC' },
            conferenceData: useGoogleMeet ? {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            } : undefined,
        };

        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(eventBody),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("google_access_token");
                setIsConnected(false);
                toast.error("Session expired. Please reconnect.");
            }
            return null;
        }

        return await response.json();
    };

    const handleSave = async () => {
        try {
            if (!formData.subject) return toast.error("Please enter a title");

            let videoUrl = formData.videoUrl;
            if (isConnected) {
                const event = await createGoogleEvent();
                if (event?.hangoutLink) videoUrl = event.hangoutLink;
            }

            const { error } = await supabase.from("crm_meetings").insert([{
                entity_id: entityId,
                entity_type: entityType,
                subject: formData.subject,
                description: formData.description,
                start_time: localInputToISO(formData.start),
                end_time: localInputToISO(formData.end),
                location: formData.location,
                video_url: videoUrl,
                duration: calculateDuration(formData.start, formData.end),
            }]);

            if (error) throw error;
            toast.success("Meeting saved successfully");
            onSuccess();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="flex flex-col font-['Instrument_Sans'] bg-white w-full rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-slate-800">Add meeting</h2>
                <button
                    onClick={onCancel}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto scrollbar-hide max-h-[80vh]">
                <div className="flex flex-col gap-4">
                    <FloatingLabelInput
                        label="Title"
                        placeholder="Enter a title of meeting"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        autoFocus
                    />

                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-slate-500 ml-0.5">Invite Attendees</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Click to select attendees"
                                className="w-full h-9 px-3 pr-9 rounded-md border border-slate-200 bg-white text-[13px] focus:outline-none transition-all placeholder:text-slate-300 cursor-pointer"
                                readOnly
                            />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-slate-500 ml-0.5">From</label>
                            <div className="flex gap-2">
                                <DatePicker
                                    label="Date"
                                    date={formData.start ? new Date(formData.start.split('T')[0]) : undefined}
                                    setDate={(date) => setFormData({ ...formData, start: `${date ? format(date, "yyyy-MM-dd") : ""}T${formData.start.split('T')[1] || '09:00'}` })}
                                    className="flex-1"
                                />
                                <FloatingLabelInput
                                    type="time"
                                    label="Time"
                                    value={formData.start?.split('T')[1]?.slice(0, 5) || ''}
                                    onChange={(e) => setFormData({ ...formData, start: `${formData.start.split('T')[0]}T${e.target.value}` })}
                                    className="w-[120px]"
                                    suffix={<Clock className="h-4 w-4" />}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-slate-500 ml-0.5">To</label>
                            <div className="flex gap-2">
                                <DatePicker
                                    label="Date"
                                    date={formData.end ? new Date(formData.end.split('T')[0]) : undefined}
                                    setDate={(date) => setFormData({ ...formData, end: `${date ? format(date, "yyyy-MM-dd") : ""}T${formData.end.split('T')[1] || '10:00'}` })}
                                    className="flex-1"
                                />
                                <FloatingLabelInput
                                    type="time"
                                    label="Time"
                                    value={formData.end?.split('T')[1]?.slice(0, 5) || ''}
                                    onChange={(e) => setFormData({ ...formData, end: `${formData.end.split('T')[0]}T${e.target.value}` })}
                                    className="w-[120px]"
                                    suffix={<Clock className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                        <span className="text-[12px] font-medium text-slate-500">All Day</span>
                        <Switch
                            checked={formData.allDay}
                            onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
                            className="scale-75 data-[state=checked]:bg-[#0B64F4]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-slate-500 ml-0.5">Time Zone</label>
                        <div className="relative">
                            <select className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-[13px] outline-none appearance-none transition-all text-slate-600 cursor-pointer">
                                <option>(GMT+00:00) UTC</option>
                                <option>Eastern Time (ET)</option>
                                <option>Pacific Time (PT)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-slate-500 ml-0.5">Add video conferencing</label>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className={`flex-1 h-9 rounded-md border-slate-200 font-medium text-slate-700 hover:bg-slate-50 gap-2 text-[12px] ${useGoogleMeet ? 'bg-[#0B64F4]/5 border-[#0B64F4] text-[#0B64F4]' : ''}`}
                                onClick={() => setUseGoogleMeet(!useGoogleMeet)}
                            >
                                <div className={`w-4 h-4 flex items-center justify-center rounded-sm ${useGoogleMeet ? 'bg-[#0B64F4]' : 'bg-blue-600'}`}>
                                    <Video className="h-2.5 w-2.5 text-white" />
                                </div>
                                {useGoogleMeet ? 'Google Meet Added' : 'Connect Zoom'}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-9 rounded-md border-slate-200 font-medium text-slate-700 hover:bg-slate-50 gap-2 text-[12px]"
                            >
                                <div className="w-4 h-4 flex items-center justify-center bg-indigo-600 rounded-sm">
                                    <Video className="h-2.5 w-2.5 text-white" />
                                </div>
                                Connect Teams
                            </Button>
                        </div>
                    </div>

                    <FloatingLabelInput
                        label="Location"
                        placeholder="Enter room or location of meeting"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        suffix={<MapPin className="h-3.5 w-3.5" />}
                    />

                    <FloatingLabelTextarea
                        label="Description"
                        placeholder="Enter Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[80px]"
                    />

                    <div className="flex gap-3 pt-1">
                        <Button
                            variant="outline"
                            onClick={connectGoogle}
                            disabled={isConnecting}
                            className={`h-8 px-3 rounded-md bg-white border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50 gap-2 ${isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : ''}`}
                        >
                            {isConnecting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0B64F4]" />
                            ) : isConnected ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="h-3.5 w-3.5" />
                            )}
                            {isConnected ? 'Connected Google' : 'Connect Google Calender'}
                        </Button>

                        <Button
                            variant="outline"
                            className="h-8 px-3 rounded-md bg-white border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50 gap-2"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_logo_%282012%E2%80%932019%29.svg" alt="Office 365" className="h-3.5 w-3.5" />
                            Connect Office 365
                        </Button>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-end gap-3 mt-auto">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="h-9 px-6 rounded-md border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-all"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    className="h-9 px-6 rounded-md bg-[#0B64F4] hover:bg-blue-700 text-white text-[13px] font-semibold shadow-sm transition-all"
                >
                    Create Meeting
                </Button>
            </div>
        </div>
    );
}

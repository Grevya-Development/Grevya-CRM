import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { Header } from "@/components/layout/Header";
import { Button } from '@/components/ui/button';
import { Users, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { CreateMeetingForm } from "@/components/meetings/CreateMeetingForm";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./MeetingCalendar.css";
import { supabase } from "@/supabase/supabaseClient";
import { toast } from "sonner";


export default function MeetingSchedule() {
    const navigate = useNavigate();
    const [showTooltip, setShowTooltip] = useState(false);
    const [date, setDate] = useState<Date>(new Date());
    const { id } = useParams();
    const [events, setEvents] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchMeetings = async () => {
        const { data, error } = await supabase
            .from("crm_meetings")
            .select("*");

        if (error) {
            console.error(error);
            return;
        }

        const formattedEvents = data.map((meeting: any) => ({
            id: meeting.id,
            title: meeting.subject,
            start: meeting.start_time,
            end: meeting.end_time,
        }));
        setEvents(formattedEvents);
    };

    useEffect(() => {
        setShowTooltip(true);
        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleEventChange = async (info: any) => {
        const { id, start, end } = info.event;
        const { error } = await supabase
            .from("crm_meetings")
            .update({ start_time: start, end_time: end })
            .eq("id", id);

        if (error) {
            info.revert();
            return;
        }
        setEvents((prev) =>
            prev.map((event) =>
                event.id === id ? { ...event, start, end } : event
            )
        );
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                if (session.provider_token) {
                    localStorage.setItem('google_access_token', session.provider_token);
                }

                const shouldReopen = sessionStorage.getItem('reopen_meeting_form');
                if (shouldReopen === 'true') {
                    setIsCreateModalOpen(true);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header
                title="Meeting Schedule"
                breadcrumbAction={
                    <>
                        <Button
                            title="Create Meeting"
                            className="h-8 flex bg-[#0B64F4] hover:bg-[#0B64F4]/90
                            border-none shadow-none items-center gap-1.5 px-3
                            text-white transition-colors rounded-md font-['Instrument_Sans'] text-xs font-medium"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Create Meeting
                        </Button>

                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogContent className="max-w-[720px] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
                                <CreateMeetingForm
                                    entityId={id || ""}
                                    entityType="customer"
                                    onSuccess={() => {
                                        setIsCreateModalOpen(false);
                                        fetchMeetings();
                                    }}
                                    onCancel={() => setIsCreateModalOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </>
                }
            />



            <div className="flex-1 p-6 flex items-start gap-6">
                <div className="w-80 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex-shrink-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <CalendarIcon className="h-4 w-4 text-[#0B64F4]" />
                        <h3 className="text-[15px] font-semibold text-slate-800 font-['Instrument_Sans']">
                            Quick Calendar
                        </h3>
                    </div>

                    <div className="calendar-container">
                        <Calendar
                            onChange={(value) => setDate(value as Date)}
                            value={date}
                            className="border-none shadow-none"
                        />
                    </div>

                    <div className="mt-8 space-y-4 overflow-y-auto">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Upcoming Today</h4>
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3 hover:bg-blue-50 transition-colors cursor-pointer group">
                            <div className="h-2 w-2 rounded-full bg-[#0B64F4] mt-1.5 ring-4 ring-[#0B64F4]/10" />
                            <div className="flex-1">
                                <div className="text-[14px] font-semibold text-slate-800 leading-tight group-hover:text-[#0B64F4] transition-colors font-['Instrument_Sans']">Sales Review</div>
                                <div className="text-[12px] text-slate-500 mt-1 font-medium italic">10:00 AM - 11:30 AM</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        editable={true}
                        selectable={true}
                        eventResizableFromStart={true}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        height="auto"
                        events={events}
                        eventChange={handleEventChange}
                        eventDrop={handleEventChange}
                        eventResize={handleEventChange}
                    />
                </div>
            </div>
        </div>
    );
}
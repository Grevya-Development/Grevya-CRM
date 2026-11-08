import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MoreVertical } from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import { CreateMeetingForm } from "@/components/meetings/CreateMeetingForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type FilterType = "all" | "upcoming" | "completed";

export function MeetingsTab({ entityId, entityType, onCountChange }: { entityId: string, entityType: "customer" | "lead", onCountChange: (count: number) => void }) {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [filter, setFilter] = useState<FilterType>("all");
    const [isOpen, setIsOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [newStartTime, setNewStartTime] = useState("");
    const [newEndTime, setNewEndTime] = useState("");
    const [outcomeOpen, setOutcomeOpen] = useState(false);
    const [selectedOutcome, setSelectedOutcome] = useState("");
    const [meetingNotes, setMeetingNotes] = useState("");

    const fetchMeetings = async () => {
        const { data } = await supabase
            .from("crm_meetings")
            .select("*")
            .eq("entity_id", entityId)
            .eq("entity_type", entityType)
            .order("start_time", { ascending: false });

        if (data) {
            setMeetings(data);
            onCountChange?.(data.length); //update badge immediately
        }
    };

    useEffect(() => {
        if (entityId) fetchMeetings();
    }, [entityId]);

    const now = new Date();

    const filteredMeetings = meetings.filter((m) => {
        if (filter === "upcoming") return new Date(m.start_time) >= now;
        if (filter === "completed") return new Date(m.end_time) < now;
        return true;
    });

    const formatDateTime = (date: string) => {
        const d = new Date(date);

        const formattedDate = d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });

        const formattedTime = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        return { formattedDate, formattedTime };
    };

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const duration = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(duration / 1000 / 60 / 60);
        const minutes = Math.floor((duration / 1000 / 60) % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleDelete = async () => {
        if (!selectedMeeting) return;

        const { error } = await supabase
            .from("crm_meetings")
            .delete()
            .eq("id", selectedMeeting.id);

        if (!error) {
            setDeleteOpen(false);
            setSelectedMeeting(null);
            fetchMeetings();
        }
    };

    const handleOutcome = (meeting: any) => {
        setSelectedMeeting(meeting);
        setSelectedOutcome(meeting.outcome || "");
        setMeetingNotes(meeting.description || "");
        setOutcomeOpen(true);
    };

    const saveOutcome = async () => {
        if (!selectedMeeting) return;

        try {
            const { error } = await supabase
                .from('crm_meetings')
                .update({
                    outcome: selectedOutcome,
                    meeting_notes: meetingNotes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedMeeting.id);

            if (error) throw error;

            toast.success("Outcome saved successfully");
            setOutcomeOpen(false);
            fetchMeetings();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save outcome");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        onClick={() => setFilter("all")}
                        className="h-8 text-xs"
                    >
                        All Meetings ({meetings.length})
                    </Button>

                    <Button
                        variant={filter === "upcoming" ? "default" : "outline"}
                        onClick={() => setFilter("upcoming")}
                        className="h-8 text-xs"
                    >
                        Upcoming ({meetings.filter(m => new Date(m.start_time) >= now).length})
                    </Button>

                    <Button
                        variant={filter === "completed" ? "default" : "outline"}
                        onClick={() => setFilter("completed")}
                        className="h-8 text-xs"
                    >
                        Completed ({meetings.filter(m => new Date(m.end_time) < now).length})
                    </Button>
                </div>

                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-8 bg-[#0B64F4] hover:bg-blue-700 text-white text-xs"
                >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Add Meeting
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr className="text-left">
                            <th className="px-4 py-3">Meeting Title</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3">Completed Date</th>
                            <th className="px-4 py-3">Owner</th>
                            <th className="px-4 py-3">Outcome</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMeetings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                                    No meetings found.
                                </td>
                            </tr>
                        ) : (
                            filteredMeetings.map((meeting) => (
                                <tr
                                    key={meeting.id}
                                    className="border-t hover:bg-slate-50 transition"
                                >
                                    <td className="px-4 py-3">{meeting.subject}</td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const { formattedDate, formattedTime } = formatDateTime(meeting.start_time);
                                            return (
                                                <div className="flex flex-col">
                                                    <span>{formattedDate}</span>
                                                    <span className="text-xs text-slate-500">{formattedTime}</span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const { formattedDate, formattedTime } = formatDateTime(meeting.end_time);
                                            return (
                                                <div className="flex flex-col">
                                                    <span>{formattedDate}</span>
                                                    <span className="text-xs text-slate-500">{formattedTime}</span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3">--</td>
                                    <td className="px-4 py-3">{meeting.outcome}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex h-8 rounded-md overflow-hidden border border-slate-200">
                                            <button
                                                onClick={() => {
                                                    handleOutcome(meeting);
                                                    setOutcomeOpen(true);
                                                }}
                                                className="px-3 text-sm text-slate-600 hover:bg-slate-50 transition"
                                            >
                                                Add Outcome
                                            </button>
                                            <div className="w-px bg-slate-200" />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="px-2 flex items-center justify-center hover:bg-slate-50 transition">
                                                        <MoreVertical className="h-4 w-4 text-slate-500" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedMeeting(meeting);
                                                            setNewStartTime(meeting.start_time?.slice(0, 16));
                                                            setNewEndTime(meeting.end_time?.slice(0, 16));
                                                            setRescheduleOpen(true);
                                                        }}
                                                    >
                                                        Reschedule
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            setSelectedMeeting(meeting);
                                                            setDeleteOpen(true);
                                                        }}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="max-w-[720px] w-full p-0 [&>button]:hidden"
                >
                    <CreateMeetingForm
                        entityId={entityId}
                        entityType={entityType}
                        onSuccess={() => {
                            setIsOpen(false);
                            fetchMeetings();
                        }}
                        onCancel={() => setIsOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Delete Meeting?
                        </h2>

                        <p className="text-sm text-slate-500">
                            Are you sure you want to delete this meeting?
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                <DialogContent className="max-w-md">
                    <div className="space-y-5">
                        <h2 className="text-lg font-semibold">
                            Reschedule Meeting
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newStartTime}
                                    onChange={(e) => setNewStartTime(e.target.value)}
                                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newEndTime}
                                    onChange={(e) => setNewEndTime(e.target.value)}
                                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                            <Button
                                variant="outline"
                                onClick={() => setRescheduleOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={async () => {
                                    if (!selectedMeeting) return;

                                    const { error } = await supabase
                                        .from("crm_meetings")
                                        .update({
                                            start_time: newStartTime,
                                            end_time: newEndTime,
                                            duration: calculateDuration(newStartTime, newEndTime),
                                        })
                                        .eq("id", selectedMeeting.id);

                                    if (!error) {
                                        setRescheduleOpen(false);
                                        setSelectedMeeting(null);
                                        fetchMeetings();
                                    }
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={outcomeOpen} onOpenChange={setOutcomeOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-lg font-bold text-slate-800">Add Outcome</DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-semibold text-slate-500 ml-0.5">
                                Select Outcome
                            </label>
                            <Select
                                value={selectedOutcome}
                                onValueChange={(value) => setSelectedOutcome(value)}
                            >
                                <SelectTrigger className="w-full h-10 border-slate-200 focus:ring-[#0B64F4] transition-all">
                                    <SelectValue placeholder="Select outcome" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Intrested">Intrested</SelectItem>
                                    <SelectItem value="Left Message">Left Message</SelectItem>
                                    <SelectItem value="Not Intrested">Not Intrested</SelectItem>
                                    <SelectItem value="No Response">No Response</SelectItem>
                                    <SelectItem value="Not able to reach">Not able to reach</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-semibold text-slate-500 ml-0.5">
                                Meeting Notes
                            </label>
                            <textarea
                                value={meetingNotes}
                                onChange={(e) => setMeetingNotes(e.target.value)}
                                placeholder="Start typing or @ mention people to notify them"
                                className="w-full min-h-[120px] p-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0B64F4] transition-all resize-none placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOutcomeOpen(false)}
                            className="h-9 px-5 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-800 transition-all font-medium text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-9 px-6 bg-[#0B64F4] hover:bg-blue-700 text-white shadow-sm transition-all font-semibold text-xs"
                            onClick={saveOutcome}
                        >
                            Save Outcome
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
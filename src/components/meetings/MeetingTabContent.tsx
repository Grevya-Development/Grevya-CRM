import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    MoreVertical,
    Calendar,
    Clock,
    Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AddMeetingModal } from './AddMeetingModal';
import { RescheduleMeetingModal } from './RescheduleMeetingModal';
import { CancelMeetingModal } from './CancelMeetingModal';
import { AddOutcomeModal } from './AddOutcomeModal';

interface Meeting {
    id: string;
    title: string;
    dueDate: string;
    completedDate: string | null;
    owner: string;
    outcome: string | null;
    status: 'upcoming' | 'completed';
}

const MOCK_MEETINGS: Meeting[] = [
    {
        id: "1",
        title: "IT Service & Setup Discussion",
        dueDate: "Feb 18, 2026 | 06:00 - 06:45",
        completedDate: null,
        owner: "Siva Kumar",
        outcome: null,
        status: 'upcoming'
    }
];

interface MeetingTabContentProps {
    leadId?: string;
    leadName?: string;
}

export const MeetingTabContent = ({ leadId, leadName }: MeetingTabContentProps) => {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

    const handleReschedule = (id: string) => {
        setSelectedMeetingId(id);
        setIsRescheduleModalOpen(true);
    };

    const handleCancel = (id: string) => {
        setSelectedMeetingId(id);
        setIsCancelModalOpen(true);
    };

    const handleOutcome = (id: string) => {
        setSelectedMeetingId(id);
        setIsOutcomeModalOpen(true);
    };

    const filteredMeetings = MOCK_MEETINGS.filter(m => {
        if (filter === 'all') return true;
        return m.status === filter;
    });

    const upcomingCount = MOCK_MEETINGS.filter(m => m.status === 'upcoming').length;
    const completedCount = MOCK_MEETINGS.filter(m => m.status === 'completed').length;

    return (
        <div className="space-y-4">
            {/* Header / Filters Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-2.5 rounded-[6px] border transition-all flex items-center gap-2 h-[48px]",
                            filter === 'all'
                                ? "bg-[#EEF4FF] border-[#2563EB] text-[#2563EB]"
                                : "bg-white border-[#E2E8F0] text-[#0F172A]"
                        )}
                    >
                        <span className={cn(
                            "text-[16px] font-bold",
                            filter === 'all' ? "text-[#2563EB]" : "text-[#0F172A]"
                        )}>
                            {MOCK_MEETINGS.length}
                        </span>
                        <span className="text-[13px] font-medium whitespace-nowrap">All Meetings</span>
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={cn(
                            "px-4 py-2.5 rounded-[6px] border transition-all flex items-center gap-2 h-[48px]",
                            filter === 'upcoming'
                                ? "bg-[#EEF4FF] border-[#2563EB] text-[#2563EB]"
                                : "bg-white border-[#E2E8F0] text-[#0F172A]"
                        )}
                    >
                        <span className={cn(
                            "text-[16px] font-bold",
                            filter === 'upcoming' ? "text-[#2563EB]" : "text-[#0F172A]"
                        )}>
                            {upcomingCount}
                        </span>
                        <span className="text-[13px] font-medium whitespace-nowrap">Upcoming Meetings</span>
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={cn(
                            "px-4 py-2.5 rounded-[6px] border transition-all flex items-center gap-2 h-[48px]",
                            filter === 'completed'
                                ? "bg-[#EEF4FF] border-[#2563EB] text-[#2563EB]"
                                : "bg-white border-[#E2E8F0] text-[#0F172A]"
                        )}
                    >
                        <span className={cn(
                            "text-[16px] font-bold",
                            filter === 'completed' ? "text-[#2563EB]" : "text-[#0F172A]"
                        )}>
                            {completedCount}
                        </span>
                        <span className="text-[13px] font-medium whitespace-nowrap">Completed Meetings</span>
                    </button>
                </div>

                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="outline"
                    className="gap-2 border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 h-[40px] px-4 rounded-[6px] font-medium"
                >
                    <Calendar size={18} className="text-[#64748b]" />
                    Add Meeting
                </Button>
            </div>

            {/* Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc] border-b border-slate-100">
                            <TableHead className="py-4 font-semibold text-[#0f172a] h-auto">Meeting Title</TableHead>
                            <TableHead className="py-4 font-semibold text-[#0f172a] h-auto">Due Date</TableHead>
                            <TableHead className="py-4 font-semibold text-[#0f172a] h-auto">Completed Date</TableHead>
                            <TableHead className="py-4 font-semibold text-[#0f172a] h-auto">Owner</TableHead>
                            <TableHead className="py-4 font-semibold text-[#0f172a] h-auto">Outcome</TableHead>
                            <TableHead className="py-4 text-right h-auto"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMeetings.length > 0 ? (
                            filteredMeetings.map((meeting) => (
                                <TableRow key={meeting.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                                    <TableCell className="py-4 text-slate-600 font-medium">{meeting.title}</TableCell>
                                    <TableCell className="py-4 text-slate-500">{meeting.dueDate}</TableCell>
                                    <TableCell className="py-4 text-slate-400">
                                        {meeting.completedDate || '--'}
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600">{meeting.owner}</TableCell>
                                    <TableCell className="py-4 text-slate-400">
                                        {meeting.outcome || '--'}
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                onClick={() => handleOutcome(meeting.id)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 border-slate-200 text-[#64748b] text-xs font-medium px-3 rounded-md hover:bg-slate-50"
                                            >
                                                Add Outcome
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-md">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100 p-1 bg-white">
                                                    <DropdownMenuItem
                                                        onClick={() => handleReschedule(meeting.id)}
                                                        className="gap-2 py-2.5 px-3 rounded-lg cursor-pointer text-slate-600 focus:bg-slate-50 font-medium"
                                                    >
                                                        <Clock size={16} />
                                                        <span>Reschedule</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleCancel(meeting.id)}
                                                        className="gap-2 py-2.5 px-3 rounded-lg cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 font-medium"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-[300px] text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <Calendar size={48} className="opacity-10" />
                                        <p className="text-sm">No meetings found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddMeetingModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                leadName={leadName}
            />

            <RescheduleMeetingModal
                open={isRescheduleModalOpen}
                onOpenChange={setIsRescheduleModalOpen}
                meetingId={selectedMeetingId || undefined}
            />

            <CancelMeetingModal
                open={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
                meetingId={selectedMeetingId || undefined}
            />

            <AddOutcomeModal
                open={isOutcomeModalOpen}
                onOpenChange={setIsOutcomeModalOpen}
                meetingId={selectedMeetingId || undefined}
            />
        </div>
    );
};

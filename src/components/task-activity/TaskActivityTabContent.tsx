import React, { useState } from 'react';
import {
    Calendar,
    Mail,
    Phone,
    FileText,
    MoreVertical,
    Plus,
    Eye,
    Trash2,
    Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScheduleActivityModal } from './ScheduleActivityModal'
import { ViewTaskModal } from './ViewTaskModal';
import { AddActivityOutcomeModal } from './AddActivityOutcomeModal';

interface Activity {
    id: string;
    type: 'meeting' | 'email' | 'call' | 'todo';
    title: string;
    owner: string;
    date: string;
    status: 'new' | 'upcoming' | 'overdue' | 'completed';
    description: string;
}

const MOCK_ACTIVITIES: Activity[] = [
    {
        id: '1',
        type: 'meeting',
        title: 'Meeting: Product Demo',
        owner: 'Peter Parker',
        date: 'Feb 23, 2026 12:05 PM',
        status: 'new',
        description: 'Reviewed new features requirement to disused'
    },
    {
        id: '2',
        type: 'email',
        title: 'Email: Follow-up Proposal',
        owner: 'Peter Parker',
        date: 'Feb 23, 2026 12:05 PM',
        status: 'upcoming',
        description: 'Send proposal document. Awaiting feedback'
    },
    {
        id: '3',
        type: 'call',
        title: 'Call: Discuss Contract Details',
        owner: 'Peter Parker',
        date: 'Feb 23, 2026 12:05 PM',
        status: 'overdue',
        description: 'Call with parker to finalize contract terms.'
    },
    {
        id: '4',
        type: 'todo',
        title: 'To-Do: Prepare Presentation',
        owner: 'Peter Parker',
        date: 'Feb 23, 2026 12:05 PM',
        status: 'completed',
        description: 'Create slides for next week\'s meeting.'
    }
];

export const TaskActivityTabContent = () => {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    const handleViewActivity = (activity: Activity) => {
        setSelectedActivity(activity);
        setIsViewModalOpen(true);
    };

    const handleAddOutcome = (activity: Activity) => {
        setSelectedActivity(activity);
        setIsOutcomeModalOpen(true);
    };

    const counts = {
        all: MOCK_ACTIVITIES.length,
        upcoming: MOCK_ACTIVITIES.filter(a => a.status === 'upcoming').length,
        overdue: MOCK_ACTIVITIES.filter(a => a.status === 'overdue').length,
        completed: MOCK_ACTIVITIES.filter(a => a.status === 'completed').length,
    };

    const getTypeIcon = (type: Activity['type']) => {
        switch (type) {
            case 'meeting': return <Calendar className="h-4 w-4" />;
            case 'email': return <Mail className="h-4 w-4" />;
            case 'call': return <Phone className="h-4 w-4" />;
            case 'todo': return <FileText className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: Activity['status']) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'upcoming': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'overdue': return 'bg-red-50 text-red-600 border-red-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        }
    };

    const getBorderColor = (status: Activity['status']) => {
        switch (status) {
            case 'new': return 'border-l-blue-500';
            case 'upcoming': return 'border-l-orange-500';
            case 'overdue': return 'border-l-red-500';
            case 'completed': return 'border-l-emerald-500';
        }
    };

    const filteredActivities = filter === 'all'
        ? MOCK_ACTIVITIES
        : MOCK_ACTIVITIES.filter(a => a.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {[
                        { id: 'all', label: 'All', count: counts.all },
                        { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                        { id: 'overdue', label: 'Overdue', count: counts.overdue },
                        { id: 'completed', label: 'Completed', count: counts.completed },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={cn(
                                "px-4 py-2.5 rounded-[6px] border transition-all flex items-center gap-2 h-[48px]",
                                filter === f.id
                                    ? "bg-[#EEF4FF] border-[#2563EB] text-[#2563EB]"
                                    : "bg-white border-[#E2E8F0] text-[#0F172A]"
                            )}
                        >
                            <span className={cn(
                                "text-[16px] font-bold",
                                filter === f.id ? "text-[#2563EB]" : "text-[#0F172A]"
                            )}>{f.count}</span>
                            <span className="text-[13px] font-medium whitespace-nowrap">{f.label}</span>
                        </button>
                    ))}
                </div>

                <Button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white gap-2 h-10 px-6 rounded-lg font-semibold shadow-sm"
                >
                    Schedule Activity
                    <Plus size={16} />
                </Button>
            </div>

            <div className="space-y-4 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[1px] before:bg-slate-200">
                {filteredActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-6 group">
                        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                            {getTypeIcon(activity.type)}
                        </div>

                        <div className={cn(
                            "flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md",
                            getBorderColor(activity.status)
                        )}>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-slate-800 text-[15px]">{activity.title}</h3>
                                        <span className="text-slate-400 text-xs text-[11px]">|</span>
                                        <span className="text-slate-500 text-[13px] font-medium">Owner: {activity.owner}</span>
                                        <span className="text-slate-400 text-xs text-[11px]">|</span>
                                        <span className="text-slate-500 text-[13px] font-medium">{activity.date}</span>
                                        <Badge variant="outline" className={cn(
                                            "ml-2 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-transparent",
                                            getStatusColor(activity.status)
                                        )}>
                                            {activity.status}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-500 text-[14px]">{activity.description}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activity.status === 'completed' ? (
                                        <Button
                                            onClick={() => handleViewActivity(activity)}
                                            variant="outline"
                                            className="h-8 gap-2 border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 bg-white hover:bg-slate-50"
                                        >
                                            <Eye size={14} /> View
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleAddOutcome(activity)}
                                            variant="outline"
                                            className="h-8 gap-2 border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 bg-white hover:bg-slate-50"
                                        >
                                            <Plus size={14} /> Add Outcome
                                        </Button>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-md">
                                                <MoreVertical size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32 p-1 rounded-xl shadow-xl border-slate-100 bg-white">
                                            <DropdownMenuItem
                                                onClick={() => handleViewActivity(activity)}
                                                className="gap-2 py-2 px-3 rounded-lg cursor-pointer text-slate-600 focus:bg-slate-50 font-medium"
                                            >
                                                <Edit2 size={14} /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 py-2 px-3 rounded-lg cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 font-medium">
                                                <Trash2 size={14} /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ScheduleActivityModal
                open={isScheduleModalOpen}
                onOpenChange={setIsScheduleModalOpen}
            />

            <ViewTaskModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                task={selectedActivity}
            />

            <AddActivityOutcomeModal
                open={isOutcomeModalOpen}
                onOpenChange={setIsOutcomeModalOpen}
                activityId={selectedActivity?.id}
            />
        </div>
    );
};

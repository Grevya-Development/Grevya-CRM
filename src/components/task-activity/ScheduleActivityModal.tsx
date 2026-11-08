import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';

interface ScheduleActivityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ACTIVITY_TYPES = [
    { label: "Meeting", value: "meeting" },
    { label: "Email", value: "email" },
    { label: "Call", value: "call" },
    { label: "To-Do", value: "todo" },
];

const ASSIGNED_TO = [
    { label: "Peter Parker", value: "peter" },
    { label: "Siva Kumar", value: "siva" },
];

const STATUS_OPTIONS = [
    { label: "New", value: "new" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Overdue", value: "overdue" },
    { label: "Completed", value: "completed" },
];

export const ScheduleActivityModal = ({ open, onOpenChange }: ScheduleActivityModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        activityType: '',
        title: '',
        description: '',
        assignedTo: '',
        date: '2026-02-18',
        time: '03:45',
        status: ''
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        // Mocking save for now
        setTimeout(() => {
            setLoading(false);
            toast.success("Activity scheduled successfully");
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-white">
                    <DialogTitle className="text-xl font-bold text-[#0f172a]">Schedule Activity</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[80vh] custom-scrollbar">
                    <div>
                        <FloatingLabelSelect
                            label="Activity Type"
                            placeholder="Select"
                            items={ACTIVITY_TYPES}
                            value={formData.activityType}
                            onValueChange={(v) => handleInputChange('activityType', v)}
                        />
                    </div>

                    <div>
                        <FloatingLabelInput
                            label="Title"
                            placeholder="Enter title here"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </div>

                    <div>
                        <FloatingLabelTextarea
                            label="Description"
                            placeholder="Enter description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    <div>
                        <FloatingLabelSelect
                            label="Assigned To"
                            placeholder="Select a person"
                            items={ASSIGNED_TO}
                            value={formData.assignedTo}
                            onValueChange={(v) => handleInputChange('assignedTo', v)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <FloatingLabelInput
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            suffix={<CalendarIcon className="h-4 w-4" />}
                            className="flex-1 [&_input]:pt-1"
                        />
                        <FloatingLabelInput
                            label="Time"
                            type="time"
                            value={formData.time}
                            onChange={(e) => handleInputChange('time', e.target.value)}
                            suffix={<Clock className="h-4 w-4" />}
                            className="w-[140px] [&_input]:pt-1"
                        />
                    </div>

                    <div>
                        <FloatingLabelSelect
                            label="Status"
                            placeholder="Select a status"
                            items={STATUS_OPTIONS}
                            value={formData.status}
                            onValueChange={(v) => handleInputChange('status', v)}
                        />
                    </div>
                </div>

                <div className="p-6 pt-2 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-11 w-28 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-11 w-28 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

import React, { useState, useEffect } from 'react';
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

interface ViewTaskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: {
        id: string;
        title: string;
        description: string;
        owner: string;
        date: string;
        status: string;
    } | null;
}

const ASSIGNED_TO = [
    { label: "Peter Parker", value: "Peter Parker" },
    { label: "Siva Kumar", value: "Siva Kumar" },
];

const STATUS_OPTIONS = [
    { label: "New", value: "new" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Overdue", value: "overdue" },
    { label: "Completed", value: "completed" },
];

export const ViewTaskModal = ({ open, onOpenChange, task }: ViewTaskModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        date: '2026-02-24',
        time: '03:45',
        status: ''
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description,
                assignedTo: task.owner,
                date: '2026-02-24', // Mocking date part
                time: '03:45',      // Mocking time part
                status: task.status
            });
            setIsEditing(false);
        }
    }, [task]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        // Mocking save
        setTimeout(() => {
            setLoading(false);
            toast.success("Task updated successfully");
            setIsEditing(false);
        }, 1000);
    };

    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-white">
                    <DialogTitle className="text-xl font-bold text-[#0f172a]">View Task</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-white">
                    <div>
                        <FloatingLabelInput
                            label="Title"
                            placeholder="Enter title here"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-slate-50 border-slate-200" : ""}
                        />
                    </div>

                    <div>
                        <FloatingLabelTextarea
                            label="Description"
                            placeholder="Enter description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-slate-50 border-slate-200 min-h-[200px]" : "min-h-[200px]"}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FloatingLabelSelect
                            label="Assigned To"
                            placeholder="Select a person"
                            items={ASSIGNED_TO}
                            value={formData.assignedTo}
                            onValueChange={(v) => handleInputChange('assignedTo', v)}
                            disabled={!isEditing}
                        />

                        <div className="flex gap-4">
                            <FloatingLabelInput
                                label="Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                suffix={<CalendarIcon className="h-4 w-4" />}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-slate-50 border-slate-200 flex-1" : "flex-1"}
                            />
                            <FloatingLabelInput
                                label="Time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => handleInputChange('time', e.target.value)}
                                suffix={<Clock className="h-4 w-4" />}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-slate-50 border-slate-200 w-[140px]" : "w-[140px]"}
                            />
                        </div>
                    </div>

                    <div className="w-1/2">
                        <FloatingLabelSelect
                            label="Status"
                            placeholder="Select a status"
                            items={STATUS_OPTIONS}
                            value={formData.status}
                            onValueChange={(v) => handleInputChange('status', v)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="h-11 px-10 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                            >
                                Edit Task
                            </Button>
                        ) : (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    className="h-11 px-10 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="h-11 px-10 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                                >
                                    {loading ? 'Saving...' : 'Save Task'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

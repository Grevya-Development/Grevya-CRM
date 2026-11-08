import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Calendar as CalendarIcon,
    Clock,
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';

interface AddMeetingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadName?: string;
}

const ATTENDEE_ITEMS = [
    { label: "Attendee 1", value: "attendee-1" },
    { label: "Attendee 2", value: "attendee-2" },
];

const TIMEZONE_ITEMS = [
    { label: "(GMT+00:00) UTC", value: "utc" },
    { label: "(GMT+05:30) IST", value: "ist" },
];

const LOCATION_ITEMS = [
    { label: "Conference Room 1", value: "room1" },
    { label: "Office Hub", value: "room2" },
];

export const AddMeetingModal = ({ open, onOpenChange, leadName }: AddMeetingModalProps) => {
    const [loading, setLoading] = useState(false);
    const [allDay, setAllDay] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        attendees: '',
        fromDate: '2026-02-18',
        fromTime: '03:45',
        toDate: '2026-02-18',
        toTime: '04:15',
        timezone: 'utc',
        location: '',
        description: ''
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Meeting scheduled successfully");
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 rounded-xl overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-semibold text-[#0f172a]">Add meeting</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Title */}
                    <div>
                        <FloatingLabelInput
                            label="Title"
                            placeholder="Enter a title of meeting"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </div>

                    {/* Attendees */}
                    <div>
                        <FloatingLabelSelect
                            label="Invite Attendees"
                            placeholder="Click to select attendees"
                            items={ATTENDEE_ITEMS}
                            value={formData.attendees}
                            onValueChange={(v) => handleInputChange('attendees', v)}
                        />
                    </div>

                    {/* Date/Time Row */}
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-[#64748b] ml-1 uppercase tracking-wider text-[11px]">From</label>
                            <div className="flex gap-2">
                                <FloatingLabelInput
                                    label=""
                                    type="date"
                                    value={formData.fromDate}
                                    onChange={(e) => handleInputChange('fromDate', e.target.value)}
                                    suffix={<CalendarIcon className="h-4 w-4" />}
                                    className="flex-1 [&_input]:pt-1"
                                />
                                <FloatingLabelInput
                                    label=""
                                    type="time"
                                    value={formData.fromTime}
                                    onChange={(e) => handleInputChange('fromTime', e.target.value)}
                                    suffix={<Clock className="h-4 w-4" />}
                                    className="w-[140px] [&_input]:pt-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-[#64748b] ml-1 uppercase tracking-wider text-[11px]">To</label>
                            <div className="flex gap-2">
                                <FloatingLabelInput
                                    label=""
                                    type="date"
                                    value={formData.toDate}
                                    onChange={(e) => handleInputChange('toDate', e.target.value)}
                                    suffix={<CalendarIcon className="h-4 w-4" />}
                                    className="flex-1 [&_input]:pt-1"
                                />
                                <FloatingLabelInput
                                    label=""
                                    type="time"
                                    value={formData.toTime}
                                    onChange={(e) => handleInputChange('toTime', e.target.value)}
                                    suffix={<Clock className="h-4 w-4" />}
                                    className="w-[140px] [&_input]:pt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* All Day */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#64748b]">All Day</span>
                        <Switch checked={allDay} onCheckedChange={setAllDay} />
                    </div>

                    {/* Time Zone */}
                    <div>
                        <FloatingLabelSelect
                            label="Time Zone"
                            placeholder="Select timezone"
                            items={TIMEZONE_ITEMS}
                            value={formData.timezone}
                            onValueChange={(v) => handleInputChange('timezone', v)}
                        />
                    </div>

                    {/* Video Conferencing */}
                    <div className="space-y-3 text-left">
                        <label className="text-sm font-medium text-[#64748b]">Add video conferencing</label>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-11 border-slate-200 rounded-lg gap-3 text-slate-600 font-medium hover:bg-slate-50 transition-all">
                                <img src="/Leaddetails/zoom_icon.png" alt="Zoom" className="w-5 h-5 object-contain" />
                                Connect Zoom
                            </Button>
                            <Button variant="outline" className="flex-1 h-11 border-slate-200 rounded-lg gap-3 text-slate-600 font-medium hover:bg-slate-50 transition-all">
                                <img src="/Leaddetails/teams-icon.png" alt="Teams" className="w-5 h-5 object-contain" />
                                Connect Teams
                            </Button>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <FloatingLabelSelect
                            label="Add room or location"
                            placeholder="Enter room or location of meeting"
                            items={LOCATION_ITEMS}
                            value={formData.location}
                            onValueChange={(v) => handleInputChange('location', v)}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <FloatingLabelTextarea
                            label="Description"
                            placeholder="Enter Description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    {/* Calendar Integrations */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-10 border-slate-200 rounded-lg gap-2 text-slate-600 text-xs font-medium px-4 hover:bg-slate-50 transition-all">
                            <img src="/Leaddetails/google_calender_icon.png" alt="Google Calendar" className="w-4 h-4 object-contain" />
                            Connect Google Calender
                        </Button>
                        <Button variant="outline" className="h-10 border-slate-200 rounded-lg gap-2 text-slate-600 text-xs font-medium px-4 hover:bg-slate-50 transition-all">
                            <img src="/Leaddetails/office_365_icon.png" alt="Office 365" className="w-4 h-4 object-contain" />
                            Connect Office 365
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-11 w-28 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="h-11 w-36 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-medium"
                    >
                        {loading ? 'Creating...' : 'Create Meeting'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

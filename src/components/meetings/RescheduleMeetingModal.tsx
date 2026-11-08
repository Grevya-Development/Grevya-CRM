import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { toast } from "sonner";

interface RescheduleMeetingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    meetingId?: string;
    initialDate?: string;
    initialTime?: string;
}

export const RescheduleMeetingModal = ({
    open,
    onOpenChange,
    meetingId,
    initialDate = "2026-02-18",
    initialTime = "03:45"
}: RescheduleMeetingModalProps) => {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(initialTime);

    const handleSave = async () => {
        setLoading(true);
        // Mocking save for now
        setTimeout(() => {
            setLoading(false);
            toast.success("Meeting rescheduled successfully");
            onOpenChange(false);
        }, 8000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-semibold text-[#0f172a]">Reschedule</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#64748b] ml-1">Pick your date and time</label>
                        <div className="flex gap-3">
                            <FloatingLabelInput
                                label=""
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                suffix={<Calendar className="h-4 w-4" />}
                                className="flex-1 [&_input]:pt-1"
                            />
                            <FloatingLabelInput
                                label=""
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                suffix={<Clock className="h-4 w-4" />}
                                className="w-[140px] [&_input]:pt-1"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 border-t border-slate-50 flex justify-center gap-3 bg-white">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-10 w-28 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-10 w-28 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-200"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

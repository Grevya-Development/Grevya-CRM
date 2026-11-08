import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { toast } from "sonner";

interface CancelMeetingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    meetingId?: string;
}

export const CancelMeetingModal = ({ open, onOpenChange, meetingId }: CancelMeetingModalProps) => {
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            toast.success("Meeting cancelled successfully");
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                <div className="relative p-8 flex flex-col items-center text-center space-y-4">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                        <Info size={24} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-[#0f172a]">Cancel Meeting</h3>
                        <p className="text-[#64748b] text-base font-medium">
                            Are you sure you want to cancel this meeting?
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-11 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 font-bold"
                        >
                            No
                        </Button>
                        <Button
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex-1 h-11 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold"
                        >
                            {loading ? 'Cancelling...' : 'Yes, Cancel Meeting'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

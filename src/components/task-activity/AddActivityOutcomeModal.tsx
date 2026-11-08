import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { toast } from "sonner";

interface AddActivityOutcomeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activityId?: string;
}

const OUTCOME_OPTIONS = [
    { label: "Interested", value: "interested" },
    { label: "Left Message", value: "left-message" },
    { label: "No Response", value: "no-response" },
    { label: "Not Interested", value: "not-interested" },
    { label: "Not able to reach", value: "not-reachable" }
];

export const AddActivityOutcomeModal = ({ open, onOpenChange, activityId }: AddActivityOutcomeModalProps) => {
    const [loading, setLoading] = useState(false);
    const [outcome, setOutcome] = useState<string>("");
    const [notes, setNotes] = useState("");

    const handleSave = async () => {
        if (!outcome) {
            toast.error("Please select an outcome");
            return;
        }
        setLoading(true);
        // Mocking save
        setTimeout(() => {
            setLoading(false);
            toast.success("Outcome saved successfully");
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl rounded-xl bg-white overflow-visible">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
                    <DialogTitle className="text-xl font-bold text-[#0f172a]">Add outcome</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-white overflow-visible">
                    <div>
                        <FloatingLabelSelect
                            label="Add outcome"
                            placeholder="Click to select"
                            items={OUTCOME_OPTIONS}
                            value={outcome}
                            onValueChange={setOutcome}
                        />
                    </div>

                    <FloatingLabelTextarea
                        label="Description"
                        placeholder="Start typing or @ mention people to notify them"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ minHeight: '200px' }}
                    />
                </div>

                <div className="p-6 pt-2 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-xl">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-11 px-8 rounded-lg border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-11 px-8 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                    >
                        {loading ? 'Saving...' : 'Save and Mark as complete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

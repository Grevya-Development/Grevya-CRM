import React, { useState, useEffect } from "react";
import { Trash2, X, Clock } from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import { toast } from "sonner";
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/floating-label-input';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface ActivityPopupProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityType: "customer" | "lead";
    taskData?: any;
    onTaskCreate?: () => void;
    onTaskDelete?: () => void;
}

const ActivityPopup: React.FC<ActivityPopupProps> = ({
    isOpen,
    onClose,
    entityId,
    entityType,
    onTaskCreate,
    onTaskDelete,
    taskData,
}) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assignedTo: "",
        date: "",
        time: "",
        status: "pending",
    });

    const [salesPersons, setSalesPersons] = useState<{ id: string; name: string }[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (taskData) {
            const dueDate = taskData.due_date ? new Date(taskData.due_date) : null;

            setFormData({
                title: taskData.title || "",
                description: taskData.description || "",
                assignedTo: taskData.assigned_to || "",
                date: dueDate ? dueDate.toISOString().split("T")[0] : "",
                time: dueDate
                    ? dueDate.toTimeString().slice(0, 5)
                    : "",
                status: taskData.status || "pending",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                assignedTo: "",
                date: "",
                time: "",
                status: "pending",
            });
        }
    }, [taskData, isOpen]);

    useEffect(() => {
        const fetchSalesPersons = async () => {
            const { data, error } = await supabase
                .from("crm_salesperson")
                .select("id, name");

            if (!error) setSalesPersons(data || []);
        };

        if (isOpen) fetchSalesPersons();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {

            if (!formData.date || !formData.time) {
                toast.error("Due date & time required");
                return;
            }

            const combinedDateTime = `${formData.date}T${formData.time}`;

            let error;

            if (taskData) {
                const response = await supabase
                    .from("crm_tasks")
                    .update({
                        title: formData.title,
                        description: formData.description,
                        due_date: combinedDateTime,
                        assigned_to: formData.assignedTo || null,
                        status: formData.status,
                    })
                    .eq("id", taskData.id);

                error = response.error;
            } else {
                const response = await supabase
                    .from("crm_tasks")
                    .insert({
                        entity_id: entityId,
                        entity_type: entityType,
                        title: formData.title,
                        description: formData.description,
                        due_date: combinedDateTime,
                        assigned_to: formData.assignedTo || null,
                        status: formData.status,
                    });

                error = response.error;
            }

            if (error) throw error;

            toast.success(taskData ? "Task updated successfully" : "Task created successfully");

            onTaskCreate?.();
            onClose();

        } catch (error: any) {
            toast.error(error.message || "Failed to save task");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!taskData?.id) return;
        try {
            const { error } = await supabase
                .from("crm_tasks")
                .delete()
                .eq("id", taskData.id);

            if (error) throw error;

            toast.success("Task deleted successfully");
            onTaskDelete?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete task");
        } finally {
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {taskData ? "Edit Task" : "Schedule Task"}
                    </h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-slate-500 hover:text-slate-700" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    <FloatingLabelInput
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full"
                    />

                    <FloatingLabelTextarea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">
                                Assigned To
                            </label>
                            <select
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select User</option>
                                {salesPersons.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[12px] font-medium text-slate-500 ml-0.5">
                                Due Date & Time
                            </label>
                            <div className="flex gap-2">
                                <DatePicker
                                    label="Date"
                                    date={formData.date ? new Date(formData.date) : undefined}
                                    setDate={(date) => setFormData({ ...formData, date: date ? format(date, "yyyy-MM-dd") : "" })}
                                    className="flex-1"
                                />
                                <FloatingLabelInput
                                    type="time"
                                    label="Time"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    className="w-[140px]"
                                    suffix={<Clock className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="start">Start</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center px-6 py-4 border-t bg-slate-50 rounded-b-xl">
                    <div>
                        {taskData && (
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Task
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSave}
                            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {taskData ? "Update Task" : "Save Task"}
                        </button>
                    </div>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the task. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ActivityPopup;
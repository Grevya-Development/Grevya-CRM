import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase/supabaseClient";
import log from "@/utils/logger";
import ScheduleTask from "./ScheduleTask";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ActivityPopup from "./ScheduleTask";
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

interface Task {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    created_at: string;
    status: string;
    assigned_to_name?: string | null;
}

interface TaskListViewProps {
    entityId: string
    entityType: "customer" | "lead"
    onCountChange: (count: number) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ entityId, entityType, onCountChange }) => {
    const [activeFilter, setActiveFilter] = useState("all");
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const fetchTasks = async (entityId: string, entityType: string) => {
        log.debug("fetchTasks called");
        setLoadingTasks(true);

        const { data, error } = await supabase
            .from("crm_tasks")
            .select(`*,crm_salesperson (name)`)
            .eq("entity_id", entityId)
            .eq("entity_type", entityType)
            .order("due_date", { ascending: true });

        if (!error && data) {
            log.info("fetchTasks successful");

            const flattenedTasks: Task[] = data.map((task: any) => ({
                ...task,
                assigned_to_name: task.crm_salesperson?.name || null,
            }));

            if (onCountChange) {
                onCountChange(data?.length || 0);
            }

            setTasks(flattenedTasks);
        } else {
            log.error("fetchTasks error", error);
        }

        setLoadingTasks(false);
    };

    useEffect(() => {
        if (entityId) {
            fetchTasks(entityId, entityType);
        }
    }, [entityId, entityType]);

    const { filteredTasks, counts } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let upcoming = 0;
        let overdue = 0;
        let completed = 0;

        const processedTasks = tasks.map((task) => {
            const due = new Date(task.due_date);
            due.setHours(0, 0, 0, 0);

            const isCompleted = task.status === "completed";
            const isOverdue = !isCompleted && due < today;

            if (isCompleted) {
                completed++;
            } else if (isOverdue) {
                overdue++;
            } else {
                upcoming++;
            }

            return {
                ...task,
                isOverdue,
            };
        });

        const filtered = processedTasks.filter((task) => {
            if (activeFilter === "upcoming")
                return !task.isOverdue && task.status !== "completed";

            if (activeFilter === "overdue")
                return task.isOverdue;

            if (activeFilter === "completed")
                return task.status === "completed";

            return true;
        });

        return {
            filteredTasks: filtered,
            counts: {
                all: tasks.length,
                upcoming,
                overdue,
                completed,
            },
        };
    }, [tasks, activeFilter]);

    const handleDeleteTask = (taskId: string) => {
        setTaskToDelete(taskId);
        setIsDeleteDialogOpen(true);
        setOpenMenu(null);
    };

    const handleDeleteConfirm = async () => {
        if (!taskToDelete) return;
        try {
            const { error } = await supabase
                .from("crm_tasks")
                .delete()
                .eq("id", taskToDelete);

            if (error) throw error;

            toast.success("Task deleted successfully");

            // refresh list + update count
            fetchTasks(entityId, entityType);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete task");
        } finally {
            setIsDeleteDialogOpen(false);
            setTaskToDelete(null);
        }
    };

    const getStatusBadge = (task: Task) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = new Date(task.due_date);
        due.setHours(0, 0, 0, 0);

        const isOverdue =
            task.status !== "completed" && due < today;

        if (task.status === "completed")
            return "bg-green-100 text-green-700";

        if (task.status === "start")
            return "bg-blue-100 text-blue-700";

        if (isOverdue)
            return "bg-red-100 text-red-600";

        return "bg-yellow-100 text-yellow-700";
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setOpenDialog(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setOpenDialog(true);
        setOpenMenu(null);
    };

    if (loadingTasks) {
        return (
            <div className="flex justify-center py-12 text-sm text-slate-500">
                Loading tasks...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {["all", "upcoming", "overdue", "completed"].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={cn(
                                "px-4 py-1.5 text-sm rounded-md border capitalize",
                                activeFilter === filter
                                    ? "bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-slate-200 text-slate-600"
                            )}
                        >
                            {filter} ({counts[filter as keyof typeof counts]})
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleAddTask}
                    className="px-4 py-1.5 text-sm border rounded-md bg-white">
                    Schedule Activity
                </button>
            </div>
            <div className="space-y-3">
                {filteredTasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-start justify-between border rounded-lg p-4 bg-white hover:shadow-sm transition"
                    >
                        <div className="flex gap-3">
                            <div className="p-2 bg-slate-100 rounded-full">
                                <Calendar className="w-4 h-4 text-slate-500" />
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">
                                    {task.title}
                                </h4>

                                <div className="text-xs text-slate-500 mt-1">
                                    Owner: {task.assigned_to_name || "Unassigned"} |{" "}
                                    {new Date(task.due_date).toLocaleDateString()}
                                </div>

                                {task.description && (
                                    <p className="text-xs text-slate-600 mt-2">
                                        {task.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative">
                            <span
                                className={cn(
                                    "px-2 py-0.5 text-xs rounded-full capitalize",
                                    getStatusBadge(task)
                                )}
                            >
                                {task.status}
                            </span>

                            <button
                                onClick={() =>
                                    setOpenMenu(openMenu === task.id ? null : task.id)
                                }
                            >
                                <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>

                            {openMenu === task.id && (
                                <div className="absolute right-0 top-8 w-32 bg-white border rounded-md shadow-md z-10">
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-8">
                        No tasks found
                    </div>
                )}
            </div>

            <ActivityPopup
                isOpen={openDialog}
                onClose={() => setOpenDialog(false)}
                entityId={entityId}
                entityType={entityType}
                taskData={editingTask}
                onTaskCreate={() => fetchTasks(entityId, entityType)}
                onTaskDelete={() => fetchTasks(entityId, entityType)}
            />

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

export default TaskListView;
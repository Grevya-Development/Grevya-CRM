import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Settings2, GripVertical, Check } from 'lucide-react';
import { ColumnDefinition } from '@/services/userSettings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SortableColumnItemProps {
    column: ColumnDefinition;
    onToggle: (id: string, checked: boolean) => void;
}

function SortableColumnItem({ column, onToggle }: SortableColumnItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-2 bg-card border rounded-md mb-2 group"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
            </div>
            <Checkbox
                checked={column.visible}
                onCheckedChange={(checked) => onToggle(column.id, checked as boolean)}
                id={`col-${column.id}`}
            />
            <Label htmlFor={`col-${column.id}`} className="flex-1 cursor-pointer truncate">
                {column.label}
            </Label>
        </div>
    );
}

interface ColumnManagerProps {
    columns: ColumnDefinition[];
    onColumnsChange: (columns: ColumnDefinition[]) => void;
    title?: string;
    buttonText?: string;
    triggerClassName?: string;
}

export function ColumnManager({
    columns,
    onColumnsChange,
    title = "Manage Columns",
    buttonText = "Columns",
    triggerClassName
}: ColumnManagerProps) {
    const [stagedColumns, setStagedColumns] = useState<ColumnDefinition[]>(columns);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setStagedColumns(columns);
    }, [columns]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = stagedColumns.findIndex((c) => c.id === active.id);
            const newIndex = stagedColumns.findIndex((c) => c.id === over?.id);
            setStagedColumns(arrayMove(stagedColumns, oldIndex, newIndex));
        }
    };

    const handleToggle = (id: string, checked: boolean) => {
        const newColumns = stagedColumns.map((col) =>
            col.id === id ? { ...col, visible: checked } : col
        );
        setStagedColumns(newColumns);
    };

    const handleConfirm = () => {
        onColumnsChange(stagedColumns);
        setOpen(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setStagedColumns(columns);
        }
        setOpen(newOpen);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("gap-2", triggerClassName)}>
                                <Settings2 className="h-4 w-4" />
                                {buttonText && !triggerClassName && buttonText}
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    {triggerClassName && <TooltipContent>Manage Columns</TooltipContent>}
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-[300px] p-0 shadow-xl border-slate-200" align="end">
                <div className="p-4 border-b">
                    <h4 className="font-medium leading-none mb-2">{title}</h4>
                    <p className="text-sm text-muted-foreground">
                        Drag to reorder, uncheck to hide.
                    </p>
                </div>
                <ScrollArea className="h-[300px] p-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={stagedColumns.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {stagedColumns.map((column) => (
                                <SortableColumnItem
                                    key={column.id}
                                    column={column}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </ScrollArea>

                <div className="p-4 border-t bg-slate-50/50">
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        size="sm"
                        onClick={handleConfirm}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Selection
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

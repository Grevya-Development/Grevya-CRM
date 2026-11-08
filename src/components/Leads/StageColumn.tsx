import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DraggableLeadCard } from './DraggableLeadCard';
import { usePermission } from '@/contexts/PermissionContext';

interface StageColumnProps {
    stage: any;
    leads: Lead[];
    stageValue: number;
    formatCurrency: (amount: number) => string;
    onLeadUpdate: (lead: Lead) => void;
    onLeadDelete: (leadId: string) => void;
    onAddClick: () => void;
    isAdding: boolean;
    addingContent: React.ReactNode;
    leadIds?: string[];
}

export function StageColumn({
    stage,
    leads,
    stageValue,
    formatCurrency,
    onLeadUpdate,
    onLeadDelete,
    onAddClick,
    isAdding,
    addingContent,
    leadIds
}: StageColumnProps) {
    const { canCreate } = usePermission();
    const { setNodeRef, isOver } = useDroppable({ id: stage.key });

    return (
        <div ref={setNodeRef} className="w-72 shrink-0 rounded-xl border bg-slate-50 flex flex-col max-h-[calc(100vh-200px)]">
            {/* Column Header */}
            <div className="p-2 border-b flex-shrink-0 bg-slate-50 rounded-t-xl z-10">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider leading-tight">{stage.label}</h3>
                        <p className={cn("text-[11px] font-bold leading-tight", stage.color.replace('bg-', 'text-'))}>
                            {formatCurrency(stageValue)}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border leading-none">{leads.length}</span>
                        {canCreate("leads") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-slate-200 text-slate-500"
                                onClick={onAddClick}
                            >
                                <Plus size={12} className="text-blue-600" />
                            </Button>)}
                    </div>
                </div>
                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div className={cn("h-full w-1/2", stage.color)}></div>
                </div>
            </div>

            {/* Column Content */}
            <div className="p-1.5 space-y-2 flex-1 overflow-y-auto min-h-[150px]">
                {/* Inline Add Form */}
                {isAdding && (
                    <div className="mb-3">
                        {addingContent}
                    </div>
                )}

                {leads.map((lead) => (
                    <DraggableLeadCard
                        key={lead.id}
                        lead={lead}
                        onLeadUpdate={onLeadUpdate}
                        onLeadDelete={onLeadDelete}
                        leadIds={leadIds}
                    />
                ))}

                {leads.length === 0 && !isAdding && (
                    <div className={cn(
                        'flex items-center justify-center h-[105px] text-xs border-2 border-dashed rounded-lg text-slate-400',
                        isOver && 'border-primary bg-primary/5'
                    )}>
                        {isOver ? 'Drop here' : 'Empty Stage'}
                    </div>
                )}
            </div>
        </div>
    );
}

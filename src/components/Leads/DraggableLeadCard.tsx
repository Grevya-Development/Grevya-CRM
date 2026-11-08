import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { LeadsCard } from './LeadCard';
import { Lead } from '@/types';

interface DraggableLeadCardProps {
    lead: Lead;
    onLeadUpdate: (lead: Lead) => void;
    onLeadDelete: (leadId: string) => void;
    leadIds?: string[];
}

export function DraggableLeadCard({
    lead,
    onLeadUpdate,
    onLeadDelete,
    leadIds,
}: DraggableLeadCardProps) {
    const { setNodeRef, listeners, attributes, transform, isDragging } =
        useDraggable({ id: lead.id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Translate.toString(transform),
                opacity: isDragging ? 0 : 1,
            }}
            {...listeners}
            {...attributes}
            className="cursor-grab relative group"
        >
            <LeadsCard
                lead={lead}
                onLeadUpdate={onLeadUpdate}
                onLeadDelete={onLeadDelete}
                leadIds={leadIds}
            />
        </div>
    );
}

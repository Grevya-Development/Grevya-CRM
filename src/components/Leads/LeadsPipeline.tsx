import { useState } from 'react';
import { LeadsCard } from './LeadCard';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { Lead } from '@/types';
import { supabase } from '@/supabase/supabaseClient';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Maximize2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StageColumn } from './StageColumn';
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { LostReasonModal } from './LostReasonModal';

export const stages = [
  { key: 'Qualification', label: 'Qualification', color: 'bg-info' },
  { key: 'Need Analysis', label: 'Need Analysis', color: 'bg-primary/60' },
  { key: 'Value Proposition', label: 'Value Proposition', color: 'bg-purple-500' },
  { key: 'Identify Decision Makers', label: 'Identify Decision Makers', color: 'bg-primary' },
  { key: 'Proposal', label: 'Proposal', color: 'bg-primary' },
  { key: 'Negotiation', label: 'Negotiation', color: 'bg-warning' },
  { key: 'Won', label: 'Won', color: 'bg-success' },
  { key: 'Lost', label: 'Lost', color: 'bg-destructive' },
] as const;

interface LeadsPipelineProps {
  Leads: Lead[];
  onLeadsChange: (Leads: Lead[]) => void;
}

export function LeadsPipeline({ Leads, onLeadsChange }: LeadsPipelineProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  // Inline Adding State
  const [addingStage, setAddingStage] = useState<string | null>(null);
  const [newLeadSubject, setNewLeadSubject] = useState('');
  const [newLeadName, setNewLeadName] = useState('');
  const [newProductInterest, setNewProductInterest] = useState<string | undefined>(undefined);
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [isAddingLoading, setIsAddingLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Lost Reason Modal State
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [pendingLostLead, setPendingLostLead] = useState<{ id: string, oldStage: any, newStage: string, leadName: string } | null>(null);
  const [isLostUpdating, setIsLostUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getLeadsByStage = (stage: string) =>
    Leads.filter((lead) => (lead.lead_stage) === stage);

  const getStageValue = (stage: string) =>
    getLeadsByStage(stage).reduce((sum, lead) => sum + Number(lead.estimated_deal_value || 0), 0);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = Leads.find((l) => l.id === event.active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const id = active.id as string;
    const newStage = over.id as string;
    const lead = Leads.find((l) => l.id === id);
    if (!lead || lead.lead_stage === newStage) return;

    const oldStage = lead.lead_stage;

    if (newStage === 'Lost') {
      setPendingLostLead({ id, oldStage, newStage, leadName: lead.lead_name });
      setIsLostModalOpen(true);
      return;
    }

    onLeadsChange(
      Leads.map((l) => (l.id === id ? { ...l, lead_stage: newStage as any } : l))
    );

    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({
          lead_stage: newStage
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`"${lead.lead_name}" moved successfully`);

      await supabase.from('lead_logs').insert([{
        lead_id: id,
        action: 'STAGE_CHANGE',
        details: `Stage updated from ${oldStage} to ${newStage}`,
        performed_by: 'Current User'
      }]);

    } catch {
      onLeadsChange(
        Leads.map((l) => (l.id === id ? { ...l, lead_stage: oldStage } : l))
      );
      toast.error('Failed to update stage');
    }
  };

  const handleLostReasonSubmit = async (reason: string) => {
    if (!pendingLostLead) return;

    const { id, oldStage, newStage, leadName } = pendingLostLead;
    setIsLostUpdating(true);

    onLeadsChange(
      Leads.map((l) => (l.id === id ? { ...l, lead_stage: newStage as any, lost_reason: reason } : l))
    );

    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({
          lead_stage: newStage,
          lost_reason: reason
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`"${leadName}" moved to Lost stage`);

      await supabase.from('lead_logs').insert([{
        lead_id: id,
        action: 'STAGE_CHANGE',
        details: `Stage updated from ${oldStage} to ${newStage}. Reason: ${reason}`,
        performed_by: 'Current User'
      }]);

      setIsLostModalOpen(false);
      setPendingLostLead(null);
    } catch (err) {
      onLeadsChange(
        Leads.map((l) => (l.id === id ? { ...l, lead_stage: oldStage } : l))
      );
      toast.error('Failed to update stage');
    } finally {
      setIsLostUpdating(false);
    }
  };

  const handleLostCancel = () => {
    setIsLostModalOpen(false);
    setPendingLostLead(null);
  };

  const handleLeadUpdate = (updatedLead: Lead) => {
    onLeadsChange(
      Leads.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
  };

  const handleLeadDelete = (id: string) => {
    onLeadsChange(Leads.filter((l) => l.id !== id));
  };


  const startAdding = (stageKey: string) => {
    setAddingStage(stageKey);
    setNewLeadSubject('');
    setNewLeadName('');
    setNewProductInterest(undefined);
    setNewLeadEmail('');
  };

  const cancelAdding = () => {
    setAddingStage(null);
    setNewLeadSubject('');
    setNewLeadName('');
    setNewProductInterest(undefined);
    setNewLeadEmail('');
    setValidationErrors({});
  };

  const saveInlineLead = async () => {
    const errors: Record<string, string> = {};
    if (!newLeadSubject.trim()) errors.subject = "Subject is required";
    if (!newLeadName.trim()) errors.name = "Lead name is required";
    if (!newProductInterest) errors.productInterest = "Product interest is required";
    if (!newLeadEmail.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLeadEmail)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill all required fields");
      return;
    }

    setValidationErrors({});

    setIsAddingLoading(true);

    const newLead: Partial<Lead> = {
      subject: newLeadSubject,
      lead_name: newLeadName,
      product_interest: newProductInterest,
      email: newLeadEmail,
      lead_stage: addingStage as any,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert([newLead])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onLeadsChange([data, ...Leads]);

        // Log Creation
        await supabase.from('lead_logs').insert([{
          lead_id: data.id,
          action: 'CREATED',
          details: 'Lead created via inline form',
          performed_by: 'Current User'
        }]);

        toast.success("Lead created successfully");
        cancelAdding();
      }
    } catch (err: any) {
      console.error("Failed to add lead", err);
      toast.error(`Failed: ${err.message}`);
    } finally {
      setIsAddingLoading(false);
    }
  };

  const enhanceLead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    navigate('/Leads/add', {
      state: {
        initialValues: {
          subject: newLeadSubject,
          lead_name: newLeadName,
          product_interest: newProductInterest,
          lead_stage: addingStage,
          email: newLeadEmail,
        }
      }
    });
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-[600px]">
        {stages.map((stage) => (
          <StageColumn
            key={stage.key}
            stage={stage}
            leads={getLeadsByStage(stage.key)}
            stageValue={getStageValue(stage.key)}
            formatCurrency={formatCurrency}
            onLeadDelete={handleLeadDelete}
            onAddClick={() => startAdding(stage.key)}
            isAdding={addingStage === stage.key}
            onLeadUpdate={handleLeadUpdate}
            leadIds={Leads.map(l => l.id)}
            addingContent={
              <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Lead</h4>
                  <div className="space-y-4 pt-2">
                    <FloatingLabelTextarea
                      label="Subject/Title"
                      value={newLeadSubject}
                      onChange={e => {
                        setNewLeadSubject(e.target.value);
                        if (validationErrors.subject) setValidationErrors(prev => ({ ...prev, subject: "" }));
                      }}
                      required
                      className="min-h-[80px]"
                      error={validationErrors.subject}
                    />
                    <FloatingLabelInput
                      label="Lead Name"
                      value={newLeadName}
                      onChange={e => {
                        setNewLeadName(e.target.value);
                        if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: "" }));
                      }}
                      required
                      error={validationErrors.name}
                    />
                  </div>
                  <div className="space-y-4">
                    <FloatingLabelSelect
                      label="Product Interest"
                      placeholder="Select Product"
                      value={newProductInterest || ""}
                      onValueChange={v => {
                        setNewProductInterest(v);
                        if (validationErrors.productInterest) setValidationErrors(prev => ({ ...prev, productInterest: "" }));
                      }}
                      items={[
                        { label: "Crm", value: "Crm" },
                        { label: "Grevya", value: "Grevya" },
                        { label: "Other", value: "Other" },
                      ]}
                      required
                      error={validationErrors.productInterest}
                    />
                    <FloatingLabelInput
                      label="Email"
                      validationType="email"
                      value={newLeadEmail}
                      onChange={e => {
                        setNewLeadEmail(e.target.value);
                        if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: "" }));
                      }}
                      required
                      error={validationErrors.email}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                      onClick={enhanceLead}
                      title="Enhance (Full Form)"
                    >
                      <Maximize2 size={14} />
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-500"
                        onClick={cancelAdding}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs gap-1"
                        onClick={saveInlineLead}
                        disabled={isAddingLoading}
                      >
                        {isAddingLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeLead && (
          <div className="w-80 rotate-3 cursor-grabbing">
            <LeadsCard lead={activeLead} />
          </div>
        )}
      </DragOverlay>

      <LostReasonModal
        open={isLostModalOpen}
        onConfirm={handleLostReasonSubmit}
        onCancel={handleLostCancel}
        loading={isLostUpdating}
      />
    </DndContext>
  );
}

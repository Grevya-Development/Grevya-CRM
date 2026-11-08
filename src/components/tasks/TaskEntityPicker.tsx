import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export type TaskEntityType = 'customer' | 'lead';

interface CustomerRow {
  id: string;
  name: string | null;
}

interface LeadRow {
  id: string;
  lead_name: string | null;
  subject: string | null;
  lead_number: string | null;
}

interface EntityOption {
  id: string;
  name: string;
}

interface TaskEntityPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen record; the caller then opens the existing task form. */
  onSelect: (entityType: TaskEntityType, entityId: string) => void;
}

/**
 * Tasks in crm_tasks always belong to a customer or a lead (entity_type/entity_id),
 * so before reusing the existing "Schedule Task" form we ask which record it is for.
 */
export function TaskEntityPicker({ open, onOpenChange, onSelect }: TaskEntityPickerProps) {
  const [entityType, setEntityType] = useState<TaskEntityType>('customer');
  const [entityId, setEntityId] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setEntityId('');
      try {
        if (entityType === 'customer') {
          const { data, error } = await supabase
            .from('crm_customers')
            .select('id, name')
            .order('name', { ascending: true });
          if (error) throw error;
          if (!cancelled) {
            setOptions(
              ((data || []) as CustomerRow[]).map((c) => ({ id: c.id, name: c.name || 'Unnamed customer' }))
            );
          }
        } else {
          const { data, error } = await supabase
            .from('crm_leads')
            .select('id, lead_name, subject, lead_number')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (!cancelled) {
            setOptions(
              ((data || []) as LeadRow[]).map((l) => ({
                id: l.id,
                name: l.lead_name || l.subject || l.lead_number || 'Unnamed lead',
              }))
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setOptions([]);
          const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
          toast.error(message || `Failed to load ${entityType}s`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, entityType]);

  const handleContinue = () => {
    if (!entityId) return;
    onSelect(entityType, entityId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            Choose the customer or lead this task is for.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select
            value={entityType}
            onValueChange={(v) => setEntityType(v as TaskEntityType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Related to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityId} onValueChange={setEntityId} disabled={loading}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loading
                    ? 'Loading...'
                    : options.length === 0
                      ? `No ${entityType}s found`
                      : `Select a ${entityType}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!entityId}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

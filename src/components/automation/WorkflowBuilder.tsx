import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ArrowDown,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Clock,
  GitBranch,
  Zap,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  steps: WorkflowStep[];
}

const triggers = [
  { id: 'new_contact', label: 'New Contact Created', icon: Plus },
  { id: 'Leads_stage_change', label: 'Leads Stage Changed', icon: GitBranch },
  { id: 'task_due', label: 'Task Due', icon: Clock },
  { id: 'email_received', label: 'Email Received', icon: Mail },
];

const actions = [
  { id: 'send_email', label: 'Send Email', icon: Mail },
  { id: 'send_sms', label: 'Send SMS', icon: MessageSquare },
  { id: 'send_whatsapp', label: 'Send WhatsApp', icon: MessageSquare },
  { id: 'create_task', label: 'Create Task', icon: Plus },
  { id: 'notify', label: 'Send Notification', icon: Bell },
  { id: 'make_call', label: 'Schedule Call', icon: Phone },
];

export const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'New Lead Welcome',
      isActive: true,
      steps: [
        { id: 's1', type: 'trigger', config: { trigger: 'new_contact' } },
        { id: 's2', type: 'delay', config: { duration: 5, unit: 'minutes' } },
        { id: 's3', type: 'action', config: { action: 'send_email', template: 'welcome' } },
      ],
    },
    {
      id: '2',
      name: 'Leads Follow-up',
      isActive: true,
      steps: [
        { id: 's1', type: 'trigger', config: { trigger: 'Leads_stage_change' } },
        { id: 's2', type: 'condition', config: { field: 'stage', operator: 'equals', value: 'proposal' } },
        { id: 's3', type: 'action', config: { action: 'send_whatsapp', message: 'Follow-up on proposal' } },
      ],
    },
  ]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddStep = (type: WorkflowStep['type']) => {
    if (!selectedWorkflow) return;
    
    const newStep: WorkflowStep = {
      id: `s${Date.now()}`,
      type,
      config: {},
    };
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep],
    });
  };

  const handleRemoveStep = (stepId: string) => {
    if (!selectedWorkflow) return;
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.filter(s => s.id !== stepId),
    });
  };

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) return;
    
    setWorkflows(prev => 
      prev.map(w => w.id === selectedWorkflow.id ? selectedWorkflow : w)
    );
    toast.success('Workflow saved successfully');
    setIsEditing(false);
  };

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `w${Date.now()}`,
      name: 'New Workflow',
      isActive: false,
      steps: [],
    };
    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const getStepIcon = (step: WorkflowStep) => {
    if (step.type === 'trigger') {
      const trigger = triggers.find(t => t.id === step.config.trigger);
      return trigger?.icon || Zap;
    }
    if (step.type === 'action') {
      const action = actions.find(a => a.id === step.config.action);
      return action?.icon || Zap;
    }
    if (step.type === 'delay') return Clock;
    if (step.type === 'condition') return GitBranch;
    return Zap;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Workflows</CardTitle>
            <Button size="sm" onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              onClick={() => {
                setSelectedWorkflow(workflow);
                setIsEditing(false);
              }}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-colors',
                selectedWorkflow?.id === workflow.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{workflow.name}</span>
                <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {workflow.steps.length} steps
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedWorkflow ? selectedWorkflow.name : 'Select a Workflow'}
            </CardTitle>
            {selectedWorkflow && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveWorkflow}>Save</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedWorkflow ? (
            <div className="space-y-4">
              {isEditing && (
                <div className="space-y-2">
                  <Label>Workflow Name</Label>
                  <Input
                    value={selectedWorkflow.name}
                    onChange={(e) => setSelectedWorkflow({
                      ...selectedWorkflow,
                      name: e.target.value,
                    })}
                  />
                </div>
              )}

              <div className="space-y-2">
                {selectedWorkflow.steps.map((step, index) => {
                  const Icon = getStepIcon(step);
                  return (
                    <div key={step.id}>
                      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                        {isEditing && <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />}
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center',
                          step.type === 'trigger' && 'bg-green-500/10 text-green-500',
                          step.type === 'action' && 'bg-primary/10 text-primary',
                          step.type === 'condition' && 'bg-orange-500/10 text-orange-500',
                          step.type === 'delay' && 'bg-purple-500/10 text-purple-500',
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">{step.type}</Badge>
                            {step.type === 'trigger' && step.config.trigger && (
                              <span className="text-sm">{triggers.find(t => t.id === step.config.trigger)?.label}</span>
                            )}
                            {step.type === 'action' && step.config.action && (
                              <span className="text-sm">{actions.find(a => a.id === step.config.action)?.label}</span>
                            )}
                            {step.type === 'delay' && step.config.duration && (
                              <span className="text-sm">Wait {step.config.duration} {step.config.unit}</span>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {index < selectedWorkflow.steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isEditing && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleAddStep('trigger')}>
                    <Zap className="h-4 w-4 mr-1" />
                    Add Trigger
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddStep('condition')}>
                    <GitBranch className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddStep('delay')}>
                    <Clock className="h-4 w-4 mr-1" />
                    Add Delay
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddStep('action')}>
                    <Mail className="h-4 w-4 mr-1" />
                    Add Action
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a workflow to view or edit</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

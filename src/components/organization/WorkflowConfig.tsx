import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Workflow, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowRight, 
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Settings2
} from 'lucide-react';
import { workflowRules, WorkflowRule, organizationMembers } from '@/data/organizationData';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const typeConfig = {
  approval: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Approval' },
  escalation: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Escalation' },
  routing: { icon: GitBranch, color: 'text-primary', bg: 'bg-primary/10', label: 'Routing' }
};

interface WorkflowCardProps {
  rule: WorkflowRule;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (rule: WorkflowRule) => void;
  onDelete: (id: string) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ rule, onToggle, onEdit, onDelete }) => {
  const config = typeConfig[rule.type];
  const Icon = config.icon;
  const assignees = rule.assignees
    .map(id => organizationMembers.find(m => m.id === id)?.name)
    .filter(Boolean);

  return (
    <Card className={cn('transition-opacity', !rule.isActive && 'opacity-60')}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
            <Icon className={cn('h-6 w-6', config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{rule.name}</h4>
                <Badge variant="outline" className="text-xs">{config.label}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(checked) => onToggle(rule.id, checked)}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(rule)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Trigger:</span>
                <Badge variant="secondary">{rule.trigger}</Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {rule.conditions.map((condition, i) => (
                  <React.Fragment key={i}>
                    <Badge variant="outline" className="text-xs">
                      {condition}
                    </Badge>
                    {i < rule.conditions.length - 1 && (
                      <span className="text-xs text-muted-foreground">AND</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {rule.actions.map((action, i) => (
                    <Badge key={i} className="bg-primary/10 text-primary text-xs">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Assignees:</span>
                <span>{assignees.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const WorkflowConfig: React.FC = () => {
  const [rules, setRules] = useState<WorkflowRule[]>(workflowRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  const handleToggle = (id: string, active: boolean) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: active } : r));
    toast.success(active ? 'Workflow activated' : 'Workflow deactivated');
  };

  const handleEdit = (rule: WorkflowRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success('Workflow deleted');
  };

  const handleSave = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    toast.success('Workflow saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflow Configuration
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Workflow' : 'Create New Workflow'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure triggers, conditions, and actions for your workflow automation.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Workflow Name</Label>
                      <Input 
                        placeholder="e.g., Large Leads Approval" 
                        defaultValue={editingRule?.name}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select defaultValue={editingRule?.type || 'approval'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approval">Approval</SelectItem>
                          <SelectItem value="escalation">Escalation</SelectItem>
                          <SelectItem value="routing">Routing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Trigger</Label>
                    <Input 
                      placeholder="e.g., Leads value > $100,000" 
                      defaultValue={editingRule?.trigger}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Conditions (one per line)</Label>
                    <Textarea 
                      placeholder="Enter conditions..."
                      rows={3}
                      defaultValue={editingRule?.conditions.join('\n')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Actions (one per line)</Label>
                    <Textarea 
                      placeholder="Enter actions..."
                      rows={3}
                      defaultValue={editingRule?.actions.join('\n')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Assignees</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team members" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationMembers.filter(m => m.level !== 'individual').map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name} - {m.role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingRule ? 'Save Changes' : 'Create Workflow'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                    <p className="text-2xl font-bold">
                      {rules.filter(r => r.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rules</p>
                    <p className="text-2xl font-bold">{rules.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Triggered Today</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Workflow className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rules.map(rule => (
          <WorkflowCard
            key={rule.id}
            rule={rule}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

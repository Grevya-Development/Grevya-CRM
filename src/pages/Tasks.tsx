import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/supabase/supabaseClient';
import ActivityPopup from '@/components/contacts/ScheduleTask';
import { TaskEntityPicker, TaskEntityType } from '@/components/tasks/TaskEntityPicker';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  CheckSquare,
  Clock,
  User,
  AlertCircle,
  CircleCheck,
  Building2,
  Target,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import log from '@/utils/logger';

/**
 * crm_tasks.status values used across the app (see ScheduleTask.tsx):
 *   'pending'   -> Pending tab (also the fallback for null/unknown values)
 *   'start'     -> In Progress tab
 *   'completed' -> Completed tab
 */
const STATUS_PENDING = 'pending';
const STATUS_IN_PROGRESS = 'start';
const STATUS_COMPLETED = 'completed';

type StatusBucket = 'pending' | 'in-progress' | 'completed';

/**
 * crm_tasks has no priority column, so the "priority" slot shows urgency derived
 * from due_date instead (same overdue rule as TaskListView: day-precision, not completed).
 */
type DueBucket = 'overdue' | 'today' | 'upcoming' | 'past' | 'none';

interface TaskRow {
  id: string;
  title: string | null;
  description: string | null;
  due_date: string | null;
  status: string | null;
  assigned_to: string | null;
  entity_type: string | null;
  entity_id: string | null;
  customer_id: string | null;
  created_at: string;
  crm_salesperson?: { name: string | null } | null;
}

interface CustomerNameRow {
  id: string;
  name: string | null;
}

interface LeadNameRow {
  id: string;
  lead_name: string | null;
  subject: string | null;
  lead_number: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: string;
  assigneeName: string | null;
  entityType: TaskEntityType | null;
  entityId: string | null;
  entityName: string | null;
}

const statusBucket = (status: string): StatusBucket => {
  if (status === STATUS_COMPLETED) return 'completed';
  if (status === STATUS_IN_PROGRESS) return 'in-progress';
  return 'pending';
};

const statusLabels: Record<StatusBucket, string> = {
  pending: 'pending',
  'in-progress': 'in progress',
  completed: 'completed',
};

const statusColors: Record<StatusBucket, string> = {
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/20',
};

const dueBadges: Partial<Record<DueBucket, { label: string; className: string }>> = {
  overdue: {
    label: 'Overdue',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  today: {
    label: 'Due today',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getDueBucket = (task: TaskItem, today: Date): DueBucket => {
  if (!task.dueDate) return 'none';
  const due = startOfDay(new Date(task.dueDate));
  if (Number.isNaN(due.getTime())) return 'none';
  if (due.getTime() === today.getTime()) return 'today';
  if (due > today) return 'upcoming';
  return task.status === STATUS_COMPLETED ? 'past' : 'overdue';
};

const formatDue = (dueDate: string | null) => {
  if (!dueDate) return 'No due date';
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return 'No due date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface TaskCardProps {
  task: TaskItem;
  dueBucket: DueBucket;
  onToggle: (task: TaskItem, checked: boolean) => void;
  onOpenEntity: (task: TaskItem) => void;
}

function TaskCard({ task, dueBucket, onToggle, onOpenEntity }: TaskCardProps) {
  const bucket = statusBucket(task.status);
  const isCompleted = bucket === 'completed';
  const dueBadge = isCompleted ? undefined : dueBadges[dueBucket];
  const EntityIcon = task.entityType === 'lead' ? Target : Building2;

  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-all duration-200 animate-fade-in">
      <div className="flex items-start gap-4">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle(task, checked === true)}
          aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4
              className={cn(
                'font-medium',
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              )}
            >
              {task.title}
            </h4>
            <div className="flex items-center gap-2">
              {dueBadge && (
                <Badge variant="outline" className={cn('text-xs', dueBadge.className)}>
                  {dueBadge.label}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', statusColors[bucket])}
              >
                {statusLabels[bucket]}
              </Badge>
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {task.entityType && task.entityId && (
              <button
                type="button"
                onClick={() => onOpenEntity(task)}
                className="flex items-center gap-1 hover:text-primary hover:underline"
                title={`Open ${task.entityType}`}
              >
                <EntityIcon className="h-3.5 w-3.5" />
                <span className="capitalize">{task.entityType}:</span>
                <span>{task.entityName || 'Unknown'}</span>
              </button>
            )}
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{task.assigneeName || 'Unassigned'}</span>
            </div>
            <div
              className={cn(
                'flex items-center gap-1',
                dueBucket === 'overdue' && !isCompleted && 'text-destructive'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDue(task.dueDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dueFilter, setDueFilter] = useState('all');

  // "Add Task": pick the customer/lead, then reuse the existing Schedule Task form.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newTaskEntity, setNewTaskEntity] = useState<{
    type: TaskEntityType;
    id: string;
  } | null>(null);

  const fetchTasks = useCallback(async () => {
    log.debug('Tasks: fetchTasks called');
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*, crm_salesperson(name)')
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;

      const rows = (data || []) as TaskRow[];

      const resolveType = (row: TaskRow): TaskEntityType | null => {
        if (row.entity_type === 'customer' || row.entity_type === 'lead') return row.entity_type;
        return row.customer_id ? 'customer' : null;
      };
      const resolveId = (row: TaskRow) => row.entity_id || row.customer_id || null;

      // entity_id is polymorphic (no FK), so related names are looked up separately.
      const customerIds = new Set<string>();
      const leadIds = new Set<string>();
      rows.forEach((row) => {
        const type = resolveType(row);
        const id = resolveId(row);
        if (!id) return;
        if (type === 'customer') customerIds.add(id);
        if (type === 'lead') leadIds.add(id);
      });

      const [customersRes, leadsRes] = await Promise.all([
        customerIds.size
          ? supabase.from('crm_customers').select('id, name').in('id', [...customerIds])
          : Promise.resolve({ data: [], error: null }),
        leadIds.size
          ? supabase
              .from('crm_leads')
              .select('id, lead_name, subject, lead_number')
              .in('id', [...leadIds])
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (customersRes.error) log.error('Tasks: customer lookup failed', customersRes.error);
      if (leadsRes.error) log.error('Tasks: lead lookup failed', leadsRes.error);

      const names = new Map<string, string>();
      ((customersRes.data || []) as CustomerNameRow[]).forEach((c) => {
        if (c.name) names.set(`customer:${c.id}`, c.name);
      });
      ((leadsRes.data || []) as LeadNameRow[]).forEach((l) => {
        const name = l.lead_name || l.subject || l.lead_number;
        if (name) names.set(`lead:${l.id}`, name);
      });

      setTasks(
        rows.map((row) => {
          const entityType = resolveType(row);
          const entityId = resolveId(row);
          return {
            id: row.id,
            title: row.title || 'Untitled task',
            description: row.description || '',
            dueDate: row.due_date,
            status: row.status || STATUS_PENDING,
            assigneeName: row.crm_salesperson?.name || null,
            entityType,
            entityId,
            entityName: entityType && entityId ? names.get(`${entityType}:${entityId}`) || null : null,
          };
        })
      );
      log.info('Tasks: fetchTasks successful');
    } catch (error) {
      log.error('Tasks: fetchTasks error', error);
      const message =
        (error instanceof Error ? error.message : (error as { message?: string })?.message) ||
        'Failed to load tasks';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = useCallback(async (task: TaskItem, checked: boolean) => {
    const previousStatus = task.status;
    const nextStatus = checked ? STATUS_COMPLETED : STATUS_PENDING;
    if (previousStatus === nextStatus) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));

    const { error } = await supabase
      .from('crm_tasks')
      .update({ status: nextStatus })
      .eq('id', task.id);

    if (error) {
      log.error('Tasks: status update failed', error);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: previousStatus } : t))
      );
      toast.error(error.message || 'Failed to update task');
    }
  }, []);

  const handleOpenEntity = useCallback(
    (task: TaskItem) => {
      if (!task.entityId) return;
      if (task.entityType === 'customer') navigate(`/contacts/view/${task.entityId}`);
      else if (task.entityType === 'lead') navigate(`/leads/${task.entityId}`);
    },
    [navigate]
  );

  const todayTime = startOfDay(new Date()).getTime();

  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const today = new Date(todayTime);
    return tasks
      .map((task) => ({ task, dueBucket: getDueBucket(task, today) }))
      .filter(({ task, dueBucket }) => {
        if (dueFilter !== 'all' && dueBucket !== dueFilter) return false;
        if (!term) return true;
        return [task.title, task.description, task.assigneeName, task.entityName]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(term));
      });
  }, [tasks, searchTerm, dueFilter, todayTime]);

  const pendingTasks = filteredTasks.filter(({ task }) => statusBucket(task.status) === 'pending');
  const inProgressTasks = filteredTasks.filter(
    ({ task }) => statusBucket(task.status) === 'in-progress'
  );
  const completedTasks = filteredTasks.filter(
    ({ task }) => statusBucket(task.status) === 'completed'
  );

  // Stat cards reflect all tasks; tab counts reflect the current search/filter.
  const totalCounts = useMemo(() => {
    const counts = { pending: 0, 'in-progress': 0, completed: 0 };
    tasks.forEach((t) => {
      counts[statusBucket(t.status)]++;
    });
    return counts;
  }, [tasks]);

  const renderList = (list: typeof filteredTasks) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tasks...
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Couldn't load tasks.{' '}
          <button type="button" onClick={fetchTasks} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      );
    }
    if (tasks.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <CheckSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground opacity-60" />
          <p className="text-sm font-medium text-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Use "Add Task" to schedule one for a customer or lead.
          </p>
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No tasks match your filters
        </div>
      );
    }
    return list.map(({ task, dueBucket }) => (
      <TaskCard
        key={task.id}
        task={task}
        dueBucket={dueBucket}
        onToggle={handleToggle}
        onOpenEntity={handleOpenEntity}
      />
    ));
  };

  const statValue = (n: number) => (loading ? '—' : n);

  return (
    <div className="min-h-screen">
      <Header
        title="Tasks"
        showAddButton
        addButtonLabel="Add Task"
        onAdd={() => setPickerOpen(true)}
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="relative overflow-hidden rounded-lg border border-violet-200/50 bg-violet-100/30 dark:border-violet-800/50 dark:bg-violet-900/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Tasks</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{statValue(tasks.length)}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-violet-200/50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                All scheduled
              </span>
            </div>
            <CheckSquare className="absolute right-2 bottom-2 h-5 w-5 text-violet-500 opacity-40" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-orange-200/50 bg-orange-100/30 dark:border-orange-800/50 dark:bg-orange-900/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pending</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{statValue(totalCounts.pending)}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-orange-200/50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                To do list
              </span>
            </div>
            <Clock className="absolute right-2 bottom-2 h-5 w-5 text-orange-500 opacity-40" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/10 dark:border-primary/50 dark:bg-primary/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">In Progress</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{statValue(totalCounts['in-progress'])}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-primary/20 dark:bg-primary/40 text-primary">
                Working on it
              </span>
            </div>
            <AlertCircle className="absolute right-2 bottom-2 h-5 w-5 text-primary opacity-40" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-emerald-200/50 bg-emerald-100/30 dark:border-emerald-800/50 dark:bg-emerald-900/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Completed</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{statValue(totalCounts.completed)}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-emerald-200/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Finished
              </span>
            </div>
            <CircleCheck className="absolute right-2 bottom-2 h-5 w-5 text-emerald-500 opacity-40" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={dueFilter} onValueChange={setDueFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by due date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Due Dates</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Due Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="none">No Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {renderList(filteredTasks)}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {renderList(pendingTasks)}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-3">
            {renderList(inProgressTasks)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {renderList(completedTasks)}
          </TabsContent>
        </Tabs>
      </div>

      <TaskEntityPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(type, id) => {
          setPickerOpen(false);
          setNewTaskEntity({ type, id });
        }}
      />

      <ActivityPopup
        isOpen={newTaskEntity !== null}
        onClose={() => setNewTaskEntity(null)}
        entityId={newTaskEntity?.id ?? ''}
        entityType={newTaskEntity?.type ?? 'customer'}
        taskData={null}
        onTaskCreate={fetchTasks}
      />
    </div>
  );
}

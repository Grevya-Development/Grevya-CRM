import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { tasks, Task } from '@/data/sampleData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  Clock,
  User,
  AlertCircle,
  CircleCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/20',
};

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckSquare,
};

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const TaskCard = ({ task }: { task: Task }) => {
    const Icon = typeIcons[task.type];
    return (
      <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-all duration-200 animate-fade-in">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={task.status === 'completed'}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4
                className={cn(
                  'font-medium',
                  task.status === 'completed'
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground'
                )}
              >
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize', priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize', statusColors[task.status])}
                >
                  {task.status.replace('-', ' ')}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{task.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="min-h-screen">
      <Header
        title="Tasks"
        showAddButton
        addButtonLabel="Add Task"
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="relative overflow-hidden rounded-lg border border-violet-200/50 bg-violet-100/30 dark:border-violet-800/50 dark:bg-violet-900/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Tasks</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{tasks.length}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-violet-200/50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                All scheduled
              </span>
            </div>
            <CheckSquare className="absolute right-2 bottom-2 h-5 w-5 text-violet-500 opacity-40" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-orange-200/50 bg-orange-100/30 dark:border-orange-800/50 dark:bg-orange-900/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pending</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{pendingTasks.length}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-orange-200/50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                To do list
              </span>
            </div>
            <Clock className="absolute right-2 bottom-2 h-5 w-5 text-orange-500 opacity-40" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/10 dark:border-primary/50 dark:bg-primary/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">In Progress</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{inProgressTasks.length}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-primary/20 dark:bg-primary/40 text-primary">
                Working on it
              </span>
            </div>
            <AlertCircle className="absolute right-2 bottom-2 h-5 w-5 text-primary opacity-40" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-emerald-200/50 bg-emerald-100/30 dark:border-emerald-800/50 dark:bg-emerald-900/10 p-2">
            <div className="relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Completed</p>
              <p className="text-lg font-semibold text-foreground leading-tight">{completedTasks.length}</p>
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-3">
            {inProgressTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

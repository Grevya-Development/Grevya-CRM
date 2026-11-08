import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function TasksList() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      // Find salesperson record linked to auth user
      const { data: salesperson } = await supabase
        .from('crm_salesperson')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle(); // users without a salesperson record are fine

      let query = supabase
        .from('crm_tasks')
        .select('*, crm_salesperson(name)')
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(5);

      if (salesperson?.id) {
        query = query.eq('assigned_to', salesperson.id);
      }

      const { data, error } = await query;
      if (!error && data) setTasks(data);
    };

    fetchTasks();
  }, []);

  const getStatusColor = (task: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);

    if (task.status === 'completed') return 'bg-green-100 text-green-700';
    if (task.status === 'start') return 'bg-blue-100 text-blue-700';
    if (due < today) return 'bg-destructive/10 text-destructive border-destructive/20';
    return 'bg-warning/10 text-warning border-warning/20';
  };

  return (
    <div className="rounded-lg bg-card p-4 shadow-sm border border-border animate-slide-up h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Task Update</h3>
        <a href="/tasks" className="text-sm text-primary hover:underline">View All</a>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/50"
          >
            <Checkbox
              id={task.id}
              checked={task.status === 'completed'}
              className="border-muted-foreground h-4 w-4"
            />
            <div className="flex-1 min-w-0">
              <label htmlFor={task.id} className="text-sm font-medium text-foreground cursor-pointer block mb-0.5 truncate">
                {task.title}
              </label>
              <p className="text-xs text-muted-foreground">
                {task.crm_salesperson?.name || 'Unassigned'} • Due{' '}
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <Badge variant="outline" className={cn('text-xs capitalize px-2 py-0.5 shrink-0', getStatusColor(task))}>
              {task.status}
            </Badge>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
        )}
      </div>
    </div>
  );
}
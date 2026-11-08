import { activities } from '@/data/sampleData';
import { Phone, Mail, Calendar, FileText, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  Leads: DollarSign,
};

const colorMap = {
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  Leads: 'bg-success/10 text-success',
};

export function ActivityFeed() {
  return (
    <div className="rounded-lg bg-card p-4 shadow-sm border border-border animate-slide-up h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="space-y-2.5">
        {activities.slice(0, 5).map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className={cn('rounded-lg p-2', colorMap[activity.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate mb-0.5">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.relatedTo} • {activity.user}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

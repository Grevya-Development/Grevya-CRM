import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { tasks, activities } from '@/data/sampleData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: CalendarIcon,
  task: CheckSquare,
};

const typeColors = {
  call: 'bg-info/10 text-info border-info/20',
  email: 'bg-primary/10 text-primary border-primary/20',
  meeting: 'bg-warning/10 text-warning border-warning/20',
  task: 'bg-success/10 text-success border-success/20',
};

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedDateTasks = tasks.filter((task) => {
    const taskDate = new Date(task.dueDate);
    return (
      date &&
      taskDate.getDate() === date.getDate() &&
      taskDate.getMonth() === date.getMonth() &&
      taskDate.getFullYear() === date.getFullYear()
    );
  });

  const upcomingEvents = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.dueDate,
      type: t.type,
      time: '09:00 AM',
    })),
  ].slice(0, 5);

  return (
    <div className="min-h-screen">
      <Header
        title="Calendar"
        showAddButton
        addButtonLabel="Add Event"
      />
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md w-full"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4 w-full',
                caption: 'hidden',
                table: 'w-full border-collapse',
                head_row: 'flex w-full',
                head_cell: 'text-muted-foreground rounded-md w-full font-medium text-sm py-2',
                row: 'flex w-full mt-2',
                cell: 'h-14 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: cn(
                  'h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors'
                ),
                day_selected:
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day_today: 'bg-accent text-accent-foreground font-semibold',
                day_outside: 'text-muted-foreground opacity-50',
                day_disabled: 'text-muted-foreground opacity-50',
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {date
                  ? date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'Select a date'}
              </h3>
              {selectedDateTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => {
                    const Icon = typeIcons[task.type];
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            typeColors[task.type]
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {task.type} • {task.assignee}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No events scheduled for this day
                </p>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const Icon = typeIcons[event.type as keyof typeof typeIcons];
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={cn(
                          'rounded-lg p-2',
                          typeColors[event.type as keyof typeof typeColors]
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

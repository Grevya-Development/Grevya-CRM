import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DayContentProps } from 'react-day-picker';
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Header } from '@/components/layout/Header';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase/supabaseClient';
import {
  type CalendarEvent,
  type CalendarEventType,
  type EntityNames,
  type MeetingRow,
  type TaskRow,
  meetingToEvent,
  sortEvents,
  taskToEvent,
} from '@/components/calendar/calendarEvents';

const typeIcons: Record<CalendarEventType, typeof CalendarIcon> = {
  meeting: CalendarIcon,
  task: CheckSquare,
};

const typeColors: Record<CalendarEventType, string> = {
  meeting: 'bg-warning/10 text-warning border-warning/20',
  task: 'bg-success/10 text-success border-success/20',
};

const typeDotColors: Record<CalendarEventType, string> = {
  meeting: 'bg-warning',
  task: 'bg-success',
};

const MEETING_COLUMNS =
  'id, entity_id, entity_type, subject, description, start_time, end_time, location, video_url, duration';
const TASK_COLUMNS =
  'id, entity_id, entity_type, title, description, due_date, status, assigned_to, crm_salesperson(name)';

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * Tasks are scoped to the signed-in user's salesperson record, like the dashboard TasksList.
 * Users without a salesperson record see all tasks.
 */
async function getMySalespersonId(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from('crm_salesperson')
    .select('id')
    .eq('user_id', uid)
    .maybeSingle();
  return data?.id ?? null;
}

/** Looks up display names for the customers/leads that meetings and tasks point at. */
async function fetchEntityNames(rows: { entity_id: string | null; entity_type: string | null }[]): Promise<EntityNames> {
  const idsOf = (type: string) =>
    [...new Set(rows.filter((r) => r.entity_type === type && r.entity_id).map((r) => r.entity_id as string))];
  const customerIds = idsOf('customer');
  const leadIds = idsOf('lead');
  const names: EntityNames = {};

  const [customers, leads] = await Promise.all([
    customerIds.length
      ? supabase.from('crm_customers').select('id, name').in('id', customerIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    leadIds.length
      ? supabase.from('crm_leads').select('id, lead_name, subject').in('id', leadIds)
      : Promise.resolve({ data: [] as { id: string; lead_name: string | null; subject: string | null }[] }),
  ]);

  (customers.data ?? []).forEach((c: { id: string; name: string | null }) => {
    if (c.name) names[c.id] = c.name;
  });
  (leads.data ?? []).forEach((l: { id: string; lead_name: string | null; subject: string | null }) => {
    const label = l.lead_name || l.subject;
    if (label) names[l.id] = label;
  });
  return names;
}

function toEvents(meetings: MeetingRow[], tasks: TaskRow[], names: EntityNames): CalendarEvent[] {
  return sortEvents([
    ...meetings.map((m) => meetingToEvent(m, names)),
    ...tasks.map((t) => taskToEvent(t, names)),
  ].filter((e): e is CalendarEvent => e !== null));
}

export default function Calendar() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = format(currentMonth, 'yyyy-MM');

  // Meetings and tasks for the visible grid (including leading/trailing days of adjacent months).
  useEffect(() => {
    let cancelled = false;
    const rangeStart = startOfWeek(startOfMonth(currentMonth));
    const rangeEnd = endOfWeek(endOfMonth(currentMonth));

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const salespersonId = await getMySalespersonId();

        let taskQuery = supabase
          .from('crm_tasks')
          .select(TASK_COLUMNS)
          .gte('due_date', rangeStart.toISOString())
          .lte('due_date', rangeEnd.toISOString())
          .order('due_date', { ascending: true });
        if (salespersonId) taskQuery = taskQuery.eq('assigned_to', salespersonId);

        const [meetingsRes, tasksRes] = await Promise.all([
          supabase
            .from('crm_meetings')
            .select(MEETING_COLUMNS)
            .gte('start_time', rangeStart.toISOString())
            .lte('start_time', rangeEnd.toISOString())
            .order('start_time', { ascending: true }),
          taskQuery,
        ]);
        if (meetingsRes.error) throw meetingsRes.error;
        if (tasksRes.error) throw tasksRes.error;

        const meetings = (meetingsRes.data ?? []) as MeetingRow[];
        const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
        const names = await fetchEntityNames([...meetings, ...tasks]);
        if (!cancelled) setEvents(toEvents(meetings, tasks, names));
      } catch (err) {
        console.error('Failed to load calendar events', err);
        if (!cancelled) {
          setEvents([]);
          setError('Could not load meetings and tasks.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  // Next few meetings / open tasks from today onwards, independent of the month being viewed.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingUpcoming(true);
      try {
        const salespersonId = await getMySalespersonId();
        const now = new Date();

        let taskQuery = supabase
          .from('crm_tasks')
          .select(TASK_COLUMNS)
          .gte('due_date', startOfDay(now).toISOString())
          .or('status.is.null,status.neq.completed')
          .order('due_date', { ascending: true })
          .limit(5);
        if (salespersonId) taskQuery = taskQuery.eq('assigned_to', salespersonId);

        const [meetingsRes, tasksRes] = await Promise.all([
          supabase
            .from('crm_meetings')
            .select(MEETING_COLUMNS)
            .gte('start_time', now.toISOString())
            .order('start_time', { ascending: true })
            .limit(5),
          taskQuery,
        ]);
        if (meetingsRes.error) throw meetingsRes.error;
        if (tasksRes.error) throw tasksRes.error;

        const meetings = (meetingsRes.data ?? []) as MeetingRow[];
        const tasks = (tasksRes.data ?? []) as unknown as TaskRow[];
        const names = await fetchEntityNames([...meetings, ...tasks]);
        if (!cancelled) setUpcomingEvents(toEvents(meetings, tasks, names).slice(0, 5));
      } catch (err) {
        console.error('Failed to load upcoming events', err);
        if (!cancelled) setUpcomingEvents([]);
      } finally {
        if (!cancelled) setLoadingUpcoming(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const eventTypesByDay = useMemo(() => {
    const map = new Map<string, Set<CalendarEventType>>();
    events.forEach((e) => {
      const key = dayKey(e.date);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(e.type);
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(
    () => (date ? events.filter((e) => isSameDay(e.date, date)) : []),
    [events, date]
  );

  const monthEventCount = useMemo(
    () => events.filter((e) => isSameMonth(e.date, currentMonth)).length,
    [events, currentMonth]
  );

  const calendarComponents = useMemo(
    () => ({
      DayContent: ({ date: day }: DayContentProps) => {
        const types = eventTypesByDay.get(dayKey(day));
        return (
          <div className="flex flex-col items-center gap-1">
            <span>{day.getDate()}</span>
            <span className="flex h-1.5 gap-1">
              {(['meeting', 'task'] as const).map((type) =>
                types?.has(type) ? (
                  <span key={type} className={cn('h-1.5 w-1.5 rounded-full', typeDotColors[type])} />
                ) : null
              )}
            </span>
          </div>
        );
      },
    }),
    [eventTypesByDay]
  );

  // Keep the selected day inside the visible month so the side panel matches the grid.
  const changeMonth = (month: Date) => {
    setCurrentMonth(month);
    if (!date || !isSameMonth(date, month)) {
      setDate(isSameMonth(new Date(), month) ? new Date() : startOfMonth(month));
    }
  };

  const renderEventRow = (event: CalendarEvent, compact: boolean) => {
    const Icon = typeIcons[event.type];
    const content = (
      <>
        <div className={cn('rounded-lg p-2', typeColors[event.type])}>
          <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium text-foreground text-sm',
              compact && 'truncate',
              event.status === 'completed' && 'line-through text-muted-foreground'
            )}
          >
            {event.title}
          </p>
          <p className={cn('text-xs text-muted-foreground', compact && 'truncate')}>
            {compact
              ? [format(event.date, 'MMM d'), event.time].filter(Boolean).join(' • ')
              : [event.type === 'meeting' ? 'Meeting' : 'Task', event.time, ...event.details]
                  .filter(Boolean)
                  .join(' • ')}
          </p>
        </div>
      </>
    );

    const rowClass = compact
      ? 'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors'
      : 'flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors';

    if (event.href) {
      const href = event.href;
      return (
        <button
          key={event.id}
          type="button"
          onClick={() => navigate(href)}
          className={cn(rowClass, 'w-full text-left cursor-pointer')}
        >
          {content}
        </button>
      );
    }
    return (
      <div key={event.id} className={rowClass}>
        {content}
      </div>
    );
  };

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
                  aria-label="Previous month"
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setDate(1);
                    prev.setMonth(prev.getMonth() - 1);
                    changeMonth(prev);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next month"
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setDate(1);
                    next.setMonth(next.getMonth() + 1);
                    changeMonth(next);
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
              onMonthChange={changeMonth}
              components={calendarComponents}
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
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {(['meeting', 'task'] as const).map((type) => (
                  <span key={type} className="flex items-center gap-1.5 capitalize">
                    <span className={cn('h-2 w-2 rounded-full', typeDotColors[type])} />
                    {type}s
                  </span>
                ))}
              </div>
              <span>
                {loading
                  ? 'Loading…'
                  : error
                    ? error
                    : monthEventCount === 0
                      ? 'No meetings or tasks this month'
                      : `${monthEventCount} ${monthEventCount === 1 ? 'event' : 'events'} this month`}
              </span>
            </div>
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
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
              ) : selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => renderEventRow(event, false))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {date ? 'No events scheduled for this day' : 'Pick a day to see its meetings and tasks'}
                </p>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Upcoming Events
              </h3>
              {loadingUpcoming ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => renderEventRow(event, true))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming meetings or tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

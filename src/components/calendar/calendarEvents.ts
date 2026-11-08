import { format, isValid, parseISO } from 'date-fns';

/** Row shape of public.crm_meetings (see supabase/migrations/20261108000000_initial_schema.sql). */
export interface MeetingRow {
  id: string;
  entity_id: string | null;
  entity_type: string | null; // 'customer' | 'lead'
  subject: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  video_url: string | null;
  duration: string | null; // 'HH:MM'
}

/** Row shape of public.crm_tasks, with the crm_salesperson(name) embed used across the app. */
export interface TaskRow {
  id: string;
  entity_id: string | null;
  entity_type: string | null; // 'customer' | 'lead'
  title: string | null;
  description: string | null;
  due_date: string | null; // written as 'YYYY-MM-DDTHH:MM'
  status: string | null; // 'start' | 'pending' | 'completed'
  assigned_to: string | null;
  crm_salesperson?: { name: string | null } | null;
}

export type CalendarEventType = 'meeting' | 'task';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: Date;
  /** Formatted start time, or null when the source only has a date. */
  time: string | null;
  /** Short secondary details (duration, location, assignee, status, related record). */
  details: string[];
  status: string | null;
  /** Route of the related record, if the event is linked to one. */
  href: string | null;
}

/** Names of related customers/leads keyed by id, used to label events. */
export type EntityNames = Record<string, string>;

/**
 * Parses a DB date/timestamp. parseISO treats date-only strings ('YYYY-MM-DD') as local
 * midnight (new Date() would treat them as UTC and shift the day west of Greenwich),
 * and honours offsets on full timestamps.
 */
export function parseDbDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

function formatDuration(duration: string | null): string | null {
  if (!duration) return null;
  const [h, m] = duration.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) && Number.isNaN(m)) return null;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.length ? parts.join(' ') : null;
}

const STATUS_LABELS: Record<string, string> = {
  start: 'In progress',
  pending: 'Pending',
  completed: 'Completed',
};

export function meetingHref(m: Pick<MeetingRow, 'entity_id' | 'entity_type'>): string | null {
  if (!m.entity_id) return null;
  // Customer meetings live on the customer's meeting schedule (same link AddContact uses).
  if (m.entity_type === 'customer') return `/meeting-schedule/${m.entity_id}`;
  if (m.entity_type === 'lead') return `/leads/${m.entity_id}`;
  return null;
}

export function taskHref(t: Pick<TaskRow, 'entity_id' | 'entity_type'>): string | null {
  if (!t.entity_id) return null;
  // Customer tasks are managed from the contact record's task tab.
  if (t.entity_type === 'customer') return `/contacts/view/${t.entity_id}`;
  if (t.entity_type === 'lead') return `/leads/${t.entity_id}`;
  return null;
}

export function meetingToEvent(m: MeetingRow, names: EntityNames = {}): CalendarEvent | null {
  const date = parseDbDate(m.start_time);
  if (!date) return null;
  const details = [
    formatDuration(m.duration),
    m.location || (m.video_url ? 'Video call' : null),
    m.entity_id ? names[m.entity_id] ?? null : null,
  ].filter((d): d is string => !!d);
  return {
    id: `meeting-${m.id}`,
    type: 'meeting',
    title: m.subject?.trim() || 'Untitled meeting',
    date,
    time: m.start_time && !isDateOnly(m.start_time) ? format(date, 'hh:mm a') : null,
    details,
    status: null,
    href: meetingHref(m),
  };
}

export function taskToEvent(t: TaskRow, names: EntityNames = {}): CalendarEvent | null {
  const date = parseDbDate(t.due_date);
  if (!date) return null;
  const details = [
    t.status ? STATUS_LABELS[t.status] ?? t.status : null,
    t.crm_salesperson?.name ?? null,
    t.entity_id ? names[t.entity_id] ?? null : null,
  ].filter((d): d is string => !!d);
  return {
    id: `task-${t.id}`,
    type: 'task',
    title: t.title?.trim() || 'Untitled task',
    date,
    time: t.due_date && !isDateOnly(t.due_date) ? format(date, 'hh:mm a') : null,
    details,
    status: t.status,
    href: taskHref(t),
  };
}

export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
}

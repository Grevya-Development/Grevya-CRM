import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Briefcase,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  Search,
  Mic,
  MicOff,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface TimelineEvent {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'Leads' | 'task';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  relatedTo: string;
  duration?: string;
  outcome?: string;
  attachments?: string[];
}

const sampleEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'call',
    title: 'Discovery Call',
    description: 'Discussed requirements and budget with Sarah Johnson. They are looking for an enterprise solution with custom integrations.',
    timestamp: '2024-12-08T14:30:00',
    user: 'John Smith',
    relatedTo: 'TechCorp Inc.',
    duration: '45 mins',
    outcome: 'Positive - Scheduled demo',
  },
  {
    id: '2',
    type: 'email',
    title: 'Proposal Sent',
    description: 'Sent detailed proposal for SaaS implementation including pricing breakdown and implementation timeline.',
    timestamp: '2024-12-08T11:00:00',
    user: 'Jane Doe',
    relatedTo: 'Innovate.io',
    attachments: ['proposal_v2.pdf', 'pricing_sheet.xlsx'],
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Executive Presentation',
    description: 'Presented solution to C-suite executives. CFO raised concerns about ROI timeline.',
    timestamp: '2024-12-07T15:00:00',
    user: 'John Smith',
    relatedTo: 'GlobalTech',
    duration: '1.5 hours',
    outcome: 'Neutral - Need ROI analysis',
  },
  {
    id: '4',
    type: 'Leads',
    title: 'Leads Closed - Won',
    description: 'Annual subscription renewed for ₹45,00,000. Customer upgraded to premium tier.',
    timestamp: '2024-12-06T16:45:00',
    user: 'Mike Johnson',
    relatedTo: 'StartupX',
  },
  {
    id: '5',
    type: 'note',
    title: 'Budget Confirmed',
    description: 'Client confirmed Q1 2025 budget allocation. Ready to proceed with negotiations.',
    timestamp: '2024-12-06T10:15:00',
    user: 'Jane Doe',
    relatedTo: 'Enterprise Co',
  },
  {
    id: '6',
    type: 'task',
    title: 'Follow-up Completed',
    description: 'Sent meeting summary and next steps. Waiting for client response.',
    timestamp: '2024-12-05T09:30:00',
    user: 'John Smith',
    relatedTo: 'Solutions Net',
  },
];

const getEventIcon = (type: string) => {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    case 'note': return FileText;
    case 'Leads': return Briefcase;
    case 'task': return CheckCircle;
    default: return MessageSquare;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'call': return 'bg-primary/80';
    case 'email': return 'bg-purple-500';
    case 'meeting': return 'bg-green-500';
    case 'note': return 'bg-yellow-500';
    case 'Leads': return 'bg-primary';
    case 'task': return 'bg-orange-500';
    default: return 'bg-muted-foreground';
  }
};

export const ActivityTimeline: React.FC = () => {
  const [events, setEvents] = useState(sampleEvents);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    type: 'note' as const,
    title: '',
    description: '',
    relatedTo: '',
  });

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useVoiceInput();

  React.useEffect(() => {
    if (transcript) {
      setNewEvent(prev => ({
        ...prev,
        description: prev.description + transcript,
      }));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesSearch = search === '' ||
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase()) ||
      event.relatedTo.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const event: TimelineEvent = {
      id: Date.now().toString(),
      ...newEvent,
      timestamp: new Date().toISOString(),
      user: 'Current User',
    };

    setEvents([event, ...events]);
    setNewEvent({ type: 'note', title: '', description: '', relatedTo: '' });
    setShowAddForm(false);
    toast.success('Activity logged successfully');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Timeline</h2>
          <p className="text-muted-foreground">Track all interactions and activities</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Activity
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="call">Calls</SelectItem>
            <SelectItem value="email">Emails</SelectItem>
            <SelectItem value="meeting">Meetings</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="Leads">Leads</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Log New Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Activity Type</label>
                <Select
                  value={newEvent.type}
                  onValueChange={(v: any) => setNewEvent({ ...newEvent, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">📞 Call</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="meeting">📅 Meeting</SelectItem>
                    <SelectItem value="note">📝 Note</SelectItem>
                    <SelectItem value="task">✅ Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Related To</label>
                <Input
                  placeholder="Company or Contact name"
                  value={newEvent.relatedTo}
                  onChange={(e) => setNewEvent({ ...newEvent, relatedTo: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Activity title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Activity details..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  {isSupported && (
                    <Button
                      type="button"
                      variant={isListening ? 'destructive' : 'outline'}
                      size="icon"
                      onClick={() => isListening ? stopListening() : startListening()}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddEvent}>Save Activity</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <ScrollArea className="h-[600px]">
        <div className="relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

          {filteredEvents.map((event, idx) => {
            const Icon = getEventIcon(event.type);
            return (
              <div key={event.id} className="relative pb-8 last:pb-0">
                {/* Timeline dot */}
                <div className={cn(
                  'absolute left-0 w-6 h-6 rounded-full flex items-center justify-center',
                  getEventColor(event.type)
                )}>
                  <Icon className="h-3 w-3 text-white" />
                </div>

                {/* Event card */}
                <Card className="ml-6 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary" />
                            {formatTime(event.timestamp)}
                          </span>
                          <span>By {event.user}</span>
                          <span>Related to: {event.relatedTo}</span>
                          {event.duration && <span>Duration: {event.duration}</span>}
                        </div>
                        {event.outcome && (
                          <Badge variant="outline" className="mt-2">
                            Outcome: {event.outcome}
                          </Badge>
                        )}
                        {event.attachments && event.attachments.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {event.attachments.map((file, i) => (
                              <Badge key={i} variant="secondary" className="gap-1">
                                <Paperclip className="h-3 w-3" />
                                {file}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityTimeline;

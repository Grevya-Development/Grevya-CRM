import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Star,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Globe,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadScore {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number;
  maxScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'up' | 'down' | 'stable';
  lastActivity: string;
  factors: ScoreFactor[];
  engagementHistory: EngagementEvent[];
}

interface ScoreFactor {
  category: string;
  factor: string;
  points: number;
  maxPoints: number;
  icon: React.ReactNode;
}

interface EngagementEvent {
  type: 'email' | 'call' | 'meeting' | 'website' | 'download';
  description: string;
  date: string;
  points: number;
}

const sampleLeads: LeadScore[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    company: 'TechCorp Inc.',
    email: 'sarah.johnson@techcorp.com',
    score: 87,
    maxScore: 100,
    grade: 'A',
    trend: 'up',
    lastActivity: '2 hours ago',
    factors: [
      { category: 'Demographic', factor: 'Company Size (1000+ employees)', points: 15, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Industry Match (Technology)', points: 10, maxPoints: 10, icon: <CheckCircle className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Decision Maker Role (CTO)', points: 15, maxPoints: 15, icon: <Star className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Email Opens (5+)', points: 12, maxPoints: 15, icon: <Mail className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Website Visits (10+)', points: 15, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Demo Requested', points: 20, maxPoints: 20, icon: <Calendar className="h-4 w-4" /> },
    ],
    engagementHistory: [
      { type: 'meeting', description: 'Product demo scheduled', date: '2024-12-08', points: 20 },
      { type: 'email', description: 'Opened pricing email', date: '2024-12-07', points: 5 },
      { type: 'website', description: 'Visited pricing page', date: '2024-12-06', points: 8 },
      { type: 'download', description: 'Downloaded whitepaper', date: '2024-12-05', points: 10 },
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Innovate.io',
    email: 'michael.chen@innovate.io',
    score: 72,
    maxScore: 100,
    grade: 'B',
    trend: 'up',
    lastActivity: '1 day ago',
    factors: [
      { category: 'Demographic', factor: 'Company Size (100-500)', points: 10, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Industry Match (Software)', points: 10, maxPoints: 10, icon: <CheckCircle className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Decision Maker Role (CEO)', points: 15, maxPoints: 15, icon: <Star className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Email Opens (3)', points: 8, maxPoints: 15, icon: <Mail className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Website Visits (5)', points: 10, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Form Submission', points: 19, maxPoints: 20, icon: <Calendar className="h-4 w-4" /> },
    ],
    engagementHistory: [
      { type: 'email', description: 'Replied to follow-up', date: '2024-12-07', points: 15 },
      { type: 'website', description: 'Visited features page', date: '2024-12-05', points: 5 },
      { type: 'call', description: 'Answered discovery call', date: '2024-12-03', points: 18 },
    ],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    company: 'GlobalTech',
    email: 'emily.r@globaltech.com',
    score: 58,
    maxScore: 100,
    grade: 'C',
    trend: 'stable',
    lastActivity: '3 days ago',
    factors: [
      { category: 'Demographic', factor: 'Company Size (1000+)', points: 15, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Industry Match (IT Services)', points: 8, maxPoints: 10, icon: <CheckCircle className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Role (VP Sales)', points: 12, maxPoints: 15, icon: <Star className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Email Opens (2)', points: 5, maxPoints: 15, icon: <Mail className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Website Visits (2)', points: 5, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'No Demo Request', points: 13, maxPoints: 20, icon: <Clock className="h-4 w-4" /> },
    ],
    engagementHistory: [
      { type: 'email', description: 'Opened newsletter', date: '2024-12-05', points: 3 },
      { type: 'website', description: 'Visited home page', date: '2024-12-01', points: 2 },
    ],
  },
  {
    id: '4',
    name: 'James Wilson',
    company: 'Solutions Net',
    email: 'james.w@solutions.net',
    score: 42,
    maxScore: 100,
    grade: 'D',
    trend: 'down',
    lastActivity: '1 week ago',
    factors: [
      { category: 'Demographic', factor: 'Company Size (50-100)', points: 5, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Industry Match (Consulting)', points: 6, maxPoints: 10, icon: <AlertCircle className="h-4 w-4" /> },
      { category: 'Demographic', factor: 'Role (Manager)', points: 8, maxPoints: 15, icon: <Star className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'Email Opens (1)', points: 3, maxPoints: 15, icon: <Mail className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'No Website Visits', points: 0, maxPoints: 15, icon: <Globe className="h-4 w-4" /> },
      { category: 'Behavioral', factor: 'No Engagement', points: 20, maxPoints: 20, icon: <Clock className="h-4 w-4" /> },
    ],
    engagementHistory: [
      { type: 'email', description: 'Opened intro email', date: '2024-12-01', points: 3 },
    ],
  },
];

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-success text-success-foreground';
    case 'B': return 'bg-primary text-primary-foreground';
    case 'C': return 'bg-warning text-warning-foreground';
    case 'D': return 'bg-orange-500 text-white';
    case 'F': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

export const LeadScoring: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Scoring</h2>
          <p className="text-muted-foreground">AI-powered lead qualification and prioritization</p>
        </div>
        <Button>Configure Scoring Rules</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Star className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hot Leads (A)</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warm Leads (B)</p>
                <p className="text-2xl font-bold">28</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nurturing (C)</p>
                <p className="text-2xl font-bold">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cold Leads (D/F)</p>
                <p className="text-2xl font-bold">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead Rankings</CardTitle>
            <CardDescription>Leads sorted by qualification score</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={lead.score} className="w-16 h-2" />
                        <span className={cn('font-bold', getScoreColor(lead.score))}>
                          {lead.score}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(lead.grade)}>{lead.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : lead.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : (
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.lastActivity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedLead ? `${selectedLead.name} - Score Breakdown` : 'Select a Lead'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLead ? (
              <Tabs defaultValue="factors">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="factors">Score Factors</TabsTrigger>
                  <TabsTrigger value="history">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="factors" className="space-y-3 mt-4">
                  {selectedLead.factors.map((factor, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {factor.icon}
                          <span>{factor.factor}</span>
                        </div>
                        <span className="font-medium">
                          {factor.points}/{factor.maxPoints}
                        </span>
                      </div>
                      <Progress 
                        value={(factor.points / factor.maxPoints) * 100} 
                        className="h-1.5" 
                      />
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <div className="space-y-3">
                    {selectedLead.engagementHistory.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded bg-background">
                          {event.type === 'email' && <Mail className="h-4 w-4" />}
                          {event.type === 'call' && <Phone className="h-4 w-4" />}
                          {event.type === 'meeting' && <Calendar className="h-4 w-4" />}
                          {event.type === 'website' && <Globe className="h-4 w-4" />}
                          {event.type === 'download' && <Activity className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <Badge variant="secondary">+{event.points}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Click on a lead to view their score breakdown
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadScoring;

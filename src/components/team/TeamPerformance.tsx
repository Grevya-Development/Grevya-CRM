import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  target: number;
  achieved: number;
  Leads: number;
  calls: number;
  emails: number;
  meetings: number;
  trend: 'up' | 'down' | 'stable';
}

const teamMembers: TeamMember[] = [
  { id: '1', name: 'John Smith', role: 'Senior Sales Rep', avatar: 'JS', target: 150000, achieved: 168000, Leads: 12, calls: 145, emails: 280, meetings: 24, trend: 'up' },
  { id: '2', name: 'Jane Doe', role: 'Sales Rep', avatar: 'JD', target: 120000, achieved: 115000, Leads: 9, calls: 120, emails: 200, meetings: 18, trend: 'stable' },
  { id: '3', name: 'Mike Johnson', role: 'Sales Rep', avatar: 'MJ', target: 120000, achieved: 98000, Leads: 7, calls: 95, emails: 180, meetings: 14, trend: 'down' },
  { id: '4', name: 'Sarah Wilson', role: 'Junior Sales Rep', avatar: 'SW', target: 80000, achieved: 92000, Leads: 8, calls: 110, emails: 220, meetings: 16, trend: 'up' },
  { id: '5', name: 'Emily Brown', role: 'Sales Rep', avatar: 'EB', target: 100000, achieved: 105000, Leads: 10, calls: 135, emails: 250, meetings: 20, trend: 'up' },
];

const weeklyData = [
  { week: 'Week 1', John: 35000, Jane: 28000, Mike: 22000, Sarah: 20000, Emily: 25000 },
  { week: 'Week 2', John: 42000, Jane: 30000, Mike: 25000, Sarah: 24000, Emily: 28000 },
  { week: 'Week 3', John: 45000, Jane: 32000, Mike: 26000, Sarah: 26000, Emily: 30000 },
  { week: 'Week 4', John: 46000, Jane: 25000, Mike: 25000, Sarah: 22000, Emily: 22000 },
];

const activityData = [
  { name: 'John', calls: 145, emails: 280, meetings: 24 },
  { name: 'Jane', calls: 120, emails: 200, meetings: 18 },
  { name: 'Mike', calls: 95, emails: 180, meetings: 14 },
  { name: 'Sarah', calls: 110, emails: 220, meetings: 16 },
  { name: 'Emily', calls: 135, emails: 250, meetings: 20 },
];

export const TeamPerformance: React.FC = () => {
  const { formatCurrency, displayCurrency } = useCurrency();
  const totalTarget = teamMembers.reduce((sum, m) => sum + m.target, 0);
  const totalAchieved = teamMembers.reduce((sum, m) => sum + m.achieved, 0);
  const achievementRate = Math.round((totalAchieved / totalTarget) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
          <div className="relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Team Target</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400 leading-tight">{displayCurrency.symbol}{(totalTarget / 100000).toFixed(1)}L</p>
            <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              Annual Goal
            </span>
          </div>
          <div className="absolute right-2 bottom-2 rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
            <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
          <div className="relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Team Achieved</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400 leading-tight">{displayCurrency.symbol}{(totalAchieved / 100000).toFixed(1)}L</p>
            <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              YTD Revenue
            </span>
          </div>
          <div className="absolute right-2 bottom-2 rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
            <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
          <div className="relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Achievement Rate</p>
            <p className="text-lg font-semibold text-foreground leading-tight">{achievementRate}%</p>
            <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              Overall progress
            </span>
          </div>
          <div className="absolute right-2 bottom-2 rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/50 bg-indigo-100/30 dark:border-indigo-800/50 dark:bg-indigo-900/10 p-2">
          <div className="relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Top Performer</p>
            <p className="text-lg font-semibold text-foreground leading-tight">John Smith</p>
            <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-indigo-200/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              Most Sales
            </span>
          </div>
          <div className="absolute right-2 bottom-2 rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map(member => {
                const progress = Math.round((member.achieved / member.target) * 100);
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{displayCurrency.symbol}{(member.target / 100000).toFixed(1)}L</TableCell>
                    <TableCell>{displayCurrency.symbol}{(member.achieved / 100000).toFixed(1)}L</TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{progress}%</span>
                        </div>
                        <Progress
                          value={Math.min(progress, 100)}
                          className={progress >= 100 ? 'bg-green-100' : ''}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.Leads}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.calls}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.emails}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {member.meetings}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {member.trend === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
                      {member.trend === 'stable' && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue by Rep</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${displayCurrency.symbol}${(value / 1000).toFixed(0)}K`, '']}
                />
                <Legend />
                <Line type="monotone" dataKey="John" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="Jane" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="Mike" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Sarah" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="Emily" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="calls" fill="hsl(var(--primary))" name="Calls" />
                <Bar dataKey="emails" fill="#22c55e" name="Emails" />
                <Bar dataKey="meetings" fill="#f59e0b" name="Meetings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

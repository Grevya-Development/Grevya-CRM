import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Trophy, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { salesTargets, organizationMembers } from '@/data/organizationData';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

const individualTargets = salesTargets.filter(t => t.level === 'individual');

const leaderboard = individualTargets
  .map(t => {
    const member = organizationMembers.find(m => m.id === t.ownerId);
    const percentage = Math.round((t.achievedAmount / t.targetAmount) * 100);
    const gap = t.achievedAmount - t.targetAmount;
    return {
      ...t,
      member,
      percentage,
      gap,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendValue: Math.floor(Math.random() * 20) + 1
    };
  })
  .sort((a, b) => b.percentage - a.percentage);

const topPerformers = leaderboard.slice(0, 3);

export const TargetAchievementReport: React.FC = () => {
  const orgTarget = salesTargets.find(t => t.level === 'organization');
  const orgPercentage = orgTarget 
    ? Math.round((orgTarget.achievedAmount / orgTarget.targetAmount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Organization Target</p>
                <p className="text-2xl font-bold">{formatCurrency(orgTarget?.targetAmount || 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achieved</p>
                <p className="text-2xl font-bold">{formatCurrency(orgTarget?.achievedAmount || 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievement Rate</p>
                <p className="text-2xl font-bold">{orgPercentage}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={orgPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gap to Target</p>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency((orgTarget?.targetAmount || 0) - (orgTarget?.achievedAmount || 0))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPerformers.map((performer, index) => (
              <div
                key={performer.id}
                className={cn(
                  'p-4 rounded-lg border text-center',
                  index === 0 && 'bg-yellow-500/10 border-yellow-500/30',
                  index === 1 && 'bg-gray-500/10 border-gray-500/30',
                  index === 2 && 'bg-orange-500/10 border-orange-500/30'
                )}
              >
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {performer.member?.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 && 'bg-yellow-500 text-white',
                      index === 1 && 'bg-gray-400 text-white',
                      index === 2 && 'bg-orange-600 text-white'
                    )}>
                      {index + 1}
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold">{performer.ownerName}</h4>
                <p className="text-sm text-muted-foreground mb-2">{performer.member?.role}</p>
                <div className="text-2xl font-bold text-primary">{performer.percentage}%</div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(performer.achievedAmount)} achieved
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {item.member?.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.ownerName}</p>
                        <p className="text-xs text-muted-foreground">{item.member?.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.targetAmount)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.achievedAmount)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'font-medium',
                      item.gap >= 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {item.gap >= 0 ? '+' : ''}{formatCurrency(item.gap)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.percentage} className="h-2 w-20" />
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.trend === 'up' ? 'default' : 'secondary'}
                      className={cn(
                        'gap-1',
                        item.trend === 'up' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                      )}
                    >
                      {item.trend === 'up' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {item.trendValue}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

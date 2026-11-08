import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metric?: string;
}

const insights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'High-value Leads ready to close',
    description: 'TechCorp Leads ($450K) has 85% win probability based on engagement patterns similar to your closed-won Leads.',
    impact: 'high',
    actionable: true,
    metric: '+$450K potential'
  },
  {
    id: '2',
    type: 'risk',
    title: 'Pipeline velocity decreasing',
    description: 'Average Leads cycle increased from 42 to 51 days this month. 6 Leads are at risk of slipping.',
    impact: 'high',
    actionable: true,
    metric: '-18% velocity'
  },
  {
    id: '3',
    type: 'prediction',
    title: 'Q4 target achievable',
    description: 'Based on current pipeline and historical conversion rates, you\'re on track to hit 95% of Q4 target.',
    impact: 'medium',
    actionable: false,
    metric: '95% confidence'
  },
  {
    id: '4',
    type: 'recommendation',
    title: 'Optimize follow-up timing',
    description: 'Your best response rates occur Tuesday-Thursday, 10AM-2PM. Consider scheduling outreach during these windows.',
    impact: 'medium',
    actionable: true,
    metric: '+23% response rate'
  }
];

const typeConfig = {
  opportunity: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  risk: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  recommendation: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  prediction: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10' }
};

const impactColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
};

export const AIInsights: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <CardTitle>AI Insights</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">4 new insights</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;
          
          return (
            <div
              key={insight.id}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge className={impactColors[insight.impact]} variant="secondary">
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {insight.metric && (
                      <span className={`text-sm font-semibold ${config.color}`}>
                        {insight.metric}
                      </span>
                    )}
                    {insight.actionable && (
                      <Button variant="ghost" size="sm" className="gap-1 ml-auto">
                        Take action
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

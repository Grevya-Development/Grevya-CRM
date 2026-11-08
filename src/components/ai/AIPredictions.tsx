import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  DollarSign,
  Users,
  Calendar,
  Lightbulb,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Prediction {
  id: string;
  type: 'revenue' | 'churn' | 'Leads' | 'lead';
  title: string;
  prediction: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  details: string;
}

const predictions: Prediction[] = [
  {
    id: '1',
    type: 'revenue',
    title: 'Q1 2025 Revenue Forecast',
    prediction: '₹18.5L expected',
    confidence: 85,
    impact: 'high',
    trend: 'up',
    details: 'Based on pipeline analysis and historical conversion rates, Q1 revenue is projected to exceed target by 12%.',
  },
  {
    id: '2',
    type: 'churn',
    title: 'At-Risk Customer Alert',
    prediction: '3 accounts at risk',
    confidence: 78,
    impact: 'high',
    trend: 'down',
    details: 'TechCorp, Innovate.io, and StartupX show declining engagement patterns. Recommend immediate outreach.',
  },
  {
    id: '3',
    type: 'Leads',
    title: 'Leads Win Probability',
    prediction: '5 Leads likely to close',
    confidence: 72,
    impact: 'medium',
    trend: 'up',
    details: 'Enterprise License ($150K) and Cloud Migration ($220K) have highest close probability this month.',
  },
  {
    id: '4',
    type: 'lead',
    title: 'Lead Scoring Update',
    prediction: '8 hot leads identified',
    confidence: 88,
    impact: 'medium',
    trend: 'up',
    details: 'AI analysis identified 8 leads with 80%+ conversion probability based on engagement and firmographics.',
  },
];

const forecastData = [
  { month: 'Jan', actual: 85, predicted: 88 },
  { month: 'Feb', actual: 92, predicted: 95 },
  { month: 'Mar', actual: 108, predicted: 105 },
  { month: 'Apr', actual: null, predicted: 115 },
  { month: 'May', actual: null, predicted: 125 },
  { month: 'Jun', actual: null, predicted: 140 },
];

const LeadsProbabilities = [
  { name: 'Enterprise License Leads', company: 'TechCorp Inc.', value: 150000, probability: 85, daysToClose: 12 },
  { name: 'Cloud Migration Project', company: 'GlobalTech', value: 220000, probability: 62, daysToClose: 45 },
  { name: 'SaaS Implementation', company: 'Innovate.io', value: 85000, probability: 75, daysToClose: 25 },
  { name: 'Custom Integration', company: 'Enterprise Co', value: 95000, probability: 55, daysToClose: 35 },
];

export const AIPredictions: React.FC = () => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return DollarSign;
      case 'churn': return AlertTriangle;
      case 'Leads': return Target;
      case 'lead': return Users;
      default: return Brain;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">AI-Powered Predictions</h3>
              <p className="text-muted-foreground">
                Based on your CRM data analysis, here are the key predictions and insights. 
                These predictions are updated daily using machine learning models trained on your historical data.
              </p>
              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">₹18.5L</p>
                  <p className="text-xs text-muted-foreground">Predicted Q1 Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">85%</p>
                  <p className="text-xs text-muted-foreground">Model Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">3</p>
                  <p className="text-xs text-muted-foreground">Action Items</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {predictions.map(pred => {
          const Icon = getTypeIcon(pred.type);
          return (
            <Card key={pred.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    pred.type === 'churn' ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    <Icon className={`h-5 w-5 ${pred.type === 'churn' ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{pred.title}</h4>
                      {pred.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {pred.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                    </div>
                    <p className="text-lg font-bold text-primary">{pred.prediction}</p>
                    <p className="text-sm text-muted-foreground mt-2">{pred.details}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Badge variant="secondary">{pred.confidence}%</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <span className={`text-xs font-medium capitalize ${getImpactColor(pred.impact)}`}>
                          {pred.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Forecast (₹ Lakhs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  name="Actual"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  strokeDasharray="5 5"
                  name="Predicted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads Probabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Leads Win Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {LeadsProbabilities.map((Leads, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{Leads.name}</p>
                      <p className="text-xs text-muted-foreground">{Leads.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{(Leads.value / 100000).toFixed(1)}L</p>
                      <p className="text-xs text-muted-foreground">{Leads.daysToClose} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={Leads.probability} className="flex-1" />
                    <span className={`text-sm font-medium ${
                      Leads.probability >= 70 ? 'text-green-500' : 
                      Leads.probability >= 50 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {Leads.probability}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Schedule follow-up with TechCorp', desc: 'High-value Leads at risk of delay. Last contact was 5 days ago.', priority: 'high' },
              { title: 'Upsell opportunity at BigData AI', desc: 'Customer usage patterns indicate need for premium features.', priority: 'medium' },
              { title: 'Review pricing for GlobalTech', desc: 'Competitor analysis suggests 10% discount could win the Leads.', priority: 'medium' },
            ].map((rec, i) => (
              <div key={i} className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                    {rec.priority}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                <p className="text-xs text-muted-foreground">{rec.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

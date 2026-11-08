import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Target, Building2, Users, User, Edit2 } from 'lucide-react';
import { salesTargets, Target as TargetType } from '@/data/organizationData';
import { cn } from '@/lib/utils';

interface TargetNodeProps {
  target: TargetType;
  level: number;
  allTargets: TargetType[];
}

const levelConfig = {
  organization: { icon: Building2, color: 'bg-purple-500', label: 'Organization' },
  region: { icon: Target, color: 'bg-primary', label: 'Region' },
  team: { icon: Users, color: 'bg-green-500', label: 'Team' },
  individual: { icon: User, color: 'bg-orange-500', label: 'Individual' }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

const TargetNode: React.FC<TargetNodeProps> = ({ target, level, allTargets }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const children = allTargets.filter(t => t.parentId === target.id);
  const hasChildren = children.length > 0;
  const config = levelConfig[target.level];
  const Icon = config.icon;
  const percentage = Math.round((target.achievedAmount / target.targetAmount) * 100);
  const isOnTrack = percentage >= 75;

  return (
    <div className={cn('border-l-2 border-border', level > 0 && 'ml-6')}>
      <div
        className={cn(
          'p-4 bg-card border rounded-lg mb-2 ml-4 hover:shadow-md transition-shadow',
          level === 0 && 'ml-0 border-l-4',
          level === 0 && config.color.replace('bg-', 'border-l-')
        )}
      >
        <div className="flex items-start gap-3">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{target.name}</h4>
                <Badge variant="outline" className="text-xs">{config.label}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              Owner: {target.ownerName} • {target.period}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {formatCurrency(target.achievedAmount)} of {formatCurrency(target.targetAmount)}
                </span>
                <span className={cn('font-semibold', isOnTrack ? 'text-green-500' : 'text-orange-500')}>
                  {percentage}%
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={cn('h-2', percentage >= 100 && 'bg-green-200')}
              />
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="space-y-0">
          {children.map((child) => (
            <TargetNode
              key={child.id}
              target={child}
              level={level + 1}
              allTargets={allTargets}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TargetHierarchy: React.FC = () => {
  const rootTarget = salesTargets.find(t => t.parentId === null);

  if (!rootTarget) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Target Hierarchy
          </CardTitle>
          <Button size="sm" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Targets
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TargetNode
          target={rootTarget}
          level={0}
          allTargets={salesTargets}
        />
      </CardContent>
    </Card>
  );
};

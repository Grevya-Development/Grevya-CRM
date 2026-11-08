import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  MoreVertical,
  Users,
  Workflow
} from 'lucide-react';
import { organizationMembers, OrgMember } from '@/data/organizationData';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrgNodeProps {
  member: OrgMember;
  allMembers: OrgMember[];
  level: number;
}

const levelColors = {
  executive: 'border-purple-500',
  director: 'border-primary',
  manager: 'border-green-500',
  individual: 'border-orange-500'
};

const levelBgs = {
  executive: 'bg-purple-500',
  director: 'bg-primary',
  manager: 'bg-green-500',
  individual: 'bg-orange-500'
};

const OrgNode: React.FC<OrgNodeProps> = ({ member, allMembers, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const directReports = allMembers.filter(m => m.reportsTo === member.id);
  const hasReports = directReports.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          'relative p-4 bg-card border-2 rounded-lg w-64 shadow-sm hover:shadow-md transition-shadow',
          levelColors[member.level]
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className={cn('h-12 w-12 border-2', levelBgs[member.level])}>
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {member.avatar}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-sm">{member.name}</h4>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="h-4 w-4 mr-2" />
                    View Team
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Workflow className="h-4 w-4 mr-2" />
                    Edit Workflow
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{member.department}</Badge>
              {hasReports && (
                <Badge variant="secondary" className="text-xs">
                  {directReports.length} reports
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {hasReports && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-background border shadow-sm p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {hasReports && isExpanded && (
        <>
          <div className="w-px h-8 bg-border" />
          <div className="relative flex gap-8">
            {directReports.length > 1 && (
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                style={{ 
                  width: `calc(${(directReports.length - 1) * 100}% + ${(directReports.length - 1) * 32}px)` 
                }}
              />
            )}
            {directReports.map((report) => (
              <div key={report.id} className="flex flex-col items-center">
                <div className="w-px h-8 bg-border" />
                <OrgNode
                  member={report}
                  allMembers={allMembers}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const OrgChart: React.FC = () => {
  const ceo = organizationMembers.find(m => m.reportsTo === null);

  if (!ceo) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Chart
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              Executive
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              Director
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              Manager
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              Individual
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-8">
        <div className="flex justify-center min-w-max pt-4">
          <OrgNode
            member={ceo}
            allMembers={organizationMembers}
            level={0}
          />
        </div>
      </CardContent>
    </Card>
  );
};

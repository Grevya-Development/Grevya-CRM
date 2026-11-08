import React from 'react';
import { Header } from '@/components/layout/Header';
import { TeamPerformance } from '@/components/team/TeamPerformance';
import { AIPredictions } from '@/components/ai/AIPredictions';
import { DrillDownReport } from '@/components/reports/DrillDownReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Brain, BarChart3 } from 'lucide-react';

export default function TeamManagement() {
  return (
    <>
      <Header title="Team & Analytics" subtitle="Performance dashboards and AI predictions" />
      
      <div className="p-6">
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team Performance
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Predictions
            </TabsTrigger>
            <TabsTrigger value="drilldown" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Drill-Down Reports
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team">
            <TeamPerformance />
          </TabsContent>
          
          <TabsContent value="predictions">
            <AIPredictions />
          </TabsContent>
          
          <TabsContent value="drilldown">
            <DrillDownReport />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

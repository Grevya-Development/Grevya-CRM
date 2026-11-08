import React from 'react';
import { Header } from '@/components/layout/Header';
import { OrgChart } from '@/components/organization/OrgChart';
import { DragDropOrgChart } from '@/components/organization/DragDropOrgChart';
import { WorkflowConfig } from '@/components/organization/WorkflowConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Workflow, GripVertical } from 'lucide-react';

const Organization = () => {
  return (
    <>
      <Header title="Organization" subtitle="Team structure and workflow automation" />
      
      <div className="p-6">
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="chart" className="gap-2">
              <Users className="h-4 w-4" />
              Org Chart
            </TabsTrigger>
            <TabsTrigger value="dragdrop" className="gap-2">
              <GripVertical className="h-4 w-4" />
              Drag & Drop
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <OrgChart />
          </TabsContent>
          
          <TabsContent value="dragdrop">
            <DragDropOrgChart />
          </TabsContent>
          
          <TabsContent value="workflows">
            <WorkflowConfig />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Organization;

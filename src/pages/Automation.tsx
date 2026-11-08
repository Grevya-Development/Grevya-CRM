import React from 'react';
import { Header } from '@/components/layout/Header';
import { WorkflowBuilder } from '@/components/automation/WorkflowBuilder';
import { CommunicationHub } from '@/components/communication/CommunicationHub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, MessageSquare } from 'lucide-react';

export default function Automation() {
  return (
    <>
      <Header title="Automation Hub" subtitle="Workflow automation and communication tools" />
      
      <div className="p-6">
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflows" className="gap-2">
              <Zap className="h-4 w-4" />
              Workflow Builder
            </TabsTrigger>
            <TabsTrigger value="communication" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Communication Hub
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="workflows">
            <WorkflowBuilder />
          </TabsContent>
          
          <TabsContent value="communication">
            <CommunicationHub />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

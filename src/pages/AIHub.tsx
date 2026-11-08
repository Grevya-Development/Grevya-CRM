import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import AIAssistant from '@/components/ai/Ai-Assistant';
import { AIInsights } from '@/components/ai/AIInsights';
import { AIContentGenerator } from '@/components/ai/AIContentGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Lightbulb, FileEdit } from 'lucide-react';

const AIHub = () => {
  return (
    <>
      <Header title="AI Hub" subtitle="AI-powered sales intelligence and automation" />

      <div className="p-6">
        <Tabs defaultValue="assistant" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="assistant" className="gap-2">
              <Bot className="h-4 w-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="generator" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistant">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIAssistant currentPath="/ai-hub" />
              <AIInsights />
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIInsights />
              <AIAssistant currentPath="/ai-hub" />
            </div>
          </TabsContent>

          <TabsContent value="generator">
            <div className="max-w-3xl">
              <AIContentGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AIHub;

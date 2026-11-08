import React from 'react';
import { Header } from '@/components/layout/Header';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { DataTools } from '@/components/admin/DataTools';
import { EmailSettings } from '@/components/admin/EmailSettings';
import { CurrencySettings } from '@/components/currency/CurrencySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Clock, Upload, IndianRupee, Mail } from 'lucide-react';

export default function Admin() {
  return (
    <>
      <Header title="Admin Panel" subtitle="System administration and security settings" />

      <div className="p-6">
        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Roles & Access
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Clock className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Upload className="h-4 w-4" />
              Import/Export
            </TabsTrigger>
            <TabsTrigger value="currency" className="gap-2">
              <IndianRupee className="h-4 w-4" />
              Currency
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="data">
            <DataTools />
          </TabsContent>

          <TabsContent value="currency">
            <CurrencySettings />
          </TabsContent>

          <TabsContent value="email">
            <EmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

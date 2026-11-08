import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  Clock,
  User,
  FileEdit,
  Trash2,
  Plus,
  Eye,
  LogIn,
  LogOut,
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: { name: string; email: string };
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export';
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
}

const auditLogs: AuditLog[] = [
  { id: '1', timestamp: '2024-12-05T14:30:00', user: { name: 'John Smith', email: 'john@company.com' }, action: 'update', resource: 'Leads', resourceId: 'Leads-001', details: 'Changed stage from Proposal to Negotiation', ipAddress: '192.168.1.1' },
  { id: '2', timestamp: '2024-12-05T14:25:00', user: { name: 'Jane Doe', email: 'jane@company.com' }, action: 'create', resource: 'Contact', resourceId: 'contact-012', details: 'Created new contact: Michael Brown', ipAddress: '192.168.1.2' },
  { id: '3', timestamp: '2024-12-05T14:20:00', user: { name: 'Mike Johnson', email: 'mike@company.com' }, action: 'login', resource: 'Session', resourceId: 'session-123', details: 'User logged in successfully', ipAddress: '192.168.1.3' },
  { id: '4', timestamp: '2024-12-05T14:15:00', user: { name: 'John Smith', email: 'john@company.com' }, action: 'delete', resource: 'Task', resourceId: 'task-045', details: 'Deleted completed task: Follow up call', ipAddress: '192.168.1.1' },
  { id: '5', timestamp: '2024-12-05T14:10:00', user: { name: 'Jane Doe', email: 'jane@company.com' }, action: 'view', resource: 'Report', resourceId: 'report-001', details: 'Viewed quarterly sales report', ipAddress: '192.168.1.2' },
  { id: '6', timestamp: '2024-12-05T14:05:00', user: { name: 'Admin User', email: 'admin@company.com' }, action: 'export', resource: 'Contacts', resourceId: 'export-001', details: 'Exported 250 contacts to CSV', ipAddress: '192.168.1.10' },
  { id: '7', timestamp: '2024-12-05T14:00:00', user: { name: 'Mike Johnson', email: 'mike@company.com' }, action: 'update', resource: 'Company', resourceId: 'company-005', details: 'Updated company info: TechCorp Inc.', ipAddress: '192.168.1.3' },
  { id: '8', timestamp: '2024-12-05T13:55:00', user: { name: 'John Smith', email: 'john@company.com' }, action: 'logout', resource: 'Session', resourceId: 'session-122', details: 'User logged out', ipAddress: '192.168.1.1' },
];

const getActionIcon = (action: AuditLog['action']) => {
  switch (action) {
    case 'create': return <Plus className="h-4 w-4 text-green-500" />;
    case 'update': return <FileEdit className="h-4 w-4 text-primary" />;
    case 'delete': return <Trash2 className="h-4 w-4 text-destructive" />;
    case 'view': return <Eye className="h-4 w-4 text-muted-foreground" />;
    case 'login': return <LogIn className="h-4 w-4 text-green-500" />;
    case 'logout': return <LogOut className="h-4 w-4 text-orange-500" />;
    case 'export': return <Download className="h-4 w-4 text-primary" />;
  }
};

const getActionBadge = (action: AuditLog['action']) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    create: 'default',
    update: 'secondary',
    delete: 'destructive',
    view: 'outline',
    login: 'default',
    logout: 'secondary',
    export: 'default',
  };
  return <Badge variant={variants[action]} className="capitalize">{action}</Badge>;
};

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource.toLowerCase() === resourceFilter.toLowerCase();
    return matchesSearch && matchesAction && matchesResource;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="Leads">Leads</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="session">Session</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {log.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{log.user.name}</p>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {getActionBadge(log.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.resource}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {log.ipAddress}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

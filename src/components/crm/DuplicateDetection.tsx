import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Merge,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DuplicateGroup {
  id: string;
  matchScore: number;
  records: DuplicateRecord[];
  status: 'pending' | 'merged' | 'ignored';
}

interface DuplicateRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  createdAt: string;
  lastActivity: string;
}

const sampleDuplicates: DuplicateGroup[] = [
  {
    id: '1',
    matchScore: 95,
    status: 'pending',
    records: [
      { id: 'c1', name: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', phone: '+1 555-123-4567', company: 'TechCorp Inc.', source: 'Website', createdAt: '2024-01-15', lastActivity: '2024-12-08' },
      { id: 'c2', name: 'Sarah J.', email: 'sarah.j@techcorp.com', phone: '+1 555-123-4567', company: 'TechCorp', source: 'Trade Show', createdAt: '2024-03-20', lastActivity: '2024-11-15' },
    ],
  },
  {
    id: '2',
    matchScore: 87,
    status: 'pending',
    records: [
      { id: 'c3', name: 'Michael Chen', email: 'michael.chen@innovate.io', phone: '+1 555-234-5678', company: 'Innovate.io', source: 'Referral', createdAt: '2024-02-20', lastActivity: '2024-12-05' },
      { id: 'c4', name: 'Mike Chen', email: 'm.chen@innovate.io', phone: '+1 555-234-5678', company: 'Innovate IO', source: 'Cold Call', createdAt: '2024-06-10', lastActivity: '2024-10-22' },
    ],
  },
  {
    id: '3',
    matchScore: 78,
    status: 'pending',
    records: [
      { id: 'c5', name: 'David Kim', email: 'david.kim@startupx.com', phone: '+1 555-456-7890', company: 'StartupX', source: 'Website', createdAt: '2024-01-05', lastActivity: '2024-12-06' },
      { id: 'c6', name: 'David K', email: 'dkim@startupx.com', phone: '+1 555-456-7891', company: 'Startup X Inc', source: 'LinkedIn', createdAt: '2024-05-15', lastActivity: '2024-09-30' },
      { id: 'c7', name: 'D. Kim', email: 'david@startupx.com', phone: '+1 555-456-7890', company: 'StartupX', source: 'Email Campaign', createdAt: '2024-08-01', lastActivity: '2024-08-15' },
    ],
  },
];

export const DuplicateDetection: React.FC = () => {
  const [duplicates, setDuplicates] = useState(sampleDuplicates);
  const [selectedRecords, setSelectedRecords] = useState<Record<string, string[]>>({});
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    toast.info('Scanning for duplicates...');
    setTimeout(() => {
      setIsScanning(false);
      toast.success('Scan complete! Found 3 potential duplicate groups');
    }, 2000);
  };

  const handleMerge = (groupId: string) => {
    const selected = selectedRecords[groupId];
    if (!selected || selected.length < 2) {
      toast.error('Select at least 2 records to merge');
      return;
    }

    setDuplicates(prev => prev.map(g => 
      g.id === groupId ? { ...g, status: 'merged' } : g
    ));
    toast.success('Records merged successfully');
  };

  const handleIgnore = (groupId: string) => {
    setDuplicates(prev => prev.map(g => 
      g.id === groupId ? { ...g, status: 'ignored' } : g
    ));
    toast.info('Duplicate group marked as ignored');
  };

  const toggleRecordSelection = (groupId: string, recordId: string) => {
    setSelectedRecords(prev => {
      const current = prev[groupId] || [];
      if (current.includes(recordId)) {
        return { ...prev, [groupId]: current.filter(id => id !== recordId) };
      }
      return { ...prev, [groupId]: [...current, recordId] };
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-destructive text-destructive-foreground';
    if (score >= 75) return 'bg-warning text-warning-foreground';
    return 'bg-info text-info-foreground';
  };

  const pendingCount = duplicates.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplicate Detection</h2>
          <p className="text-muted-foreground">Find and merge duplicate records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScan} disabled={isScanning} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isScanning && 'animate-spin')} />
            {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Merge className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Merged</p>
                <p className="text-2xl font-bold">
                  {duplicates.filter(d => d.status === 'merged').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Ignored</p>
                <p className="text-2xl font-bold">
                  {duplicates.filter(d => d.status === 'ignored').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Records Affected</p>
                <p className="text-2xl font-bold">
                  {duplicates.reduce((acc, g) => acc + g.records.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Groups */}
      <div className="space-y-4">
        {duplicates.map((group) => (
          <Card key={group.id} className={cn(
            group.status !== 'pending' && 'opacity-60'
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getMatchScoreColor(group.matchScore)}>
                    {group.matchScore}% Match
                  </Badge>
                  <CardTitle className="text-lg">
                    {group.records.length} Potential Duplicates
                  </CardTitle>
                  {group.status !== 'pending' && (
                    <Badge variant="outline">
                      {group.status === 'merged' ? 'Merged' : 'Ignored'}
                    </Badge>
                  )}
                </div>
                {group.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleIgnore(group.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Ignore
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleMerge(group.id)}
                      className="gap-1"
                    >
                      <Merge className="h-4 w-4" />
                      Merge Selected
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {group.status === 'pending' && (
                          <Checkbox
                            checked={(selectedRecords[group.id] || []).includes(record.id)}
                            onCheckedChange={() => toggleRecordSelection(group.id, record.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{record.email}</TableCell>
                      <TableCell>{record.phone}</TableCell>
                      <TableCell>{record.company}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.source}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.createdAt}</TableCell>
                      <TableCell className="text-muted-foreground">{record.lastActivity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DuplicateDetection;

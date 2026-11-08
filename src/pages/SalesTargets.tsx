import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search as SearchIcon,
  Download,
  Edit2,
  Target as TargetIcon
} from 'lucide-react';
import { SalesTargetDrawer } from '@/components/settings/SalesTargetDrawer';
import { salesTeamService } from '@/services/salesTeamService';
import { salesTargetService, SalesTarget } from '@/services/salesTargetService';
import { SalesTeam } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const SalesTargets = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [teams, setTeams] = useState<SalesTeam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchTargets();
  }, []);

  const fetchTeams = async () => {
    try {
      const teamsData = await salesTeamService.getSalesTeams();
      setTeams(teamsData);
    } catch (error: any) {
      toast.error('Failed to fetch teams: ' + error.message);
    }
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const targetsData = await salesTargetService.getSalesTargets();
      setTargets(targetsData);
    } catch (error: any) {
      toast.error('Failed to fetch targets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTarget = async (targetData: any, memberBreakdown: any[]) => {
    setLoading(true);
    try {
      if (editingTarget) {
        await salesTargetService.updateSalesTarget(editingTarget.id, targetData, memberBreakdown);
        toast.success('Target updated');
      } else {
        await salesTargetService.createSalesTarget(targetData, memberBreakdown);
        toast.success('Target created');
      }
      setIsDrawerOpen(false);
      fetchTargets();
    } catch (error: any) {
      toast.error('Failed to save target: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (target: SalesTarget) => {
    try {
      setLoading(true);
      const fullTarget = await salesTargetService.getSalesTargetById(target.id);
      setEditingTarget(fullTarget);
      setIsDrawerOpen(true);
    } catch (error: any) {
      toast.error('Failed to fetch target details');
    } finally {
      setLoading(false);
    }
  };

  const filteredTargets = targets.filter(target => {
    const matchesSearch = target.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.team_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || target.target_type === typeFilter;
    const matchesPeriod = periodFilter === 'All' || target.period === periodFilter;
    const matchesStatus = statusFilter === 'All' || target.status === statusFilter;

    return matchesSearch && matchesType && matchesPeriod && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/30 min-h-screen">
      <Header title="Sales Targets" />

      <div className="p-4 md:p-6 space-y-4 flex-1 overflow-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Filters Bar */}
          <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-white justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative min-w-[300px]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search targets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Type</span>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px] h-10 border-slate-200">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Period</span>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[120px] h-10 border-slate-200">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Status</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-10 border-slate-200">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="On Track">On Track</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Achieved">Achieved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingTarget(null);
                  setIsDrawerOpen(true);
                }}
                className="bg-primary hover:bg-primary/95 text-white gap-2 px-5 h-10"
              >
                <Plus className="h-4 w-4" />
                New Sales Target
              </Button>
              <Button variant="outline" className="h-10 border-slate-200 text-slate-600 gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-slate-500 font-semibold py-4 pl-6">Target</TableHead>
                  <TableHead className="text-slate-500 font-semibold py-4">Assigned To</TableHead>
                  <TableHead className="text-slate-500 font-semibold py-4">Type</TableHead>
                  <TableHead className="text-slate-500 font-semibold py-4">Period</TableHead>
                  <TableHead className="text-slate-500 font-semibold py-4">Progress</TableHead>
                  <TableHead className="text-slate-500 font-semibold py-4">Status</TableHead>
                  <TableHead className="text-slate-500 font-semibold py-4 text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTargets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <TargetIcon className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-base font-medium">No sales targets found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTargets.map((target) => (
                    <TableRow key={target.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell className="py-4 pl-6">
                        <span
                          className="font-semibold text-primary hover:underline cursor-pointer"
                          onClick={() => navigate(`/sales-targets/${target.id}`)}
                        >
                          {target.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-slate-500 font-medium">
                        {target.team_name}
                      </TableCell>
                      <TableCell className="py-4 text-slate-500 font-medium">
                        {target.target_type}
                      </TableCell>
                      <TableCell className="py-4 text-slate-500 font-medium">
                        {target.period}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3 w-40">
                          <div className="relative flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                target.status === 'On Track' ? "bg-emerald-500" :
                                  target.status === 'At Risk' ? "bg-rose-500" : "bg-blue-600"
                              )}
                              style={{ width: `${target.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-400 w-8">{target.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={cn(
                            "rounded-md px-2.5 py-0.5 font-semibold text-xs border-0 shadow-none",
                            target.status === 'On Track' ? "bg-emerald-50 text-emerald-600" :
                              target.status === 'At Risk' ? "bg-rose-50 text-rose-600" :
                                "bg-blue-50 text-blue-600"
                          )}
                        >
                          {target.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(target)}
                          className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <SalesTargetDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSave={handleSaveTarget}
        editingTarget={editingTarget}
        teams={teams}
      />
    </div>
  );
};

export default SalesTargets;

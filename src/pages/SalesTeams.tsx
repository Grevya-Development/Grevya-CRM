import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
     Plus,
    Edit2,
    Users as UsersIcon,
    SearchIcon
} from 'lucide-react';
import { SalesTeamDrawer } from '@/components/settings/SalesTeamDrawer';
import { salesTeamService } from '@/services/salesTeamService';
import { SalesTeam } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SalesTeams() {
    const [teams, setTeams] = useState<SalesTeam[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<SalesTeam | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teamsData, usersData] = await Promise.all([
                salesTeamService.getSalesTeams(),
                salesTeamService.getAllUsers()
            ]);
            setTeams(teamsData);
            setUsers(usersData);
        } catch (error: any) {
            toast.error('Failed to fetch data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTeam = async (teamData: Partial<SalesTeam>, memberIds: string[]) => {
        try {
            if (editingTeam) {
                await salesTeamService.updateSalesTeam(editingTeam.id, teamData, memberIds);
                toast.success('Team updated successfully');
            } else {
                await salesTeamService.createSalesTeam(teamData, memberIds);
                toast.success('Team created successfully');
            }
            fetchData();
        } catch (error: any) {
            throw error;
        }
    };

    const handleEdit = (team: SalesTeam) => {
        setEditingTeam(team);
        setIsDrawerOpen(true);
    };

    const filteredTeams = teams.filter(team => {
        const matchesSearch =
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.manager?.full_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || team.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col h-full bg-slate-50/30 min-h-screen">
            <Header title="Sales Teams" />

            <div className="p-4 md:p-6 space-y-4 flex-1 overflow-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-64 flex flex-col">
                    {/* Filters Bar */}
                    <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-white">
                        <div className="relative flex-1 min-w-[300px]">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search team name or manager"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Status</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10 border-slate-200 font-medium">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingTeam(null);
                                setIsDrawerOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/95 text-white gap-2 px-5 h-10 ml-auto"
                        >
                            <Plus className="h-4 w-4" />
                            New Team
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-slate-500 font-semibold py-4 pl-6">Team Name</TableHead>
                                    <TableHead className="text-slate-500 font-semibold py-4">Manager</TableHead>
                                    <TableHead className="text-slate-500 font-semibold py-4">Members</TableHead>
                                    <TableHead className="text-slate-500 font-semibold py-4">Created Date</TableHead>
                                    <TableHead className="text-slate-500 font-semibold py-4">Status</TableHead>
                                    <TableHead className="text-slate-500 font-semibold py-4 text-right pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell colSpan={6} className="h-16 bg-slate-50/20"></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredTeams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <UsersIcon className="h-10 w-10 mb-2 opacity-20" />
                                                <p className="text-base font-medium">No sales teams found</p>
                                                <p className="text-sm">Try adjusting your filters or search terms</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTeams.map((team) => (
                                        <TableRow key={team.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                            <TableCell className="py-4 pl-6">
                                                <span className="font-semibold text-primary hover:underline cursor-pointer">
                                                    {team.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 ring-2 ring-rose-100">
                                                        <AvatarImage src={team.manager?.avatar_url} />
                                                        <AvatarFallback className="bg-rose-50 text-rose-500 text-xs font-bold">
                                                            {team.manager?.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-slate-700">{team.manager?.full_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {team.members?.slice(0, 3).map((member, i) => (
                                                        <Avatar key={i} className="h-8 w-8 ring-2 ring-white inline-block">
                                                            <AvatarImage src={member.avatar_url} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                                {member.full_name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {team.members && team.members.length > 3 && (
                                                        <div className="h-8 w-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-500 ring-2 ring-white">
                                                            +{team.members.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-slate-500 font-medium">
                                                {format(new Date(team.created_at), 'MMM d, yyyy hh:mm a')}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge
                                                    className={cn(
                                                        "rounded-md px-2.5 py-0.5 font-semibold text-xs border-0 shadow-none",
                                                        team.status === 'Active'
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-slate-100 text-slate-500"
                                                    )}
                                                >
                                                    {team.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(team)}
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

            <SalesTeamDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onSave={handleSaveTeam}
                editingTeam={editingTeam}
                users={users}
            />
        </div>
    );
}

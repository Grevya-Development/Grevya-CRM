import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    Calendar as CalendarIcon,
    Edit2,
    Plus,
    Target as TargetIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SalesTeam } from '@/types';
import { toast } from 'sonner';

interface SalesTargetMember {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    target_value: string | number;
}

interface SalesTargetDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (target: any, memberBreakdown: any[]) => Promise<void>;
    editingTarget?: any | null;
    teams: SalesTeam[];
}

export const SalesTargetDrawer: React.FC<SalesTargetDrawerProps> = ({
    open,
    onOpenChange,
    onSave,
    editingTarget,
    teams
}) => {
    const [targetName, setTargetName] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [targetType, setTargetType] = useState<string>('');
    const [targetValue, setTargetValue] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [period, setPeriod] = useState<string>('');
    const [members, setMembers] = useState<SalesTargetMember[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const startDateRef = React.useRef<HTMLInputElement>(null);
    const endDateRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingTarget) {
            setTargetName(editingTarget.name);
            setSelectedTeamId(editingTarget.team_id);
            setTargetType(editingTarget.target_type);
            setTargetValue(editingTarget.target_value.toString());
            setStartDate(editingTarget.start_date);
            setEndDate(editingTarget.end_date);
            setPeriod(editingTarget.period);
            setMembers(editingTarget.members || []);
        } else {
            setTargetName('');
            setSelectedTeamId('');
            setTargetType('');
            setTargetValue('');
            setStartDate('');
            setEndDate('');
            setPeriod('');
            setMembers([]);
        }
    }, [editingTarget, open]);

    useEffect(() => {
        if (selectedTeamId && !editingTarget) {
            const team = teams.find(t => t.id === selectedTeamId);
            if (team && team.members) {
                setMembers(team.members.map(m => ({
                    user_id: m.user_id,
                    full_name: m.full_name,
                    avatar_url: m.avatar_url,
                    target_value: ''
                })));
            }
        }
    }, [selectedTeamId, teams, editingTarget]);

    const handleMemberTargetChange = (userId: string, value: string) => {
        setMembers(prev => prev.map(m =>
            m.user_id === userId ? { ...m, target_value: value } : m
        ));
    };

    const handleStartDateChange = (value: string) => {
        setStartDate(value);
        if (endDate && value && new Date(value) > new Date(endDate)) {
            setEndDate('');
        }
    };

    const handleSave = async () => {
        if (!targetName.trim()) {
            toast.error('Target name is required');
            return;
        }
        if (!selectedTeamId) {
            toast.error('Team is required');
            return;
        }
        if (!targetType) {
            toast.error('Target type is required');
            return;
        }
        if (!targetValue) {
            toast.error('Target value is required');
            return;
        }
        if (!startDate) {
            toast.error('Start date is required');
            return;
        }
        if (!endDate) {
            toast.error('End date is required');
            return;
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error('End date must be after start date');
            return;
        }
        if (!period) {
            toast.error('Period is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(
                {
                    name: targetName,
                    team_id: selectedTeamId,
                    target_type: targetType,
                    target_value: parseFloat(targetValue),
                    start_date: startDate,
                    end_date: endDate,
                    period: period,
                },
                members.map(m => ({
                    ...m,
                    target_value: parseFloat(m.target_value.toString()) || 0
                }))
            );
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save target');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SideDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={editingTarget ? 'Edit Sales Target' : 'Create Sales Target'}
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
            submitLabel={editingTarget ? 'Update Target' : 'Create'}
        >
            {/* Target Name */}
            <div className="space-y-2">
                <Label htmlFor="targetName" className="text-sm font-medium text-slate-700">
                    Target Name <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                    id="targetName"
                    placeholder="eg: Q1 Revenue Goal"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="h-11"
                />
            </div>

            {/* Assign To Team */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                    Assign To Team <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                        {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                                {team.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Target Type */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                        Target Type <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Select value={targetType} onValueChange={setTargetType}>
                        <SelectTrigger className="h-11">
                            <div className="flex items-center">
                                <SelectValue placeholder="Select type" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Revenue">Revenue</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="Products">Products</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Target Value */}
                <div className="space-y-2">
                    <Label htmlFor="targetValue" className="text-sm font-medium text-slate-700">
                        Target Value <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input
                        id="targetValue"
                        type="number"
                        placeholder="eg: 500000"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        onFocus={(e) => {
                            if (e.target.value === '0') {
                                setTargetValue('');
                            }
                        }}
                        className="h-11"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                        Start Date <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <div className="relative group">
                        <Input
                            id="startDate"
                            type="date"
                            ref={startDateRef}
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="h-11 border-slate-200 focus:ring-primary/20 appearance-none"
                        />
                        <CalendarIcon
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer group-focus-within:text-primary transition-colors"
                            onClick={() => startDateRef.current?.showPicker()}
                        />
                    </div>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                        End Date <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <div className="relative group">
                        <Input
                            id="endDate"
                            type="date"
                            ref={endDateRef}
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-11 border-slate-200 focus:ring-primary/20 appearance-none"
                        />
                        <CalendarIcon
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer group-focus-within:text-primary transition-colors"
                            onClick={() => endDateRef.current?.showPicker()}
                        />
                    </div>
                </div>
            </div>

            {/* Period */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                    Period <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="h-11">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Select period" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Team Members Breakdown */}
            {members.length > 0 && (
                <div className="pt-2">
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm font-bold text-slate-800">Team Members</span>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                            {members.map((member) => (
                                <div key={member.user_id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                                {member.full_name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {member.full_name || 'User'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Set Target"
                                            value={member.target_value}
                                            onChange={(e) => handleMemberTargetChange(member.user_id, e.target.value)}
                                            onFocus={(e) => {
                                                if (e.target.value === '0') {
                                                    handleMemberTargetChange(member.user_id, '');
                                                }
                                            }}
                                            className="h-9 w-28 text-right pr-2 border-slate-200 focus:ring-primary/20"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 border-slate-200 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </SideDrawer>
    );
};

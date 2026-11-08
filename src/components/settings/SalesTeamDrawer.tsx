import React, { useState, useEffect } from 'react';
import {
    X,
    User,
    Users as UsersIcon,
    ChevronDown,
    Check,
    Search,
    Plus
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { SalesTeam } from '@/types';
import { toast } from 'sonner';

interface SalesTeamDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (team: Partial<SalesTeam>, memberIds: string[]) => Promise<void>;
    editingTeam?: SalesTeam | null;
    users: any[];
}

export const SalesTeamDrawer: React.FC<SalesTeamDrawerProps> = ({
    open,
    onOpenChange,
    onSave,
    editingTeam,
    users
}) => {
    const [teamName, setTeamName] = useState('');
    const [managerId, setManagerId] = useState<string>('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingTeam) {
            setTeamName(editingTeam.name);
            setManagerId(editingTeam.manager_id);
            setSelectedMemberIds(editingTeam.members?.map(m => m.user_id) || []);
            setStatus(editingTeam.status);
        } else {
            setTeamName('');
            setManagerId('');
            setSelectedMemberIds([]);
            setStatus('Active');
        }
    }, [editingTeam, open]);

    const handleSave = async () => {
        if (!teamName.trim()) {
            toast.error('Team name is required');
            return;
        }
        if (!managerId) {
            toast.error('Team manager is required');
            return;
        }
        if (selectedMemberIds.length === 0) {
            toast.error('At least one team member is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(
                {
                    name: teamName,
                    manager_id: managerId,
                    status: status
                },
                selectedMemberIds
            );
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save team');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMemberIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const removeMember = (userId: string) => {
        setSelectedMemberIds(prev => prev.filter(id => id !== userId));
    };

    return (
        <SideDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={editingTeam ? 'Edit Sales Team' : 'Create Sales Team'}
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
            submitLabel={editingTeam ? 'Update Team' : 'Create Team'}
        >
            {/* Team Name */}
            <div className="space-y-2">
                <Label htmlFor="teamName" className="text-sm font-medium text-slate-700">
                    Team Name <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                    id="teamName"
                    placeholder="eg: Enterprise Sales"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="h-11"
                />
            </div>

            {/* Team Manager */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                    Team Manager <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Select value={managerId} onValueChange={setManagerId}>
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-3 py-1">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            {user.full_name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.full_name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                    Team Member <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-11 text-muted-foreground font-normal bg-white"
                        >
                            Select member
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search member..." />
                            <CommandList>
                                <CommandEmpty>No member found.</CommandEmpty>
                                <CommandGroup className="p-2">
                                    {users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.full_name}
                                            onSelect={() => {
                                                toggleMember(user.id);
                                            }}
                                            className="flex items-center justify-between rounded-md p-2 cursor-pointer hover:bg-muted"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                                                        {user.full_name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedMemberIds.includes(user.id) && (
                                                    <Check className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Selected Members Badges */}
                {selectedMemberIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 p-4 border rounded-lg bg-gray-50/50">
                        {selectedMemberIds.map(id => {
                            const member = users.find(u => u.id === id);
                            if (!member) return null;
                            return (
                                <Badge
                                    key={id}
                                    variant="secondary"
                                    className="flex items-center gap-2 pl-1 pr-1.5 py-1 bg-white border shadow-sm rounded-md"
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={member.avatar_url} />
                                        <AvatarFallback className="bg-muted text-[10px] font-bold">
                                            {member.full_name?.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-slate-700">{member.full_name}</span>
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive text-slate-400"
                                        onClick={() => removeMember(id)}
                                    />
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Team Status */}
            <div className="border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Team Status</Label>
                    </div>
                    <Switch
                        checked={status === 'Active'}
                        onCheckedChange={(checked) => setStatus(checked ? 'Active' : 'Inactive')}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                </div>
            </div>
        </SideDrawer>
    );
};

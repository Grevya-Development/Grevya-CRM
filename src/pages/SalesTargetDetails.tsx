import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import {
    Edit2,
    Calendar as CalendarIcon,
    Target as TargetIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SideDrawer } from '@/components/ui/SideDrawer';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { salesTargetService, SalesTarget } from '@/services/salesTargetService';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';

const SalesTargetDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [target, setTarget] = useState<SalesTarget | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any | null>(null);
    const [newTargetValue, setNewTargetValue] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTargetDetails(id);
        }
    }, [id]);

    const fetchTargetDetails = async (targetId: string) => {
        try {
            setLoading(true);
            const data = await salesTargetService.getSalesTargetById(targetId);
            setTarget(data);
        } catch (error: any) {
            toast.error('Failed to fetch target details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditMember = (member: any) => {
        setEditingMember(member);
        setNewTargetValue(member.target_value.toString());
        setIsMemberDrawerOpen(true);
    };

    const handleSaveMemberTarget = async () => {
        if (!editingMember || !id) return;

        try {
            setIsUpdating(true);
            const value = parseFloat(newTargetValue);
            if (isNaN(value)) {
                toast.error('Please enter a valid target value');
                return;
            }

            await salesTargetService.updateSalesTargetMember(editingMember.id, value);
            toast.success('Member target updated successfully');
            setIsMemberDrawerOpen(false);
            fetchTargetDetails(id);
        } catch (error: any) {
            toast.error('Failed to update member target: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!target) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <TargetIcon className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Sales target not found</p>
                <Button variant="link" onClick={() => navigate('/sales-targets')}>
                    Back to list
                </Button>
            </div>
        );
    }

    const daysLeft = differenceInDays(parseISO(target.end_date), new Date());
    const remaining = Math.max(0, target.target_value - (target.current_value || 0));
    const progress = target.target_value > 0 ? Math.round(((target.current_value || 0) / target.target_value) * 100) : 0;

    return (
        <div className="flex flex-col h-full bg-slate-50/30 min-h-screen">
            <div className="shrink-0">
                <Header
                    title={target.name}
                    subtitle="Sales Target Details"
                />
            </div>

            <div className="p-4 md:p-6 pb-2 space-y-4">

                {/* Metrics Grid */}
                <div className="p-6 pt-2 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <MetricCard label="Target" value={target.target_value.toLocaleString()} />
                    <MetricCard label="Achieved" value={(target.current_value || 0).toLocaleString()} />
                    <MetricCard label="Remaining" value={remaining.toLocaleString()} />
                    <MetricCard label="Progress" value={`${progress}%`} />
                    <MetricCard label="Days Left" value={Math.max(0, daysLeft).toString()} />
                </div>

                <div className="p-6 pt-2 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                    {/* Sidebar Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-xl">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Details</h3>

                                    {/* Manager Info */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <Avatar className="h-10 w-10 border border-slate-100">
                                            <AvatarImage src={target.manager?.avatar_url} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                {target.manager?.full_name?.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{target.manager?.full_name}</div>
                                            <div className="text-xs text-slate-500 font-medium">Sales Manager</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <DetailItem label="Target Type" value={target.target_type} />
                                    <DetailItem label="Period" value={target.period} />
                                    <DetailItem label="Start Date" value={format(parseISO(target.start_date), 'MMM d, yyyy')} />
                                    <DetailItem label="End Date" value={format(parseISO(target.end_date), 'MMM d, yyyy')} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content - Member Table */}
                    <div className="lg:col-span-3">
                        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden h-full flex flex-col">
                            <div className="overflow-auto flex-1">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="text-slate-500 font-semibold py-4 pl-6">Name</TableHead>
                                            <TableHead className="text-slate-500 font-semibold py-4">Target Value</TableHead>
                                            <TableHead className="text-slate-500 font-semibold py-4">Achieved</TableHead>
                                            <TableHead className="text-slate-500 font-semibold py-4">Date</TableHead>
                                            <TableHead className="text-slate-500 font-semibold py-4">Status</TableHead>
                                            <TableHead className="text-slate-500 font-semibold py-4 text-right pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(target.members || []).map((member) => (
                                            <TableRow key={member.user_id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-slate-700">{member.full_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-slate-500 font-medium">
                                                    {member.target_value.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-4 text-slate-500 font-medium">
                                                    {(member.achieved_value || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-4 text-slate-500 font-medium">
                                                    {format(new Date(), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-0 shadow-none font-semibold text-xs rounded-md">
                                                        {member.status || 'In progress'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 text-right pr-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditMember(member)}
                                                        className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <SideDrawer
                open={isMemberDrawerOpen}
                onOpenChange={setIsMemberDrawerOpen}
                title={`Edit Target: ${editingMember?.full_name}`}
                onSubmit={handleSaveMemberTarget}
                isSubmitting={isUpdating}
                submitLabel="Update Target"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="target_value">Target Value</Label>
                        <Input
                            id="target_value"
                            type="number"
                            value={newTargetValue}
                            onChange={(e) => setNewTargetValue(e.target.value)}
                            placeholder="Enter target value"
                        />
                    </div>
                </div>
            </SideDrawer>
        </div>
    );
};

const MetricCard = ({ label, value }: { label: string; value: string }) => (
    <Card className="border-slate-200/50 shadow-sm rounded-[24px] overflow-hidden relative bg-[#F8FAFC]">
        {/* Decorative diagonal light shape */}
        <div
            className="absolute top-0 right-0 w-1/2 h-full bg-white/40 pointer-events-none"
            style={{
                clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)'
            }}
        />
        <CardContent className="p-4 relative z-10">
            <div className="space-y-6">
                <p className="text-lg font-medium text-slate-600">{label}</p>
                <p className="text-2xl font-bold text-[#0F172A] tracking-tight tabular-nums">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
);

export default SalesTargetDetails;

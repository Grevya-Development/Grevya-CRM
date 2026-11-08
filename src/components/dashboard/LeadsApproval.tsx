import { useState } from 'react';
import { Check, X, Clock, DollarSign, User, Building2 } from 'lucide-react';
import { Modal } from 'antd';
import { approvalRequests as initialApprovals } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LeadsApproval() {
    const [approvals, setApprovals] = useState(initialApprovals);

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        Modal.confirm({
            title: action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection',
            content: `Are you sure you want to ${action} this Leads?`,
            okText: action === 'approve' ? 'Approve' : 'Reject',
            cancelText: 'Cancel',
            icon: null,
            okButtonProps: {
                danger: action === 'reject',
            },
            onOk() {
                // api 
                setApprovals(prev => prev.filter(req => req.id !== id));
            },
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'medium':
                return 'bg-warning/10 text-warning border-warning/20';
            default:
                return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-slide-up h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">
                    Pending Approvals
                </h3>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
                {approvals.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No pending approvals
                    </div>
                ) : (
                    approvals.slice(0, 5).map((request) => (
                        <div
                            key={request.id}
                            className="p-2.5 rounded-lg border border-border bg-secondary/10 hover:bg-secondary/20 transition-colors flex items-center justify-between gap-3"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-medium text-foreground leading-tight truncate">
                                        {request.LeadsTitle}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <span className="truncate">{request.companyName} • {request.ownerName}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {request.type.replace('-', ' ')}
                                    </span>
                                    <span className={cn(
                                        'text-xs font-semibold px-2 py-0.5 rounded',
                                        getPriorityColor(request.priority)
                                    )}>
                                        {request.priority}
                                    </span>
                                </div>
                            </div>

                            {/* ACTION ICONS */}
                            <div className="flex gap-1 shrink-0">
                                {/* APPROVE */}
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded
                                               border-emerald-500/40
                                               text-emerald-600
                                               hover:bg-emerald-50
                                               hover:border-emerald-600
                                               hover:text-emerald-700
                                               transition-colors"
                                    onClick={() =>
                                        handleAction(request.id, 'approve')
                                    }
                                    title="Approve"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>

                                {/* REJECT */}
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded
                                               border-red-500/40
                                               text-red-600
                                               hover:bg-red-50
                                               hover:border-red-600
                                               hover:text-red-700
                                               transition-colors"
                                    onClick={() =>
                                        handleAction(request.id, 'reject')
                                    }
                                    title="Reject"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

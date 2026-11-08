import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StageHistoryItem {
    id: string;
    stage: string;
    amount: string;
    duration: number;
    modifiedBy: {
        name: string;
        avatar?: string;
        initials: string;
        timestamp: string;
    };
}

const MOCK_STAGE_HISTORY: StageHistoryItem[] = [
    {
        id: '1',
        stage: 'Qualification',
        amount: 'Rs. 45,000.00',
        duration: 10,
        modifiedBy: {
            name: 'Siva Kumar',
            initials: 'SS',
            timestamp: 'Feb 20, 2026 10:20 AM'
        }
    }
];

export const StageHistoryTabContent = () => {
    return (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Stage</TableHead>
                            <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Amount</TableHead>
                            <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Stage Duration (In Days)</TableHead>
                            <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Modified By</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_STAGE_HISTORY.map((item) => (
                            <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                <TableCell className="py-4">
                                    <span className="text-blue-600 font-semibold text-[14px]">{item.stage}</span>
                                </TableCell>
                                <TableCell className="py-4 text-slate-600 font-medium text-[14px]">
                                    {item.amount}
                                </TableCell>
                                <TableCell className="py-4 text-slate-600 font-medium text-[14px]">
                                    {item.duration}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-slate-100">
                                            <AvatarImage src={item.modifiedBy.avatar} />
                                            <AvatarFallback className="bg-pink-100 text-pink-600 text-xs font-bold">
                                                {item.modifiedBy.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-slate-500 text-[13px] font-medium">
                                            {item.modifiedBy.timestamp}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

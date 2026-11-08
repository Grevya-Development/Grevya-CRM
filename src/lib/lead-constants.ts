import {
    SearchCheck,
    BarChart,
    Lightbulb,
    Users,
    FileSpreadsheet,
    Handshake,
    Trophy,
    XCircle,
    LucideIcon
} from 'lucide-react';

export interface StageConfig {
    name: string;
    color: string;
    icon: LucideIcon;
}

export const LEAD_STAGES_CONFIG: StageConfig[] = [
    { name: "Qualification", color: "bg-blue-500", icon: SearchCheck },
    { name: "Needs Analysis", color: "bg-indigo-500", icon: BarChart },
    { name: "Value Proposition", color: "bg-purple-500", icon: Lightbulb },
    { name: "Identify Decision Makers", color: "bg-violet-500", icon: Users },
    { name: "Proposal", color: "bg-sky-500", icon: FileSpreadsheet },
    { name: "Negotiation", color: "bg-amber-500", icon: Handshake },
    { name: "Won", color: "bg-emerald-500", icon: Trophy },
    { name: "Lost", color: "bg-rose-500", icon: XCircle }
];

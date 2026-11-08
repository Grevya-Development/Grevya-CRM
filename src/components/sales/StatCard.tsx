import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    className?: string;
    isLoading?: boolean;
}

export const StatCard = ({
    title,
    value,
    icon: Icon,
    className,
    isLoading = false,
}: StatCardProps) => {
    const getIconColor = (t: string) => {
        switch (t.toLowerCase()) {
            case 'total products': return 'text-blue-600';
            case 'active products': return 'text-green-600';
            case 'inactive products': return 'text-yellow-600';
            case 'discontinued': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <Card className={`${className} flex-1 min-w-[200px]`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        {isLoading ? (
                            <div className="h-8 mt-1 w-20 bg-gray-200 rounded animate-pulse" />
                        ) : (
                            <p className={`text-2xl font-bold mt-1 ${getIconColor(title)}`}>{value}</p>
                        )}
                    </div>
                    <div className="p-3 rounded-lg">
                        {!isLoading && <Icon className={`h-6 w-6 ${getIconColor(title)}`} />}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

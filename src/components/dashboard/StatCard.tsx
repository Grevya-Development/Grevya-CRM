import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  chartData?: number[];
  averageValue?: string;
  barColor?: string; // Custom bar color for each card
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  chartData = [40, 60, 45, 70, 55, 80, 65],
  averageValue,
  barColor,
}: StatCardProps) {
  const maxValue = Math.max(...chartData, 0);

  // Determine colors based on changeType or custom barColor
  const getColors = () => {
    // If custom barColor is provided, use it
    if (barColor) {
      return {
        barColor: barColor,
        pillBg: changeType === 'positive' ? 'bg-[#DCFCE7]' : 'bg-[#FFE4E6]',
        pillText: changeType === 'positive' ? 'text-[#16A34A]' : 'text-[#E11D48]',
      };
    }

    // Otherwise use default colors based on changeType
    if (changeType === 'positive') {
      return {
        barColor: 'bg-[#7CA982]', // Muted green
        pillBg: 'bg-[#DCFCE7]', // Light green
        pillText: 'text-[#16A34A]', // Green text
      };
    } else {
      return {
        barColor: 'bg-[#C17B7B]', // Muted red
        pillBg: 'bg-[#FFE4E6]', // Light red
        pillText: 'text-[#E11D48]', // Red text
      };
    }
  };

  const colors = getColors();

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 group">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-40 h-40 opacity-[0.06] pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M0 0 
         L140 0 
         C110 30, 80 55, 0 120 
         Z"
            fill="currentColor"
            className="text-gray-900"
          />
        </svg>
      </div>
      {/* Content wrapper */}
      <div className="relative px-5 py-4">
        {/* Top section: Title and Main Value */}
        <div className="flex items-start justify-between mb-3 gap-4">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-medium text-[#9CA3AF] dark:text-gray-400 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </p>
            <p className="text-lg leading-tight font-bold text-[#1F2937] dark:text-foreground tracking-tight truncate">
              {value}
            </p>
          </div>

          {/* Right side: Mini bar chart */}
          <div className="flex items-end gap-[2px] h-[50px] flex-shrink-0">
            {chartData.map((val, index) => (
              <div
                key={index}
                className={cn(
                  "w-[14px] rounded-[2px] transition-all",
                  colors.barColor
                )}
                style={{
                  // Keep a small stub visible when a week (or every week) is zero.
                  height: `${maxValue > 0 ? Math.max(6, (val / maxValue) * 100) : 6}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-gray-200 via-gray-100 to-transparent dark:from-border/40 dark:via-border/20 mb-3" />

        {/* Bottom section: Average value and arrow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Pill badge with average value */}
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold",
                colors.pillBg,
                colors.pillText
              )}
            >
              {averageValue || change}
            </span>

            {/* "average size" text */}
            {(averageValue || change) && (
              <span className="text-xs font-normal text-[#9CA3AF] dark:text-muted-foreground">
                {averageValue ? change : "average size"}
              </span>
            )}
          </div>

          {/* Arrow icon */}
          <ArrowRight
            className="h-4 w-4 text-[#60A5FA] dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-200"
            strokeWidth={2}
          />
        </div>
      </div>
    </div>
  );
}

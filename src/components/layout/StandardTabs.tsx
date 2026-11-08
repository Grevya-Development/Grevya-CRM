import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
    label: string | ReactNode;
    icon?: ReactNode;
    count?: number;
}

interface StandardTabsProps {
    tabs: TabItem[];
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children?: ReactNode;
    className?: string;
    tabsListClassName?: string;
    contentContainerClassName?: string;
    noContainer?: boolean;
}

export function StandardTabs({
    tabs,
    defaultValue,
    value,
    onValueChange,
    children,
    className,
    tabsListClassName,
    contentContainerClassName,
    noContainer = false
}: StandardTabsProps) {
    return (
        <Tabs
            defaultValue={defaultValue}
            value={value}
            onValueChange={onValueChange}
            className={cn("w-full space-y-0 flex flex-col", className)}
        >
            <div className="flex items-center shrink-0 w-full overflow-x-auto no-scrollbar">
                <TabsList className={cn("bg-transparent p-0 w-auto flex justify-start items-end h-[46px] gap-[1px] min-w-max", tabsListClassName)}>
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className={cn(
                                "data-[state=active]:bg-white data-[state=active]:text-[#2563eb] data-[state=active]:border-t-2 data-[state=active]:border-t-[#2563eb] text-[#64748b] bg-[#E8EAED] rounded-t-[6px] rounded-b-none px-4 h-[46px] text-[14px] font-medium font-['Instrument_Sans'] transition-all shadow-sm border-t border-l border-r border-b-0 border-slate-200 hover:bg-slate-50 opacity-100 flex items-center gap-2"
                            )}
                        >
                            {tab.icon && React.isValidElement(tab.icon) && React.cloneElement(tab.icon as React.ReactElement, { size: 18, className: cn((tab.icon as any).props?.className) })}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full ml-1 font-bold">
                                    {tab.count}
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            {noContainer ? (
                children
            ) : (
                <div className={cn(
                    "bg-white border border-slate-200 rounded-lg rounded-tl-none shadow-sm p-6 -mt-[1px] relative z-10 m-0 flex-1",
                    contentContainerClassName
                )}>
                    {children}
                </div>
            )}
        </Tabs>
    );
}

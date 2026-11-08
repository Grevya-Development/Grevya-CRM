import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date;
    setDate: (date?: Date) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ date, setDate, label, placeholder = "", className }: DatePickerProps) {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = !!date;

    return (
        <div className={cn("space-y-1 w-full", className)}>
            <Popover onOpenChange={(open) => setIsFocused(open)}>
                <div className="relative w-full group">
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "peer flex h-[44px] w-full items-center justify-start rounded-[6px] border border-slate-300 bg-white px-3 pt-4 pb-1 text-[14px] font-normal text-black transition-all hover:bg-white focus:bg-white focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-100 disabled:text-black font-['Instrument_Sans']",
                                !date && "text-transparent",
                                isFocused && "border-primary ring-0"
                            )}
                        >
                            {date && format(date, "PPP")}
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors mt-1.5" />
                        </Button>
                    </PopoverTrigger>
                    <label
                        className={cn(
                            "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                            "text-[#0B1A3C99] text-[14px] top-1/2 -translate-y-1/2",
                            (isFocused || hasValue) ? "top-0 text-[12px] text-primary" : "",
                        )}
                    >
                        {label}
                    </label>
                </div>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

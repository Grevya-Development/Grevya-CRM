import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface FloatingLabelSelectProps {
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  options?: { label: string; value: string }[];
  onChange?: (value: string) => void;
}

export const FloatingLabelSelect = ({
  items: initialItems,
  value,
  onValueChange,
  placeholder,
  disabled,
  label,
  required,
  error,
  className,
  options,
  onChange
}: FloatingLabelSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const items = initialItems || options || [];
  const handleValueChange = onValueChange || onChange || (() => { });

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative w-full group">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "peer w-full justify-between bg-white border border-slate-300 h-11 rounded-[6px] text-sm pl-[12px] pr-3 font-['Instrument_Sans'] font-normal hover:bg-slate-50 hover:text-black focus:ring-0 focus:ring-offset-0 focus:border-primary focus:outline-none focus:bg-white",
                label ? "pt-4 pb-1" : "py-2",
                disabled ? "opacity-100 text-black cursor-not-allowed" : "text-black",
                error && "border-red-500 focus:border-red-500"
              )}
            >
              {value
                ? <span className="text-black truncate text-left flex-1">{items.find((item) => item.value === value)?.label || value}</span>
                : <span className={cn("text-[#0B1A3C99]", label && "invisible")}>{placeholder}</span>}
              <div className="flex items-center gap-2">
                <span className="h-[6px] w-[6px] border-b-[1.5px] border-r-[1.5px] border-black rotate-45 shrink-0 mb-[3px]" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search..." className="text-black placeholder:text-[#0B1A3C99]" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={() => {
                        handleValueChange(item.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {label && (
          <label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
              "text-[#0B1A3C99] text-[14px] top-1/2 -translate-y-1/2",
              "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
              (value || open) ? "top-0 text-[12px] text-primary" : "",
              error && "text-red-500 peer-focus:text-red-500"
            )}
          >
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};

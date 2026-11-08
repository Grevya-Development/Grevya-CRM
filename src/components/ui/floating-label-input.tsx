import * as React from "react";
import { cn } from "@/lib/utils";
import { EMAIL_REGEX, PHONE_REGEX } from "@/lib/constants";

const emailRegex = EMAIL_REGEX;
const phoneRegex = PHONE_REGEX;

export interface FloatingLabelInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    suffix?: React.ReactNode;
    error?: string;
    isValid?: boolean;
    isInvalid?: boolean;
    validationType?: 'email' | 'phone';
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
    ({ className, type, label, value, defaultValue, onChange, suffix, error, isValid, isInvalid, validationType, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Merge refs: the one from forwardRef and our local inputRef
        React.useImperativeHandle(ref, () => inputRef.current!);

        const hasValue = (value !== undefined && value !== "") || (defaultValue !== undefined && defaultValue !== "");

        const handleSuffixClick = () => {
            if (inputRef.current) {
                // For date/time inputs, show the native picker
                if (type === "date" || type === "time" || type === "datetime-local") {
                    try {
                        // @ts-ignore - showPicker is modern but might not be in all TS types yet
                        if (typeof inputRef.current.showPicker === 'function') {
                            inputRef.current.showPicker();
                        } else {
                            inputRef.current.focus();
                        }
                    } catch (e) {
                        inputRef.current.focus();
                    }
                } else {
                    inputRef.current.focus();
                }
            }
        };

        // Auto-validation logic
        let effectiveIsValid = isValid;
        let effectiveIsInvalid = isInvalid;

        if (validationType && value) {
            const stringValue = String(value);
            if (validationType === 'email') {
                effectiveIsValid = emailRegex.test(stringValue);
                effectiveIsInvalid = !effectiveIsValid;
            } else if (validationType === 'phone') {
                effectiveIsValid = phoneRegex.test(stringValue);
                effectiveIsInvalid = !effectiveIsValid;
            }
        }

        return (
            <div className={cn("space-y-1 w-full", className)}>
                <div className="relative w-full group">
                    <input
                        type={type}
                        className={cn(
                            "peer flex h-[44px] w-full rounded-[6px] border border-slate-300 bg-white px-3 pt-4 pb-1 text-[14px] text-black transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus:bg-white focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-100 disabled:text-black font-['Instrument_Sans']",
                            (type === "date" || type === "time" || type === "datetime-local") && "pt-1 pb-1", // Adjust padding for date/time to center text vertically
                            error && "border-red-500 focus:border-red-500",
                            suffix && "pr-9"
                        )}
                        ref={inputRef}
                        value={value}
                        defaultValue={defaultValue}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        placeholder={label}
                        {...props}
                    />
                    <label
                        className={cn(
                            "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                            "text-[#0B1A3C99] text-[14px] top-1/2 -translate-y-1/2",
                            "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
                            "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[12px] peer-[:not(:placeholder-shown)]:text-primary",
                            (isFocused || hasValue) ? "top-0 text-[12px] text-primary" : "",
                            error && "text-red-500 peer-focus:text-red-500 peer-[:not(:placeholder-shown)]:text-red-500"
                        )}
                    >
                        {label}
                        {props.required && <span className="text-red-500">*</span>}
                    </label>
                    {suffix && (
                        <div
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-20"
                            onClick={handleSuffixClick}
                        >
                            <div className="text-slate-400 group-focus-within:text-primary transition-colors">
                                {suffix}
                            </div>
                        </div>
                    )}
                </div>
                {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
            </div>
        );
    }
);
FloatingLabelInput.displayName = "FloatingLabelInput";

export interface FloatingLabelTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    isValid?: boolean;
    isInvalid?: boolean;
}

const FloatingLabelTextarea = React.forwardRef<HTMLTextAreaElement, FloatingLabelTextareaProps>(
    ({ className, label, value, defaultValue, onChange, error, isValid, isInvalid, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const hasValue = (value !== undefined && value !== "") || (defaultValue !== undefined && defaultValue !== "");

        return (
            <div className={cn("space-y-1 w-full", className)}>
                <div className="relative w-full group">
                    <textarea
                        className={cn(
                            "peer block w-full rounded-[6px] border border-slate-300 bg-white px-3 pt-4 pb-1 text-[14px] text-black placeholder:text-transparent focus:bg-white focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-100 disabled:text-black font-['Instrument_Sans']",
                            error && "border-red-500 focus:border-red-500"
                        )}
                        style={{ resize: 'vertical', ...props.style }}
                        ref={ref}
                        value={value}
                        defaultValue={defaultValue}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        placeholder={label}
                        {...props}
                    />
                    <label
                        className={cn(
                            "absolute left-3 transition-all duration-200 pointer-events-none font-['Instrument_Sans'] bg-white px-1 z-10 flex items-center gap-0.5",
                            "text-[#0B1A3C99] text-[14px] top-4 -translate-y-1/2",
                            "peer-focus:top-0 peer-focus:text-[12px] peer-focus:text-primary",
                            "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[12px] peer-[:not(:placeholder-shown)]:text-primary",
                            (isFocused || hasValue) ? "top-0 text-[12px] text-primary" : "",
                            error && "text-red-500 peer-focus:text-red-500 peer-[:not(:placeholder-shown)]:text-red-500"
                        )}
                    >
                        {label}
                        {props.required && <span className="text-red-500">*</span>}
                    </label>

                </div>
                {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
            </div>
        );
    }
);
FloatingLabelTextarea.displayName = "FloatingLabelTextarea";

export { FloatingLabelInput, FloatingLabelTextarea };

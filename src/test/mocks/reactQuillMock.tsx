// Jest stand-in for react-quill-new, which ships ESM-only and can't be loaded by Jest.
import React from "react";

type Props = {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
};

const ReactQuill = React.forwardRef<HTMLTextAreaElement, Props>(({ value, onChange, placeholder }, ref) => (
    <textarea
        ref={ref}
        data-testid="react-quill"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
    />
));
ReactQuill.displayName = "ReactQuill";

export default ReactQuill;

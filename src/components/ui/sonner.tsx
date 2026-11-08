import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      closeButton={true}
      icons={{
        success: (
          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        ),
        error: (
          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
            <AlertCircle className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        ),
        info: (
          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <Info className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        ),
        warning: (
          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
            <AlertTriangle className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-sm font-['Instrument_Sans'] py-3 px-4 min-w-[350px] flex items-center gap-3",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          closeButton: "left-auto right-2 top-1/2 -translate-y-1/2 opacity-100 group-hover:opacity-100 !bg-transparent !border-none !text-foreground/50 hover:!text-foreground transition-opacity",
          success:
            "group-[.toaster]:bg-[#f6ffed] group-[.toaster]:text-[#000000d9] group-[.toaster]:border-[#b7eb8f] group-[.toaster]:border",
          error:
            "group-[.toaster]:bg-[#fff1f0] group-[.toaster]:text-[#000000d9] group-[.toaster]:border-[#ffa39e] group-[.toaster]:border",
          warning:
            "group-[.toaster]:bg-[#fffbe6] group-[.toaster]:text-[#000000d9] group-[.toaster]:border-[#ffe58f] group-[.toaster]:border",
          info:
            "group-[.toaster]:bg-[#e6f7ff] group-[.toaster]:text-[#000000d9] group-[.toaster]:border-[#91d5ff] group-[.toaster]:border",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

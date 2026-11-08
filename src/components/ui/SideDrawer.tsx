import * as React from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface SideDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    onSubmit?: () => void
    submitLabel?: string
    isSubmitting?: boolean
}

export function SideDrawer({
    open,
    onOpenChange,
    title,
    children,
    footer,
    onSubmit,
    submitLabel = "Save Changes",
    isSubmitting = false
}: SideDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col gap-0 border-l shadow-2xl">
                <SheetHeader className="p-6 border-b bg-white sticky top-0 z-10 shrink-0">
                    <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight">
                        {title}
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 overflow-y-auto bg-white">
                    <div className="p-6 space-y-4 pb-12">
                        {children}
                    </div>
                </ScrollArea>

                <SheetFooter className="p-6 flex-row justify-end space-x-3 shrink-0">
                    {footer ? footer : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                            >
                                Cancel
                            </Button>
                            {onSubmit && (
                                <Button
                                    onClick={onSubmit}
                                    disabled={isSubmitting}
                                    className="h-11 px-8 bg-primary hover:bg-primary/90 text-white font-semibold transition-all shadow-sm"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : submitLabel}
                                </Button>
                            )}
                        </>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

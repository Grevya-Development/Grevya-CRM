import { Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

interface FilePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: {
        name: string;
        url?: string;
    } | null;
}

export const FilePreviewModal = ({ open, onOpenChange, file }: FilePreviewModalProps) => {
    if (!file) return null;

    const isImage = file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isOffice = file.name.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] md:max-w-[900px] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white flex flex-col">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-semibold text-[#0f172a] truncate pr-8">
                        {file.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 bg-slate-50 overflow-hidden flex items-center justify-center p-4">
                    {file.url ? (
                        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                            {isImage ? (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : isPdf ? (
                                <iframe
                                    src={`${file.url}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title={file.name}
                                />
                            ) : isOffice ? (
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                                    className="w-full h-full border-none"
                                    title={file.name}
                                />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                                        <Download className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-slate-600">No Preview Available</p>
                                        <p className="text-xs text-slate-400 mb-4">This file type cannot be previewed in the browser.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = file.url!;
                                                link.download = file.name;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download Instead
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <div className="animate-pulse w-12 h-12 rounded-full bg-slate-200" />
                            <p className="text-sm font-medium">Loading preview...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

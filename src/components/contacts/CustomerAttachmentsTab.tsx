import { useEffect, useRef, useState } from "react";
import { Upload, MoreVertical, Download } from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { FilePreviewModal } from "../attachments/FilePreviewModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface Props {
    recordId: string;
    bucketName: string;
    onCountChange: (count: number) => void;
}

export function CustomerAttachmentsTab({ recordId, bucketName, onCountChange }: Props) {
    const [files, setFiles] = useState<any[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currectPage, setCurrentPage] = useState(1);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const rowsPerPage = 5;
    const totalPages = Math.ceil(files.length / rowsPerPage);
    const paginatedFiles = files.slice(
        (currectPage - 1) * rowsPerPage,
        currectPage * rowsPerPage
    );

    useEffect(() => {
        if (recordId) fetchFiles();
    }, [recordId]);

    const fetchFiles = async () => {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(recordId, {
                limit: 100,
                offset: 0,
                sortBy: { column: "created_at", order: "desc" },
            });

        if (!error && data) {
            setFiles(data);
            onCountChange?.(data.length);
        }
    };

    const uploadFile = async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type");
            return;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = file.name;
        const filePath = `${recordId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            })

        if (error) {
            toast.error(error.message);
            return;
        }

        const newFile = {
            id: data?.path ?? __filename,
            name: fileName,
            created_at: new Date().toISOString(),
            metadata: { size: file.size },
        };
        setFiles((prev) => {
            const updated = [newFile, ...prev];
            onCountChange?.(updated.length);
            return updated;
        });
        toast.success("File uploaded successfully");
        fetchFiles();
    };

    const handleFiles = (fileList: FileList) => {
        Array.from(fileList).forEach(uploadFile);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        Array.from(e.target.files).forEach(uploadFile);
    };

    const deleteFile = async (fileName: string) => {
        const filePath = `${recordId}/${fileName}`;

        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("File deleted");
        setFiles((prev) => {
            const updated = prev.filter((f) => f.name !== fileName);
            onCountChange?.(updated.length);
            return updated;
        });
    };

    const handleView = async (fileName: string) => {
        const filePath = `${recordId}/${fileName}`;
        const isOfficeFile = fileName.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/);

        setIsPreviewOpen(true);
        setPreviewFile({ name: fileName, url: "" });

        if (isOfficeFile) {
            // Office Viewer needs a real URL, so we use a signed URL
            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 3600); // 1 hour

            if (error || !data?.signedUrl) {
                toast.error("Could not generate preview link");
                setIsPreviewOpen(false);
                return;
            }
            setPreviewFile({ name: fileName, url: data.signedUrl });
        } else {
            // For PDFs and Images, use Blob for best in-app experience
            const { data, error } = await supabase.storage
                .from(bucketName)
                .download(filePath);

            if (error || !data) {
                toast.error("Could not fetch file for preview");
                setIsPreviewOpen(false);
                return;
            }

            const url = URL.createObjectURL(data);
            setPreviewFile({ name: fileName, url });
        }
    };

    // Cleanup object URL when modal closes or file changes
    useEffect(() => {
        return () => {
            if (previewFile?.url && previewFile.url.startsWith("blob:")) {
                URL.revokeObjectURL(previewFile.url);
            }
        };
    }, [previewFile]);

    const handleDownload = async (fileName: string) => {
        const filePath = `${recordId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 60); // valid for 1 min

        if (error || !data?.signedUrl) {
            toast.error("Download failed");
            return;
        }

        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-end">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        "w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all",
                        isDragging
                            ? "border-blue-500 bg-blue-50 scale-[1.01]"
                            : "border-blue-200 hover:bg-blue-50"
                    )}
                >
                    <div className="flex flex-col items-center space-y-3">
                        <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full shadow-sm border text-blue-600 font-medium">
                            <Upload className="h-5 w-5" />
                            <span>
                                {isDragging ? "Drop files here" : "Select or Drag files"}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Drag & drop files here or click to upload
                        </p>
                    </div>
                </div>

                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
            <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr className="text-left">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Added On</th>
                            <th className="px-4 py-3">Size</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                    No files uploaded
                                </td>
                            </tr>
                        ) : (
                            paginatedFiles.map((file) => (
                                <tr
                                    key={file.id}
                                    className="border-t hover:bg-slate-50 transition"
                                >
                                    <td className="px-4 py-3">{file.name}</td>
                                    <td className="px-4 py-3">
                                        {new Date(file.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(file.metadata?.size / 1024).toFixed(1)} KB
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Download Icon */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownload(file.name)}
                                                className="pr-2 border-r border-slate-200"
                                            >
                                                <Download className="h-4 w-4 cursor-pointer text-slate-500 hover:text-slate-700" />
                                            </Button>
                                            {/* Dropdown Menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <MoreVertical className="h-4 w-4 cursor-pointer text-slate-500 hover:text-slate-700" />
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleView(file.name)}>
                                                        View
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => setFileToDelete(file.name)}
                                                        className="text-red-600"
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(currectPage - 1)}
                        disabled={currectPage === 1}
                        className="px-3 py-1 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        {currectPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(currectPage + 1)}
                        disabled={currectPage === totalPages}
                        className="px-3 py-1 rounded-lg border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
            <Dialog
                open={!!fileToDelete}
                onOpenChange={() => setFileToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attachment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this file? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFileToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (fileToDelete) {
                                    await deleteFile(fileToDelete);
                                    setFileToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <FilePreviewModal
                open={isPreviewOpen}
                onOpenChange={(open) => {
                    setIsPreviewOpen(open);
                    if (!open) setPreviewFile(null);
                }}
                file={previewFile}
            />
        </div>
    );
}
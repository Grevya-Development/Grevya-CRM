import React, { useState, useRef } from 'react';
import {
    Upload,
    FileText,
    MoreVertical,
    Download,
    Eye,
    Trash2,
    X,
    Image as ImageIcon,
    File as FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FilePreviewModal } from './FilePreviewModal';

interface Attachment {
    id: string;
    name: string;
    owner: string;
    addedOn: string;
    fileType: string;
    size: string;
    url?: string;
}


export const AttachmentTabContent = () => {
    const [uploadingFile, setUploadingFile] = useState<{ name: string; size: string; progress: number } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isDragging, setIsDragging] = useState(false);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            simulateUpload(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            simulateUpload(file);
        }
    };

    const simulateUpload = (file: File) => {
        setUploadingFile({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            progress: 0
        });

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploadingFile(prev => prev ? { ...prev, progress } : null);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    const newAttachment: Attachment = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        owner: 'Siva Kumar',
                        addedOn: new Date().toLocaleString(),
                        fileType: file.name.split('.').pop()?.toUpperCase() || 'Unknown',
                        size: `${(file.size / 1024).toFixed(1)}kb`,
                        url: URL.createObjectURL(file)
                    };
                    setAttachments(prev => [newAttachment, ...prev]);
                    setUploadingFile(null);
                }, 500);
            }
        }, 200);
    };

    const handleDelete = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleView = (file: Attachment) => {
        setSelectedFile(file);
        setIsPreviewOpen(true);
    };

    const getFileIcon = (type: string) => {
        const t = type.toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(t)) return <ImageIcon className="text-blue-500" size={18} />;
        if (['pdf', 'doc', 'docx'].includes(t)) return <FileText className="text-red-500" size={18} />;
        return <FileIcon className="text-slate-400" size={18} />;
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Upload Area */}
            <div
                onClick={handleUploadClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-white",
                    isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                )}
            >
                <p className={cn(
                    "text-[15px] font-medium transition-colors",
                    isDragging ? "text-blue-600" : "text-slate-500"
                )}>
                    {isDragging ? "Drop your files here" : (
                        <>Click here to <span className="text-blue-600">upload your files</span> or drag and drop them here.</>
                    )}
                </p>
            </div>

            {/* Uploading State */}
            {uploadingFile && (
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <ImageIcon className="text-blue-500" size={24} />
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700">{uploadingFile.name} ({uploadingFile.size})</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${uploadingFile.progress}%` }}
                                />
                            </div>
                            <button onClick={() => setUploadingFile(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Files List */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Name</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Owner</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Added on</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">File Type</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider py-4">Size</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attachments.map((file) => (
                                <TableRow key={file.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                                    <TableCell className="py-4 font-medium text-blue-600">
                                        <div className="flex items-center gap-2">
                                            {getFileIcon(file.fileType)}
                                            {file.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600 font-medium">{file.owner}</TableCell>
                                    <TableCell className="py-4 text-slate-500 font-medium">{file.addedOn}</TableCell>
                                    <TableCell className="py-4 text-slate-500 font-medium">{file.fileType}</TableCell>
                                    <TableCell className="py-4 text-slate-500 font-medium">{file.size}</TableCell>
                                    <TableCell className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 px-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Download size={18} />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-lg">
                                                        <MoreVertical size={18} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-32 p-1 rounded-xl shadow-xl border-slate-100 bg-white">
                                                    <DropdownMenuItem
                                                        onClick={() => handleView(file)}
                                                        className="gap-2 py-2 px-3 rounded-lg cursor-pointer text-slate-600 focus:bg-slate-50 font-medium"
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(file.id)}
                                                        className="gap-2 py-2 px-3 rounded-lg cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 font-medium"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <FilePreviewModal
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                file={selectedFile}
            />
        </div>
    );
};

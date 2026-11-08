import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Trash2, Edit2, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { createWorker } from 'tesseract.js';
import { supabase } from '@/supabase/supabaseClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FloatingLabelInput, FloatingLabelTextarea } from '@/components/ui/floating-label-input';

interface BulkScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ScannedCard {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'scanning' | 'completed' | 'error';
    extractedData?: {
        personName: string;
        companyName: string;
        designation: string;
        email: string;
        phone: string;
        website: string;
        address: string;
    };
}

export const BulkScanModal: React.FC<BulkScanModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [cards, setCards] = useState<ScannedCard[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            cards.forEach(card => {
                if (card.preview) URL.revokeObjectURL(card.preview);
            });
            
            setCards([]);
            setIsProcessing(false);
            setEditingCardId(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isOpen]);

    const processFiles = async (files: File[]) => {
        const MAX_FILE_SIZE = 5 * 1024 * 1024; 
        const validFiles: File[] = [];
        const oversizedFiles: string[] = [];

        files.forEach(file => {
            if (file.size <= MAX_FILE_SIZE) {
                validFiles.push(file);
            } else {
                oversizedFiles.push(file.name);
            }
        });

        if (oversizedFiles.length > 0) {
            toast.error(`Some files were too large (max 5MB): ${oversizedFiles.join(', ')}`);
        }

        if (validFiles.length === 0) return;

        const newCards: ScannedCard[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending'
        }));

        setCards(prev => [...prev, ...newCards]);

        // Start scanning immediately
        await startScan(newCards);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(Array.from(e.target.files || []));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(Array.from(e.dataTransfer.files));
    };

    const removeCard = (id: string) => {
        setCards(prev => {
            const card = prev.find(c => c.id === id);
            if (card) URL.revokeObjectURL(card.preview);
            return prev.filter(c => c.id !== id);
        });
    };

    const startScan = async (pendingCards: ScannedCard[]) => {
        setIsProcessing(true);

        try {
            const worker = await createWorker('eng');

            for (const card of pendingCards) {
                setCards(prev => prev.map(c => c.id === card.id ? { ...c, status: 'scanning' } : c));

                try {
                    const ret = await worker.recognize(card.file);
                    const extractedText = ret.data.text.replace(/\|/g, 'I');
                    const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

                    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
                    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g;
                    const websiteRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;

                    const companyKeywords = ['ltd', 'limited', 'inc', 'incorporated', 'co', 'company', 'llp', 'corp', 'corporation', 'private', 'pvt', 'services', 'systems', 'technologies', 'solutions', 'group', 'industries', 'bank'];
                    const designationKeywords = ['director', 'manager', 'ceo', 'founder', 'president', 'partner', 'lead', 'senior', 'developer', 'engineer', 'consultant', 'architect', 'sales', 'marketing', 'executive', 'owner', 'principal', 'cto', 'coo', 'cfo'];
                    const addressKeywords = ['road', 'rd', 'street', 'st', 'avenue', 'ave', 'floor', 'level', 'building', 'bldg', 'city', 'state', 'district', 'sector', 'phase', 'opposite', 'near', 'lane', 'ln', 'square', 'sq', 'highway', 'hwy'];

                    let data = {
                        personName: '',
                        companyName: '',
                        designation: '',
                        email: '',
                        phone: '',
                        website: '',
                        address: ''
                    };

                    // Extract obvious fields first
                    const emailMatch = extractedText.match(emailRegex);
                    if (emailMatch) data.email = emailMatch[0].toLowerCase();

                    const phoneMatch = extractedText.match(phoneRegex);
                    if (phoneMatch) data.phone = phoneMatch[0].replace(/[^\d+]/g, '');

                    const websiteMatch = extractedText.match(websiteRegex);
                    if (websiteMatch && !websiteMatch[0].includes('@')) {
                        data.website = websiteMatch[0].toLowerCase();
                    }

                    // Classify remaining lines
                    const remainingLines = lines.filter(line =>
                        line !== data.email &&
                        !line.includes(data.phone) &&
                        line !== data.website
                    );

                    let potentialNames: string[] = [];
                    let potentialAddresses: string[] = [];

                    remainingLines.forEach((line, index) => {
                        const lowerLine = line.toLowerCase();

                        // Check for Company
                        if (!data.companyName && companyKeywords.some(key => lowerLine.includes(' ' + key) || lowerLine.endsWith(' ' + key) || lowerLine === key)) {
                            data.companyName = line;
                            return;
                        }

                        // Check for Designation
                        if (!data.designation && designationKeywords.some(key => lowerLine.includes(key))) {
                            data.designation = line;
                            return;
                        }

                        // Check for Address
                        if (addressKeywords.some(key => lowerLine.includes(key)) || /\d{5,6}/.test(line)) {
                            potentialAddresses.push(line);
                            return;
                        }

                        // If it's short and at the top, it might be a name
                        if (index < 4 && line.split(' ').length <= 4) {
                            potentialNames.push(line);
                        }
                    });

                    if (potentialAddresses.length > 0) {
                        data.address = potentialAddresses.join(', ');
                    }

                    if (potentialNames.length > 0) {
                        data.personName = potentialNames[0];
                    }

                    // Fallback for company name if not found via keywords (usually line 0 or 1 if not person name)
                    if (!data.companyName && potentialNames.length > 1) {
                        data.companyName = potentialNames[1];
                    } else if (!data.companyName && remainingLines.length > 0) {
                        // Heuristic: if first line is person, second might be company
                        if (data.personName === remainingLines[0] && remainingLines[1]) {
                            data.companyName = remainingLines[1];
                        }
                    }

                    setCards(prev => prev.map(c => c.id === card.id ? {
                        ...c,
                        status: 'completed',
                        extractedData: data
                    } : c));
                } catch (err) {
                    setCards(prev => prev.map(c => c.id === card.id ? { ...c, status: 'error' } : c));
                }
            }

            await worker.terminate();
            toast.success('Scanning complete');
        } catch (err) {
            toast.error('OCR initialization failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const saveAll = async () => {
        const validCards = cards.filter(c => c.status === 'completed' && c.extractedData);
        if (validCards.length === 0) return;

        setIsProcessing(true);
        try {
            for (const card of validCards) {
                const { extractedData } = card;

                // 0. Upload image to storage
                const fileExt = card.file.name.split('.').pop();
                const fileName = `card_${Math.random().toString(36).substring(2, 11)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('scanned-cards')
                    .upload(filePath, card.file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('scanned-cards')
                    .getPublicUrl(filePath);

                // 1. Find or Create Customer
                const customerName = extractedData?.companyName || extractedData?.personName || 'Unknown';

                // First attempt to find existing customer
                const { data: existingCustomer } = await supabase
                    .from('crm_customers')
                    .select('id')
                    .ilike('name', customerName.trim())
                    .single();

                let currentCustomerId: string;

                if (existingCustomer) {
                    currentCustomerId = existingCustomer.id;
                } else {
                    // Create new customer if not found
                    const { data: newCustomer, error: custError } = await supabase
                        .from('crm_customers')
                        .insert([{
                            name: customerName,
                            customer_type: 'Company',
                            account_status: 'active',
                            priority: 'medium',
                            scanned_card_url: publicUrl,
                            website_link: extractedData?.website
                        }])
                        .select()
                        .single();

                    if (custError) throw custError;
                    currentCustomerId = newCustomer.id;
                }

                // 2. Create Address
                if (extractedData?.address) {
                    await supabase.from('crm_addresses').insert([{
                        customer_id: currentCustomerId,
                        company_address: extractedData.address
                    }]);
                }

                // 3. Create Contact
                await supabase.from('crm_contacts').insert([{
                    customer_id: currentCustomerId,
                    name: extractedData?.personName || 'Unknown',
                    email: extractedData?.email,
                    mobile_no: extractedData?.phone,
                    designation: extractedData?.designation,
                    preferred_type: 'Email',
                    address_type: 'Billing'
                }]);
            }

            toast.success(`${validCards.length} contacts added successfully`);
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(`Save failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const editingCard = cards.find(c => c.id === editingCardId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Scan Card Uploads</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Dropzone */}
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
                            isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <Upload className={cn("h-10 w-10 mb-2", isDragging ? "text-blue-600" : "text-blue-500")} />
                        <p className="text-sm font-medium">Drop business card images here or click here to <span className="text-blue-500">upload your files</span></p>
                        <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, HEIC • Max 5MB per image • Upload multiple cards</p>
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    </div>

                    {/* Cards List */}
                    <div className="space-y-2">
                        {cards.map(card => {
                            const isMissingRequired = card.status === 'completed' && (!card.extractedData?.personName || !card.extractedData?.companyName || !card.extractedData?.email || !card.extractedData?.phone);
                            const hasEmptyFields = card.status === 'completed' && card.extractedData && Object.values(card.extractedData).some(v => !v);

                            return (
                                <div key={card.id} className={cn(
                                    "flex items-center gap-3 p-3 border rounded-lg bg-white group transition-all",
                                    isMissingRequired ? "border-amber-200 bg-amber-50" : "hover:border-slate-300"
                                )}>
                                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        <img src={card.preview} alt="Card preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{card.file.name}</p>
                                        <p className="text-xs text-slate-400">{(card.file.size / 1024).toFixed(1)} KB</p>
                                        {isMissingRequired ? (
                                            <p className="text-[10px] text-amber-600 font-bold">Missing Required Info</p>
                                        ) : hasEmptyFields ? (
                                            <p className="text-[10px] text-slate-500 font-medium italic">Partial Information</p>
                                        ) : card.status === 'completed' ? (
                                            <p className="text-[10px] text-green-600 font-medium">All Data Captured</p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {card.status === 'scanning' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                        {card.status === 'completed' && !isMissingRequired && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {isMissingRequired && <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}

                                        {card.status === 'completed' && (
                                            <Button variant="ghost" size="sm" onClick={() => setEditingCardId(card.id)} className={cn(isMissingRequired ? "text-amber-600 bg-amber-100 hover:bg-amber-200" : "hover:bg-slate-100")}>
                                                <Edit2 className="h-4 w-4" />
                                                {isMissingRequired && <span className="ml-1 text-[10px] font-bold">Fix</span>}
                                            </Button>
                                        )}

                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => removeCard(card.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-slate-50">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    {cards.length > 0 && !cards.some(c => c.status === 'scanning' || c.status === 'pending') && !cards.some(c => c.status === 'completed' && (!c.extractedData?.personName || !c.extractedData?.companyName || !c.extractedData?.email || !c.extractedData?.phone)) && (
                        <Button
                            onClick={saveAll}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white animate-in fade-in slide-in-from-right-2 duration-300"
                        >
                            {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Add {cards.length} {cards.length === 1 ? 'Contact' : 'Contacts'}
                        </Button>
                    )}
                </DialogFooter>

                {/* Edit Sub-modal */}
                {editingCard && (
                    <Dialog open={!!editingCardId} onOpenChange={() => setEditingCardId(null)}>
                        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-slate-50">
                            <div className="flex flex-col md:flex-row h-[80vh] min-h-[500px]">
                                {/* Left Side: Card View */}
                                <div className="md:w-1/2 bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden group">
                                    <img
                                        src={editingCard.preview}
                                        alt="Original card"
                                        className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-300 hover:scale-110"
                                    />
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 text-white">
                                            <ImageIcon className="h-4 w-4 text-blue-400" />
                                            <span className="text-xs font-medium">Original Business Card Image</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Edit Form */}
                                <div className="md:w-1/2 flex flex-col bg-white">
                                    <DialogHeader className="p-6 border-b">
                                        <DialogTitle className="flex items-center gap-2">
                                            Verify Extracted Details
                                        </DialogTitle>
                                        <p className="text-xs text-slate-500">Compare the image on the left with the fields below.</p>
                                    </DialogHeader>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FloatingLabelInput
                                                label="Person Name"
                                                required
                                                value={editingCard.extractedData?.personName}
                                                error={!editingCard.extractedData?.personName ? "Required" : undefined}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                        ...c,
                                                        extractedData: { ...c.extractedData!, personName: val }
                                                    } : c));
                                                }}
                                            />

                                            <FloatingLabelInput
                                                label="Company Name"
                                                required
                                                value={editingCard.extractedData?.companyName}
                                                error={!editingCard.extractedData?.companyName ? "Required" : undefined}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                        ...c,
                                                        extractedData: { ...c.extractedData!, companyName: val }
                                                    } : c));
                                                }}
                                            />

                                            <FloatingLabelInput
                                                label="Email"
                                                required
                                                type="email"
                                                value={editingCard.extractedData?.email}
                                                error={!editingCard.extractedData?.email ? "Required" : undefined}
                                                validationType="email"
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                        ...c,
                                                        extractedData: { ...c.extractedData!, email: val }
                                                    } : c));
                                                }}
                                            />

                                            <FloatingLabelInput
                                                label="Phone"
                                                required
                                                type="tel"
                                                value={editingCard.extractedData?.phone}
                                                error={!editingCard.extractedData?.phone ? "Required" : undefined}
                                                validationType="phone"
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                        ...c,
                                                        extractedData: { ...c.extractedData!, phone: val }
                                                    } : c));
                                                }}
                                            />

                                            <FloatingLabelInput
                                                label="Designation"
                                                value={editingCard.extractedData?.designation}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                        ...c,
                                                        extractedData: { ...c.extractedData!, designation: val }
                                                    } : c));
                                                }}
                                            />

                                            <FloatingLabelInput
                                                label="Website"
                                                value={editingCard.extractedData?.website}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                        ...c,
                                                        extractedData: { ...c.extractedData!, website: val }
                                                    } : c));
                                                }}
                                            />
                                        </div>

                                        <FloatingLabelTextarea
                                            label="Address"
                                            value={editingCard.extractedData?.address}
                                            rows={3}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setCards(prev => prev.map(c => c.id === editingCard.id ? {
                                                    ...c,
                                                    extractedData: { ...c.extractedData!, address: val }
                                                } : c));
                                            }}
                                        />
                                    </div>

                                    <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setEditingCardId(null)}
                                        >
                                            Discard Changes
                                        </Button>
                                        <Button
                                            onClick={() => setEditingCardId(null)}
                                            disabled={!editingCard.extractedData?.personName || !editingCard.extractedData?.companyName || !editingCard.extractedData?.email || !editingCard.extractedData?.phone}
                                            className="bg-blue-600 hover:bg-blue-700 shadow-md"
                                        >
                                            Update Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
};

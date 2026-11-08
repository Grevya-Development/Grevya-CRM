import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ChevronLeft,
    ChevronRight,
    Layout as LayoutIcon,
    Type as TypeIcon,
    Image as ImageIcon,
    MousePointer2,
    Columns,
    Plus,
    X,
    Eye,
    Check,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { supabase } from '@/supabase/supabaseClient';
import { EmailEditor, EmailEditorHandle } from '@/components/email/EmailEditor';
import { Modal } from 'antd';
import { useBlocker } from 'react-router-dom';

const STEPS = [
    { id: 1, title: 'Setup', description: 'Basic details' },
    { id: 2, title: 'Layout', description: 'Choose structure' },
    { id: 3, title: 'Design', description: 'Build visually' }
];

const LAYOUT_OPTIONS = [
    { id: 'single_column', name: 'Single Column', description: 'Classic centered layout', icon: LayoutIcon },
    { id: 'hero_focus', name: 'Hero Focus', description: 'Large image header', icon: ImageIcon },
    { id: 'column_split', name: '1:2 Column Split', description: 'Two-column layout', icon: Columns },
    { id: 'product_grid', name: 'Product Grid', description: 'Multiple items grid', icon: LayoutIcon },
    { id: 'newsletter_mix', name: 'Newsletter Mix', description: 'Varied blocks', icon: TypeIcon },
    { id: 'sidebar_story', name: 'Sidebar Story', description: 'With side column', icon: Columns },
    { id: 'blank', name: 'Blank Canvas', description: 'Start from scratch', icon: Plus, isBlank: true },
];

export default function TemplateWizard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const isSubmittingRef = useRef(false);
    const editorRef = useRef<EmailEditorHandle>(null);
    const templateDataRef = useRef<any>(null);
    const currentIdRef = useRef<string | undefined>(id);

    // Core Data
    const [templateData, setTemplateData] = useState<any>({
        name: '',
        subject: '',
        category: 'general',
        layout_type: 'single_column',
        body_json: null,
        body: ''
    });

    useEffect(() => {
        if (id) {
            fetchTemplate();
        }
        currentIdRef.current = id;
    }, [id]);

    // Keep ref in sync and track changes
    useEffect(() => {
        if (!fetching && templateDataRef.current) {
            // Check if name or subject changed to mark dirty
            if (templateData.name !== templateDataRef.current.name || 
                templateData.subject !== templateDataRef.current.subject ||
                templateData.category !== templateDataRef.current.category ||
                templateData.layout_type !== templateDataRef.current.layout_type) {
                setIsDirty(true);
            }
        }
        templateDataRef.current = templateData;
    }, [templateData]);

    // Navigation Guard
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && !isSubmittingRef.current && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            Modal.confirm({
                title: 'Unsaved Changes',
                content: 'You have unsaved changes. Are you sure you want to leave without saving?',
                okText: 'Leave',
                cancelText: 'Stay',
                onOk: () => blocker.proceed(),
                onCancel: () => blocker.reset(),
                centered: true,
                okButtonProps: { danger: true }
            });
        }
    }, [blocker]);

    // BeforeUnload browser warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const fetchTemplate = async () => {
        try {
            setFetching(true);
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setTemplateData({
                    name: data.name,
                    category: data.category || 'general',
                    subject: data.subject,
                    layout_type: data.layout_type || 'single_column',
                    body_json: data.editor_json || null,
                    body: data.body || '',
                    status: data.status
                });
            }
        } catch (error) {
            toast.error('Failed to load template');
            navigate('/campaigns/templates');
        } finally {
            setFetching(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!templateData.name || !templateData.subject) {
                toast.error('Please fill in name and subject');
                return;
            }
        }

        if (currentStep === 2) {
            // Initialize blocks based on layout only if we don't have an existing design
            if (!templateData.body_json || (Array.isArray(templateData.body_json) && templateData.body_json.length === 0)) {
                const initialBlocks = getInitialBlocksForLayout(templateData.layout_type);
                setTemplateData(prev => ({ ...prev, body_json: initialBlocks }));
            }
        }

        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const getInitialBlocksForLayout = (layoutType: string) => {
        const id = () => Math.random().toString(36).substr(2, 9);
        switch (layoutType) {
            case 'hero_focus':
                return [
                    { id: id(), type: 'image', content: '', style: { padding: [0, 0, 0, 0], backgroundColor: 'transparent' } },
                    { id: id(), type: 'text', content: 'Modern Minimal', style: { fontSize: 32, fontWeight: '700', textAlign: 'left', padding: [40, 0, 10, 0], color: '#0f172a' } },
                    { id: id(), type: 'text', content: 'Fresh updates from your CRM team', style: { fontSize: 16, fontWeight: '400', textAlign: 'left', padding: [0, 0, 40, 0], color: '#64748b' } },
                    { id: id(), type: 'button', content: 'View Your Reports', style: { fontSize: 16, fontWeight: '600', textAlign: 'left', padding: [12, 32, 12, 32], borderRadius: 4 } }
                ];
            case 'single_column':
                return [
                    { id: id(), type: 'text', content: 'Start typing', style: { fontSize: 24, fontWeight: '700', textAlign: 'left', padding: [40, 0, 20, 0], color: '#0f172a' } },
                    { id: id(), type: 'text', content: 'This template is designed to look beautiful on any device. Start by editing this text or dragging new components into the layout. We\'ve optimized the spacing for readability.', style: { fontSize: 14, fontWeight: '400', textAlign: 'left', padding: [20, 0, 20, 0], color: '#475569', lineHeight: 1.6 } },
                    { id: id(), type: 'divider', content: '', style: { padding: [20, 0, 20, 0] } },
                    { id: id(), type: 'button', content: 'Getting Started', style: { fontSize: 16, fontWeight: '600', textAlign: 'left', padding: [12, 32, 12, 32], borderRadius: 4 } }
                ];
            default:
                return [];
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
        else navigate('/campaigns/templates');
    };

    const handleSaveTemplate = async (isAutoSave = false) => {
        if (!isAutoSave) {
            if (!templateData.name) {
                toast.error('Please enter a template name before saving');
                return;
            }
            isSubmittingRef.current = true;
            setLoading(true);
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const currentData = templateDataRef.current;
            const currentId = currentIdRef.current;

            // Export HTML and Design from Unlayer
            let exportedHtml = templateData.body || '';
            let exportedDesign = templateData.body_json;

            if (currentStep === 3 && editorRef.current) {
                const result = await editorRef.current.exportHtml();
                exportedHtml = result.html;
                exportedDesign = result.design;
            } else if (!exportedHtml && Array.isArray(templateData.body_json)) {
                // Only use legacy generator if we have a legacy block array
                exportedHtml = generateHtmlFromBlocks(templateData.body_json);
            }

            const payload = {
                name: currentData.name,
                subject: currentData.subject,
                category: currentData.category,
                layout_type: currentData.layout_type,
                editor_json: exportedDesign,
                body: exportedHtml,
                status: isAutoSave ? 'inactive' : 'active',
                user_id: session?.user?.id
            };

            if (currentId) {
                const { error } = await supabase
                    .from('email_templates')
                    .update(payload)
                    .eq('id', currentId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('email_templates')
                    .insert([payload])
                    .select()
                    .single();
                
                if (error) throw error;
                if (data && !currentId) {
                    currentIdRef.current = data.id;
                    // Update URL without reloading
                    window.history.replaceState(null, '', `/templates/edit/${data.id}`);
                }
            }

            if (!isAutoSave) {
                setIsDirty(false); // Reset dirty state on manual save
                toast.success(`Template ${currentId ? 'updated' : 'saved'} successfully!`);
                navigate('/campaigns/templates');
            }
        } catch (error) {
            isSubmittingRef.current = false;
            toast.error('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const generateHtmlFromBlocks = (blocks: any[]) => {
        const blockHtml = blocks.map(b => {
            const padding = b.style.padding ? b.style.padding : [12, 0, 12, 0];
            const textAlign = b.style.textAlign || 'left';
            const fontSize = b.style.fontSize || 16;
            const fontWeight = b.style.fontWeight || '400';
            const color = b.style.color || '#101922';
            const borderRadius = b.style.borderRadius || 0;
            const width = b.style.width || 100;

            // Robust table-based wrapper for each block
            const wrapInTable = (content: string, extraStyle = '') => `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="${textAlign === 'justify' ? 'left' : textAlign}" style="padding: ${padding[0]}px ${padding[1]}px ${padding[2]}px ${padding[3]}px; ${extraStyle}">
                            ${content}
                        </td>
                    </tr>
                </table>`;

            switch (b.type) {
                case 'text':
                    return wrapInTable(`<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: ${textAlign};">${b.content}</div>`);

                case 'button':
                    const btnUrl = b.style.buttonUrl || '#';
                    const btnWidth = b.style.buttonWidth ? `${b.style.buttonWidth}%` : 'auto';
                    return wrapInTable(`
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: ${textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0 auto 0 0'}; border-collapse: collapse; width: ${btnWidth};">
                            <tr>
                                <td align="center" bgcolor="${b.style.backgroundColor || '#0b66f4'}" style="border-radius: ${borderRadius}px;">
                                    <a href="${btnUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-family: sans-serif; font-size: ${fontSize}px; color: ${b.style.color || '#ffffff'}; text-decoration: none; font-weight: bold; width: 100%; box-sizing: border-box;">${b.content}</a>
                                </td>
                            </tr>
                        </table>`);

                case 'image':
                    return b.content ? wrapInTable(`<img src="${b.content}" alt="Email Image" width="${width}%" style="max-width: 100%; height: auto; border-radius: ${borderRadius}px; display: block; margin: ${textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0 auto 0 0'};" />`) : '';

                case 'divider':
                    const thickness = b.style.dividerThickness || 1;
                    const divColor = b.style.dividerColor || '#e2e8f0';
                    return wrapInTable(`<div style="height: ${thickness}px; background-color: ${divColor}; width: 100%; font-size: 1px; line-height: 1px;">&nbsp;</div>`);

                case 'social':
                    const links = b.style.socialLinks || {};
                    const visible = b.style.socialVisible || {};
                    const socialIcons = [
                        { id: 'facebook', label: 'F', color: '#1877F2' },
                        { id: 'twitter', label: 'T', color: '#1DA1F2' },
                        { id: 'instagram', label: 'I', color: '#E4405F' },
                        { id: 'linkedin', label: 'L', color: '#0A66C2' }
                    ].filter(s => visible[s.id] !== false);

                    const socialHtml = `
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: ${textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0 auto 0 0'}; border-collapse: collapse;">
                            <tr>
                                ${socialIcons.map(s => `
                                    <td style="padding: 0 5px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                            <tr>
                                                <td align="center" valign="middle" bgcolor="${s.color}" style="width: 32px; height: 32px; border-radius: 50%; font-family: sans-serif; font-weight: bold; font-size: 14px;">
                                                    <a href="${links[s.id] || '#'}" target="_blank" style="color: #ffffff; text-decoration: none; display: block; width: 32px; line-height: 32px;">${s.label}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                `).join('')}
                            </tr>
                        </table>`;
                    return wrapInTable(socialHtml);

                default:
                    return '';
            }
        }).join('\n');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Template</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="table-layout: fixed;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <!--[if mso]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td>
                                        ${blockHtml}
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 40px 20px; border-top: 1px solid #f1f5f9;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #94a3b8; font-size: 11px;">
                                            Sent via CRM &bull; <a href="#" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <!--[if mso]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
    };

    return (
        <div className={`flex-1 flex flex-col min-w-0 bg-slate-50/50 ${currentStep === 3 ? 'h-screen' : 'min-h-screen'}`}>
            <Header title={id || currentIdRef.current ? "Edit Template" : "Create New Template"} />

            <div className={`flex-1 flex flex-col ${currentStep === 3 ? 'w-full' : 'p-6 max-w-5xl mx-auto w-full'}`}>
                {/* Step Indicator */}
                {currentStep !== 3 && (
                    <div className="flex items-center justify-between mb-12 relative px-10">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0 mx-20" />
                        {STEPS.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= step.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50'
                                    : 'bg-white text-slate-400 border-2 border-slate-200'
                                    }`}>
                                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                </div>
                                <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${currentStep >= step.id ? 'text-blue-600' : 'text-slate-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wizard Content */}
                <div className={`flex-1 flex flex-col ${currentStep === 3 ? 'bg-white border-y border-slate-200' : 'bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]'}`}>
                    <div className={`flex-1 flex flex-col ${currentStep === 3 ? 'p-0' : 'p-8'}`}>
                        {currentStep === 1 && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-900">Template Details</h2>
                                    <p className="text-slate-500 mt-1">Start by giving your template a name and subject line.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold ml-1">Template Name</Label>
                                        <Input
                                            placeholder="e.g. Summer Product Launch"
                                            className="h-12 border-slate-200 focus:ring-blue-500 rounded-xl"
                                            value={templateData.name}
                                            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-bold ml-1">Category</Label>
                                            <Select
                                                value={templateData.category}
                                                onValueChange={(val) => setTemplateData({ ...templateData, category: val })}
                                            >
                                                <SelectTrigger className="h-12 border-slate-200 focus:ring-blue-500 rounded-xl">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="general">General</SelectItem>
                                                    <SelectItem value="newsletter">Newsletter</SelectItem>
                                                    <SelectItem value="product">Product</SelectItem>
                                                    <SelectItem value="promotional">Promotional</SelectItem>
                                                    <SelectItem value="leads">Leads</SelectItem>
                                                    <SelectItem value="customers">Customers</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-bold ml-1">Email Subject Line</Label>
                                            <Input
                                                placeholder="Enter a subject line"
                                                className="h-12 border-slate-200 focus:ring-blue-500 rounded-xl"
                                                value={templateData.subject}
                                                onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-900">Choose your layout structure</h2>
                                    <p className="text-slate-500 mt-1">Select a starting point for your email design.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {LAYOUT_OPTIONS.map((layout) => (
                                        <div
                                            key={layout.id}
                                            onClick={() => setTemplateData({ ...templateData, layout_type: layout.id })}
                                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 group ${templateData.layout_type === layout.id
                                                ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                                                : 'border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className="aspect-[3/4] bg-white rounded-lg border border-slate-200 mb-4 flex items-center justify-center group-hover:shadow-md transition-all overflow-hidden relative">
                                                {/* Visual Representation of Layout */}
                                                <div className="w-full h-full p-3 space-y-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {layout.id === 'single_column' && (
                                                        <div className="space-y-2 flex flex-col items-center">
                                                            <div className="w-full h-4 bg-slate-100 rounded" />
                                                            <div className="w-4/5 h-16 bg-blue-100 rounded" />
                                                            <div className="w-full h-2 bg-slate-100 rounded" />
                                                            <div className="w-full h-2 bg-slate-100 rounded" />
                                                        </div>
                                                    )}
                                                    {layout.id === 'hero_focus' && (
                                                        <div className="space-y-2">
                                                            <div className="w-full h-20 bg-blue-200 rounded animate-pulse" />
                                                            <div className="w-2/3 h-3 bg-slate-100 rounded mx-auto" />
                                                            <div className="w-full h-2 bg-slate-100 rounded" />
                                                        </div>
                                                    )}
                                                    {layout.id === 'blank' && (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-300 group-hover:text-blue-500 transition-colors">
                                                            <Plus className="w-8 h-8 mb-2" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Start Fresh</span>
                                                        </div>
                                                    )}
                                                    {/* Other layout placeholders can be added here */}
                                                </div>
                                            </div>
                                            <h3 className={`font-bold text-sm ${templateData.layout_type === layout.id ? 'text-blue-600' : 'text-slate-900'}`}>{layout.name}</h3>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{layout.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <EmailEditor
                                ref={editorRef}
                                initialDesign={templateData.body_json}
                                onChange={() => setIsDirty(true)}
                            />
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className={`p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between ${currentStep === 3 ? 'px-8 bg-white' : ''}`}>
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="font-bold text-slate-600 border-slate-200 hover:bg-white rounded-lg h-11 px-6 transition-all"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => handleSaveTemplate(false)}
                                className="font-bold text-slate-400 hover:text-slate-600"
                            >
                                Save as Draft
                            </Button>
                            <Button
                                onClick={currentStep === 3 ? () => handleSaveTemplate(false) : handleNext}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-lg shadow-lg shadow-blue-200 transition-all"
                            >
                                {currentStep === 3 ? 'Save Template' : `Next: ${STEPS[currentStep].title}`} <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {fetching && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Template...</p>
                </div>
            )}
        </div>
    );
}

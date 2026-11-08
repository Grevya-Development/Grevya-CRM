import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Mail,
    Plus,
    Search,
    Edit2,
    Trash2,
    FileText,
    MoreVertical,
    Eye,
    Copy,
    Type,
    ExternalLink,
    Grid,
    List
} from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import { TemplateForm } from '@/components/admin/TemplateForm';
import { Dropdown, Menu, Tabs, Modal } from 'antd';


export default function EmailTemplates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [templateToRename, setTemplateToRename] = useState<any>(null);
    const [newTemplateName, setNewTemplateName] = useState('');

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error: any) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const { error } = await supabase
                .from('email_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Template deleted successfully');
            fetchTemplates();
        } catch (error: any) {
            toast.error('Failed to delete template');
        }
    };

    const handleDuplicate = async (template: any) => {
        try {
            const { id, created_at, updated_at, ...rest } = template;
            const { error } = await supabase
                .from('email_templates')
                .insert([{ ...rest, name: `${rest.name} (Copy)` }]);

            if (error) throw error;
            toast.success('Template duplicated');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to duplicate template');
        }
    };

    const handleRename = async () => {
        if (!newTemplateName.trim()) return;
        try {
            const { error } = await supabase
                .from('email_templates')
                .update({ name: newTemplateName })
                .eq('id', templateToRename.id);

            if (error) throw error;
            toast.success('Template renamed');
            setIsRenameModalOpen(false);
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to rename template');
        }
    };


    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'drafts') {
            return matchesSearch && t.status === 'inactive';
        }
        
        // For other tabs, show only active templates
        const matchesCategory = activeTab === 'all' || t.category === activeTab;
        return matchesSearch && matchesCategory && t.status === 'active';
    });

    const categories = [
        { key: 'all', label: `All ${templates.filter(t => t.status === 'active').length}` },
        { key: 'drafts', label: `Drafts ${templates.filter(t => t.status === 'inactive').length}` },
        { key: 'leads', label: `Leads ${templates.filter(t => t.category === 'leads' && t.status === 'active').length}` },
        { key: 'customers', label: `Customers ${templates.filter(t => t.category === 'customers' && t.status === 'active').length}` },
        { key: 'product', label: `Product ${templates.filter(t => t.category === 'product' && t.status === 'active').length}` },
        { key: 'newsletter', label: `Newsletter ${templates.filter(t => t.category === 'newsletter' && t.status === 'active').length}` },
        { key: 'promotional', label: `Promotional ${templates.filter(t => t.category === 'promotional' && t.status === 'active').length}` },
    ];

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-screen">
            <Header title="Email Template Library" />

            <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            className="template-tabs"
                            items={categories.map(cat => ({
                                key: cat.key,
                                label: <span className="px-2 font-bold uppercase text-[11px] tracking-wider">{cat.label}</span>
                            }))}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search templates..."
                                className="pl-9 h-10 border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => navigate('/campaigns/templates/create')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-md shadow-blue-100 whitespace-nowrap"
                        >
                            <Plus className="mr-2 h-4 w-4" /> New Template
                        </Button>
                    </div>
                </div>

                {/* Template Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-bold">Loading your library...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No templates found</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-6">Start by creating your first email template library.</p>
                        <Button onClick={() => navigate('/campaigns/templates/create')} variant="outline" className="font-bold border-slate-200">
                            <Plus className="mr-2 h-4 w-4" /> Create First Template
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTemplates.map((template) => (
                            <Card key={template.id} className="group overflow-hidden border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 rounded-xl">
                                {/* Card Body */}
                                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center p-8">
                                    {/* Real HTML Preview (Scaled down) */}
                                    <div className="w-[200%] h-[200%] p-2 overflow-hidden pointer-events-none bg-white rounded-t-lg border border-slate-100 shadow-sm relative origin-top-left transform scale-[0.5] group-hover:scale-[0.52] transition-transform duration-500">
                                        {template.body ? (
                                            <iframe
                                                srcDoc={template.body}
                                                title={`Preview ${template.name}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                    backgroundColor: 'white'
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                                <Mail className="w-12 h-12 mb-2" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">No Content</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <Badge className="bg-blue-600/10 text-blue-600 border-0 uppercase text-[10px] font-black tracking-widest px-2.5 py-1">
                                            {template.category || 'General'}
                                        </Badge>
                                        {template.status === 'inactive' && (
                                            <Badge className="bg-slate-900 text-white border-0 uppercase text-[10px] font-black tracking-widest px-2.5 py-1">
                                                Draft
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Quick Preview Overlay */}
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <Button
                                            size="sm"
                                            onClick={() => { setEditingTemplate(template); setIsPreviewOpen(true); }}
                                            className="bg-white text-slate-900 hover:bg-white/90 font-bold rounded-full px-5 h-10 shadow-xl"
                                        >
                                            <Eye className="w-4 h-4 mr-2 text-blue-600" /> Quick Preview
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/campaigns/templates/edit/${template.id}`)}
                                            className="bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-full px-5 h-10 shadow-xl border-0"
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Design
                                        </Button>
                                    </div>
                                </div>

                                <CardContent className="p-4 bg-white border-t border-slate-100">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                                                {template.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 font-medium truncate mb-0.5 mt-2">
                                                <span className="font-bold text-slate-600 mr-2 text-[10px] uppercase">Subject:</span>
                                                {template.subject}
                                            </p>
                                        </div>

                                        <Dropdown
                                            trigger={['click']}
                                            menu={{
                                                className: "min-w-[160px] p-1 shadow-xl border-slate-100 rounded-lg",
                                                items: [
                                                    {
                                                        key: 'preview',
                                                        label: 'Preview',
                                                        icon: <Eye className="w-4 h-4 text-slate-400" />,
                                                        onClick: () => { setEditingTemplate(template); setIsPreviewOpen(true); },
                                                        className: "rounded-md font-medium text-slate-600 py-2"
                                                    },
                                                    {
                                                        key: 'duplicate',
                                                        label: 'Duplicate',
                                                        icon: <Copy className="w-4 h-4 text-slate-400" />,
                                                        onClick: () => handleDuplicate(template),
                                                        className: "rounded-md font-medium text-slate-600 py-2"
                                                    },
                                                    {
                                                        key: 'rename',
                                                        label: 'Rename',
                                                        icon: <Type className="w-4 h-4 text-slate-400" />,
                                                        onClick: () => { setTemplateToRename(template); setNewTemplateName(template.name); setIsRenameModalOpen(true); },
                                                        className: "rounded-md font-medium text-slate-600 py-2"
                                                    },
                                                    { type: 'divider' },
                                                    {
                                                        key: 'edit',
                                                        label: 'Edit Design',
                                                        icon: <Edit2 className="w-4 h-4 text-slate-400" />,
                                                        onClick: () => navigate(`/campaigns/templates/edit/${template.id}`),
                                                        className: "rounded-md font-medium text-slate-600 py-2"
                                                    },
                                                    { type: 'divider' },
                                                    { key: 'delete', label: 'Delete', icon: <Trash2 className="w-4 h-4 text-red-400" />, onClick: () => handleDelete(template.id), className: "rounded-md font-medium text-red-500 py-2 hover:bg-red-50 hover:text-red-600" }
                                                ]
                                            }}
                                        >
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </Dropdown>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <TemplateForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                template={editingTemplate}
                onSuccess={fetchTemplates}
            />

            {/* Rename Modal */}
            <Modal
                title="Rename Template"
                open={isRenameModalOpen}
                onOk={handleRename}
                onCancel={() => setIsRenameModalOpen(false)}
                okText="Rename"
                cancelText="Cancel"
                className="rounded-xl overflow-hidden"
            >
                <div className="py-4 space-y-2">
                    <Label className="text-slate-700 font-bold ml-1">New Template Name</Label>
                    <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="e.g. Weekly Newsletter"
                        className="h-11 border-slate-200 focus:ring-blue-500 rounded-lg"
                    />
                </div>
            </Modal>

            <Modal
                title={editingTemplate?.name || "Template Preview"}
                open={isPreviewOpen}
                onCancel={() => setIsPreviewOpen(false)}
                footer={null}
                width={850}
                centered
                bodyStyle={{ padding: 0, backgroundColor: '#f8fafc' }}
            >
                <div className="p-8 flex justify-center bg-slate-100 min-h-[600px]">
                    <div className="w-full max-w-[700px] h-[700px] bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200">
                        {editingTemplate?.body ? (
                            <iframe
                                srcDoc={editingTemplate.body}
                                title="Full Preview"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-20">
                                <Mail className="w-16 h-16 opacity-20 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-[10px]">No design content found</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

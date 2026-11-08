import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Typography, Space, message, Select, Badge, Upload, Divider } from 'antd';
import { SendOutlined, UserOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { emailService } from '@/services/emailService';
import { supabase } from '@/supabase/supabaseClient';
import { Contact, Customer, Lead } from '@/types';

const { Text } = Typography;
const { TextArea } = Input;

interface EmailComposerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact?: Contact | Customer | Lead | null;
    module?: 'leads' | 'customers' | 'sales' | 'general';
    replyData?: {
        to: string;
        subject: string;
        message_id: string;
        references?: string;
    } | null;
}

export function EmailComposer({ open, onOpenChange, contact, module = 'general', replyData }: EmailComposerProps) {
    const [form] = Form.useForm();
    const [sending, setSending] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [senderProfile, setSenderProfile] = useState<any>(null);
    const [lastContactId, setLastContactId] = useState<string | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isVisualTemplate, setIsVisualTemplate] = useState(false);

    useEffect(() => {
        const fetchTemplatesAndProfile = async () => {
            try {
                // Fetch templates
                let query = supabase
                    .from('email_templates')
                    .select('*')
                    .eq('status', 'active');

                if (module && module !== 'general') {
                    query = query.or(`category.eq.${module},category.eq.general`);
                }

                const { data: templatesData, error: templatesError } = await query.order('name', { ascending: true });
                if (templatesError) throw templatesError;
                setTemplates(templatesData || []);

                // Fetch sender profile
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: profileData, error: profileError } = await supabase
                        .from('crm_profile')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    if (!profileError) setSenderProfile(profileData);
                }

                // Handle form reset only when contact or replyData changes
                if (replyData) {
                    form.resetFields();
                    form.setFieldsValue({
                        to: replyData.to,
                        subject: replyData.subject.startsWith('Re:') ? replyData.subject : `Re: ${replyData.subject}`,
                        cc: '',
                        body: '',
                        template_id: undefined
                    });
                } else if (contact && contact.id !== lastContactId) {
                    form.resetFields();
                    form.setFieldsValue({
                        to: contact.email,
                        subject: '',
                        cc: '',
                        body: '',
                        template_id: undefined
                    });
                    setLastContactId(contact.id);
                }
            } catch (error) {
                console.error('Error in EmailComposer initialization:', error);
            }
        };

        if (open) {
            fetchTemplatesAndProfile();
        }
    }, [open, contact, lastContactId, form, replyData]);

    const replacePlaceholders = (text: string) => {
        if (!text) return '';

        const c = contact as any;
        const replacements: Record<string, string> = {
            // Global
            '{{current_date}}': new Date().toLocaleDateString('en-GB'),
            '{{user_name}}': senderProfile?.full_name || '',
            '{{user_email}}': senderProfile?.email || '',
            '{{agent_name}}': senderProfile?.full_name || '', 
            '{{agent_email}}': senderProfile?.email || '', 

            // Name mappings
            '{{customer_name}}': c?.name || c?.customer?.name || c?.customers?.name || c?.lead_name || (c?.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : 'Customer'),
            '{{lead_name}}': c?.lead_name || c?.name || '',
            '{{contact_name}}': c?.name || (c?.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : (c?.lead_name || 'Contact')),

            // Common fields
            '{{email}}': c?.email || c?.customer?.email || c?.customers?.email || '',
            '{{industry}}': c?.industry || c?.customer?.industry || c?.customers?.industry || '',
            '{{address}}': c?.address || c?.geo_address || c?.customer?.address || c?.customers?.address || '',
            '{{phone_number}}': c?.phone_number || c?.mobile_no || c?.phone || c?.customer?.phone || c?.customers?.phone || '',

            // Lead Specific (crm_leads)
            '{{lead_subject}}': c?.subject || '',
            '{{product_interest}}': c?.product_interest || '',
            '{{lead_source}}': c?.lead_source || c?.customer?.lead_source || c?.customers?.lead_source || '',
            '{{lead_priority}}': c?.lead_priority || c?.priority || c?.customer?.priority || c?.customers?.priority || '',
            '{{estimated_deal_value}}': (c?.estimated_deal_value || c?.estimated_value)?.toString() || '',
            '{{campaign_name}}': c?.campaign_name || '',
            '{{expected_close_date}}': c?.expected_close_date || '',

            // Customer Specific (crm_customers)
            '{{website_link}}': c?.website_link || c?.customer?.website_link || c?.customers?.website_link || '',
            '{{gst_details}}': c?.gst_details || c?.customer?.gst_details || c?.customers?.gst_details || '',
            '{{credit_limit}}': (c?.credit_limit || c?.customer?.credit_limit || c?.customers?.credit_limit)?.toString() || '',
            '{{payment_terms}}': c?.payment_terms || c?.customer?.payment_terms || c?.customers?.payment_terms || '',
            '{{annual_revenue}}': (c?.annual_revenue || c?.customer?.annual_revenue || c?.customers?.annual_revenue)?.toString() || '',
            '{{account_status}}': c?.account_status || c?.customer?.account_status || c?.customers?.account_status || '',

            // Company/Sales fallback
            '{{company_name}}': c?.company_name || c?.company || c?.customers?.name || c?.customer?.name || '',
            '{{document_number}}': c?.quotation_number || c?.invoice_number || c?.document_number || '',

            // Legacy
            '{{FirstName}}': c?.first_name || (c?.name || c?.lead_name || '').split(' ')[0] || '',
            '{{UserName}}': senderProfile?.full_name || '',
            '{{AgentName}}': senderProfile?.full_name || '',
        };

        let result = text;
        Object.entries(replacements).forEach(([placeholder, value]) => {
            const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, value || '');
        });

        return result;
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const finalSubject = replacePlaceholders(template.subject || '');
            const finalBody = replacePlaceholders(template.body || '');

            // Check if it's an Unlayer/Visual template
            const isVisual = !!template.editor_json;
            setIsVisualTemplate(isVisual);

            form.setFieldsValue({
                subject: finalSubject,
                body: finalBody
            });
        } else {
            setIsVisualTemplate(false);
            form.setFieldsValue({
                template_id: undefined
            });
        }
    };

    const handleSend = async () => {
        try {
            const values = await form.validateFields();

            if (!contact && !replyData) {
                message.error('Recipient information is missing');
                return;
            }

            setSending(true);

            // Process attachments - Convert to base64 if needed for the mailer
            const attachments = await Promise.all(fileList.map(async (file) => {
                if (file.originFileObj) {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file.originFileObj);
                        reader.onload = () => {
                            resolve({
                                filename: file.name,
                                content: (reader.result as string).split(',')[1],
                                encoding: 'base64',
                                contentType: file.type
                            });
                        };
                    });
                }
                return file;
            }));

            const result = await emailService.sendEmail({
                contact_id: contact?.id,
                to_email: replyData?.to || contact?.email || '',
                cc: values.cc?.trim() || undefined,
                subject: values.subject.trim(),
                body: values.body, // This will be HTML if we use a rich text editor later
                in_reply_to: replyData?.message_id,
                references: replyData?.references ? `${replyData.references} ${replyData.message_id}` : replyData?.message_id,
                attachments
            } as any);

            if (result.success) {
                message.success('Email sent successfully');
                form.resetFields();
                setFileList([]);
                onOpenChange(false);
            } else {
                console.error('EmailComposer: result.error', result.error);
                message.error({
                    content: `Failed to send email: ${result.error || 'Unknown error'}`,
                    duration: 5
                });
            }
        } catch (error) {
            console.error('EmailComposer: Validation or unexpected error', error);

            if (error instanceof Error) {
                message.error('An unexpected error occurred: ' + error.message);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal
            open={open}
            title={
                <Space>
                    <UserOutlined style={{ color: '#1677ff' }} />
                    <span>Compose Email to {
                        (contact as any)?.lead_name ||
                        (contact as any)?.name ||
                        ((contact as any)?.first_name ? `${(contact as any).first_name} ${(contact as any).last_name || ''}` : 'Contact')
                    }</span>
                </Space>
            }
            onCancel={() => onOpenChange(false)}
            footer={[
                <Button key="cancel" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    onClick={handleSend}
                >
                    {sending ? 'Sending...' : 'Send Email'}
                </Button>
            ]}
            width={700}
            centered
            bodyStyle={{
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: '16px 24px'
            }}
            style={{ top: 20 }}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ to: contact?.email }}
                className="mt-2"
            >
                <Form.Item
                    label="To"
                    name="to"
                    className="mb-2"
                >
                    <Input disabled variant="filled" size="small" />
                </Form.Item>

                <Form.Item
                    label="CC"
                    name="cc"
                    className="mb-2"
                    rules={[{ type: 'string', message: 'Please enter valid email addresses' }]}
                >
                    <Input
                        placeholder="comma-separated emails (e.g. boss@company.com, info@site.com)"
                        size="small"
                    />
                </Form.Item>

                {templates.length > 0 && (
                    <Form.Item
                        label="Use Template"
                        name="template_id"
                        className="mb-2"
                    >
                        <Select
                            placeholder="Select a template to auto-fill"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            onChange={handleTemplateSelect}
                            size="small"
                        >
                            {templates.map(t => (
                                <Select.Option key={t.id} value={t.id}>
                                    <Space>
                                        <Badge status="processing" size="small" />
                                        <span>{t.name}</span>
                                        <Text type="secondary" style={{ fontSize: '10px' }}>({t.category || 'General'})</Text>
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item
                    label="Subject"
                    name="subject"
                    className="mb-2"
                    rules={[{ required: true, message: 'Please enter a subject' }]}
                >
                    <Input placeholder="Email subject" size="small" />
                </Form.Item>

                <Form.Item
                    label="Message Body"
                    name="body"
                    className="mb-3 email-editor-container"
                    rules={[{ required: true, message: 'Please enter the email body' }]}
                    trigger="onChange"
                    validateTrigger="onBlur"
                >
                    {isVisualTemplate ? (
                        <div className="border rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                            <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between">
                                <Space size="middle">
                                    <Badge status="processing" text={<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visual High-Fidelity Preview</span>} />
                                </Space>
                                <Button 
                                    size="small" 
                                    type="text" 
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Switch to Simple Editor?',
                                            content: 'Switching to the simple editor might break the visual layout of this template. This cannot be undone.',
                                            onOk: () => setIsVisualTemplate(false)
                                        });
                                    }}
                                >
                                    Edit as text anyway
                                </Button>
                            </div>
                            <div className="bg-white" style={{ height: '400px' }}>
                                <iframe
                                    srcDoc={form.getFieldValue('body')}
                                    title="Email Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <ReactQuill
                            theme="snow"
                            placeholder="Type your message here..."
                            style={{ height: '250px', marginBottom: '50px' }}
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, false] }],
                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                    ['link', 'clean']
                                ],
                            }}
                        />
                    )}
                </Form.Item>

                <Form.Item>
                    <Upload
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setFileList(fileList)}
                        multiple
                    >
                        <Button icon={<PaperClipOutlined />}>Attach Files</Button>
                    </Upload>
                </Form.Item>

                <style>{`
                    .email-editor-container .ql-container {
                        border-bottom-left-radius: 8px;
                        border-bottom-right-radius: 8px;
                        font-family: inherit;
                    }
                    .email-editor-container .ql-toolbar {
                        border-top-left-radius: 8px;
                        border-top-right-radius: 8px;
                        background: #f9fafb;
                    }
                    .email-editor-container .ql-editor {
                        min-height: 200px;
                        font-size: 14px;
                    }
                `}</style>
            </Form>
        </Modal>
    );
}

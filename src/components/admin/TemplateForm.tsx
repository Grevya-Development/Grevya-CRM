import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message, Space, Typography } from 'antd';
import { supabase } from '@/supabase/supabaseClient';

const { TextArea } = Input;
const { Text } = Typography;

interface TemplateFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: any;
    onSuccess: () => void;
}

const CATEGORIES = [
    { label: 'General', value: 'general' },
    { label: 'Leads', value: 'leads' },
    { label: 'Customers', value: 'customers' },
    { label: 'Sales', value: 'sales' },
];

const PLACEHOLDERS = {
    general: [
        { label: 'User Name', value: '{{user_name}}' },
        { label: 'User Email', value: '{{user_email}}' },
        { label: 'Current Date', value: '{{current_date}}' },
    ],
    leads: [
        { label: 'Lead Name', value: '{{lead_name}}' },
        { label: 'Lead Subject', value: '{{lead_subject}}' },
        { label: 'Email', value: '{{email}}' },
        { label: 'Phone', value: '{{phone_number}}' },
        { label: 'Industry', value: '{{industry}}' },
        { label: 'Product Interest', value: '{{product_interest}}' },
        { label: 'Estimated Value', value: '{{estimated_deal_value}}' },
        { label: 'Lead Source', value: '{{lead_source}}' },
        { label: 'Campaign', value: '{{campaign_name}}' },
        { label: 'Address', value: '{{address}}' },
    ],
    customers: [
        { label: 'Customer Name', value: '{{customer_name}}' },
        { label: 'Industry', value: '{{industry}}' },
        { label: 'Website', value: '{{website_link}}' },
        { label: 'GST Details', value: '{{gst_details}}' },
        { label: 'Credit Limit', value: '{{credit_limit}}' },
        { label: 'Payment Terms', value: '{{payment_terms}}' },
        { label: 'Annual Revenue', value: '{{annual_revenue}}' },
        { label: 'Status', value: '{{account_status}}' },
    ],
    sales: [
        { label: 'Customer Name', value: '{{customer_name}}' },
        { label: 'Document #', value: '{{document_number}}' },
        { label: 'Amount', value: '{{amount}}' },
    ]
};

export function TemplateForm({ open, onOpenChange, template, onSuccess }: TemplateFormProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (template) {
                form.setFieldsValue({
                    ...template,
                    status: template.status === 'active'
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ status: true, category: 'general' });
            }
        }
    }, [open, template, form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const payload = {
                ...values,
                status: values.status ? 'active' : 'inactive',
                user_id: userId,
                updated_at: new Date().toISOString(),
            };

            let error;
            if (template?.id) {
                const { error: updateError } = await supabase
                    .from('email_templates')
                    .update(payload)
                    .eq('id', template.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('email_templates')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            message.success(`Template ${template ? 'updated' : 'created'} successfully`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving template:', error);
            message.error(error.message || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const textAreaRef = React.useRef<any>(null);

    const insertPlaceholder = (placeholder: string) => {
        const body = form.getFieldValue('body') || '';
        const textarea = textAreaRef.current?.resizableTextArea?.textArea;

        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newBody = body.substring(0, start) + placeholder + body.substring(end);

            form.setFieldsValue({ body: newBody });

            setTimeout(() => {
                textarea.focus();
                const newCursorPos = start + placeholder.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        } else {
            form.setFieldsValue({ body: body + placeholder });
        }
    };

    return (
        <Modal
            open={open}
            title={template ? 'Edit Template' : 'Add New Template'}
            onCancel={() => onOpenChange(false)}
            footer={[
                <Button key="cancel" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                    {template ? 'Update Template' : 'Create Template'}
                </Button>
            ]}
            width={700}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ status: true, category: 'general' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                        label="Template Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter template name' }]}
                    >
                        <Input placeholder="e.g. Welcome Email" />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true }]}
                    >
                        <Select options={CATEGORIES} />
                    </Form.Item>
                </div>

                <Form.Item
                    label="Email Subject"
                    name="subject"
                    rules={[{ required: true, message: 'Please enter subject' }]}
                >
                    <Input placeholder="Email subject line" />
                </Form.Item>

                <Form.Item
                    label="Message Body"
                    name="body"
                    className="mb-2"
                    rules={[{ required: true, message: 'Please enter message body' }]}
                >
                    <TextArea
                        ref={textAreaRef}
                        placeholder="Type your template message here..."
                        rows={8}
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <div className="mb-4">
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                        Available Placeholders (click to add):
                    </Text>
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.category !== currentValues.category}>
                        {({ getFieldValue }) => {
                            const category = getFieldValue('category') || 'general';
                            const globalPlaceholders = PLACEHOLDERS.general;
                            const modulePlaceholders = PLACEHOLDERS[category as keyof typeof PLACEHOLDERS] || [];

                            // Combine unique placeholders
                            const allPlaceholders = [...globalPlaceholders];
                            modulePlaceholders.forEach(mp => {
                                if (!allPlaceholders.find(ap => ap.value === mp.value)) {
                                    allPlaceholders.push(mp);
                                }
                            });

                            return (
                                <Space wrap>
                                    {allPlaceholders.map(p => (
                                        <Button
                                            key={p.value}
                                            size="small"
                                            onClick={() => insertPlaceholder(p.value)}
                                            style={{ fontSize: '11px' }}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </Space>
                            );
                        }}
                    </Form.Item>
                </div>

                <Form.Item
                    label="Status"
                    name="status"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
            </Form>
        </Modal>
    );
}

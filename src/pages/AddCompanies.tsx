import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Row, Col, Card, Space, message, InputNumber, Spin } from 'antd';
import { Mail, Phone, Building2, Globe, Save, Users, IndianRupee } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { supabase } from '../supabase/supabaseClient';

const { Option } = Select;

const AddCompanies = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [submittable, setSubmittable] = useState(false);

    const isEditMode = !!id;
    const values = Form.useWatch([], form);

    useEffect(() => {
        form.validateFields({ validateOnly: true }).then(
            () => setSubmittable(true),
            () => setSubmittable(false),
        );
    }, [values, form]);

    useEffect(() => {
        if (isEditMode) {
            fetchCompanyDetails();
        }
    }, [id]);

    const fetchCompanyDetails = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                form.setFieldsValue(data);
            }
        } catch (error: any) {
            console.error('Error fetching company details:', error);
            message.error('Failed to load company details');
            navigate('/companies');
        } finally {
            setFetching(false);
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            if (isEditMode) {
                const { error } = await supabase
                    .from('companies')
                    .update(values)
                    .eq('id', id);
                if (error) throw error;
                message.success('Company updated successfully!');
            } else {
                const { error } = await supabase
                    .from('companies')
                    .insert([values]);
                if (error) throw error;
                message.success('Company created successfully!');
            }
            navigate('/companies');
        } catch (error: any) {
            console.error('Error saving company:', error);
            message.error(`Failed to save company: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const validateMessages = {
        required: '${label} is required!',
        types: {
            email: '${label} is not a valid email!',
            url: '${label} is not a valid URL!',
        },
    };

    if (fetching) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spin size="large" tip="Loading details..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                validateMessages={validateMessages}
                initialValues={{
                    industry: 'Technology',
                    size: '11-50'
                }}
                className="flex flex-col min-h-screen"
                scrollToFirstError
            >
                {/* Content Area */}
                <div className="flex-grow">
                    <Header title={isEditMode ? "Edit Company" : "Add New Company"} />
                    <div className="p-6">
                        <Row gutter={[24, 24]}>
                            {/* Company Information */}
                            <Col xs={24} lg={12}>
                                <Card
                                    title={<Space><Building2 className="text-blue-500" size={20} /> <span className="font-semibold text-slate-700">Company Information</span></Space>}
                                    bordered={false}
                                    className="shadow-sm rounded-lg h-full"
                                >
                                    <Row gutter={24}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="name"
                                                label="Company Name"
                                                rules={[{ required: true, message: 'Please enter company name' }]}
                                            >
                                                <Input prefix={<Building2 size={16} className="text-slate-400" />} placeholder="e.g. Acme Corp" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="website"
                                                label="Website"
                                                rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                                            >
                                                <Input prefix={<Globe size={16} className="text-slate-400" />} placeholder="e.g. https://acme.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="email"
                                                label="Business Email"
                                                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                                            >
                                                <Input prefix={<Mail size={16} className="text-slate-400" />} placeholder="contact@company.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="phone"
                                                label="Phone Number"
                                                rules={[
                                                    { pattern: /^[0-9+ ]+$/, message: 'Please enter a valid phone number' },
                                                    { min: 10, message: 'At least 10 digits' }
                                                ]}
                                            >
                                                <Input prefix={<Phone size={16} className="text-slate-400" />} placeholder="+91 1234567890" maxLength={15} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            {/* Business Profile */}
                            <Col xs={24} lg={12}>
                                <Card
                                    title={<Space><Building2 className="text-purple-500" size={20} /> <span className="font-semibold text-slate-700">Business Profile</span></Space>}
                                    bordered={false}
                                    className="shadow-sm rounded-lg h-full"
                                >
                                    <Row gutter={24}>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="industry" label="Industry">
                                                <Select showSearch placeholder="Select Industry">
                                                    <Option value="Technology">Technology</Option>
                                                    <Option value="Finance">Finance</Option>
                                                    <Option value="Healthcare">Healthcare</Option>
                                                    <Option value="Education">Education</Option>
                                                    <Option value="Manufacturing">Manufacturing</Option>
                                                    <Option value="Retail">Retail</Option>
                                                    <Option value="Other">Other</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="size" label="Company Size">
                                                <Select placeholder="Select Size">
                                                    <Option value="1-10">1-10 employees</Option>
                                                    <Option value="11-50">11-50 employees</Option>
                                                    <Option value="51-200">51-200 employees</Option>
                                                    <Option value="201-500">201-500 employees</Option>
                                                    <Option value="501-1000">501-1000 employees</Option>
                                                    <Option value="1000+">1000+ employees</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Annual Revenue" name="revenue">
                                                <Select placeholder="Select Revenue Range">
                                                    <Option value="Under ₹10 Lakhs">Under ₹10 Lakhs</Option>
                                                    <Option value="₹10 Lakhs - ₹50 Lakhs">₹10 Lakhs - ₹50 Lakhs</Option>
                                                    <Option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</Option>
                                                    <Option value="₹1 Crore - ₹5 Crores">₹1 Crore - ₹5 Crores</Option>
                                                    <Option value="₹5 Crores - ₹20 Crores">₹5 Crores - ₹20 Crores</Option>
                                                    <Option value="₹20 Crores - ₹50 Crores">₹20 Crores - ₹50 Crores</Option>
                                                    <Option value="₹50 Crores+">₹50 Crores+</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Contacts Count" name="contact_count">
                                                <InputNumber
                                                    className="w-full"
                                                    min={0}
                                                    prefix={<Users size={16} className="text-slate-400 mr-2" />}
                                                    placeholder="0"
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={24}>
                                            <Form.Item label="Leads Value" name="total_value">
                                                <InputNumber<number>
                                                    className="w-full"
                                                    min={0}
                                                    formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={(value) => Number(value?.replace(/₹\s?|(,*)/g, '') || 0)}
                                                    placeholder="0.00"
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-end gap-3 shadow-[0_-4px_12px,rgba(0,0,0,0.05)] w-full">
                    <Button size="large" onClick={() => navigate('/companies')}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => form.submit()}
                        disabled={!submittable}
                        loading={loading}
                    >
                        {isEditMode ? "Update Company" : "Save Company"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AddCompanies;

import React, { useEffect, useState } from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Card,
    Typography,
    Upload,
    message,
    InputNumber,
    Space,
    Divider,
    Tabs
} from 'antd';
import {
    Save,
    X,
    Upload as UploadIcon,
    Package,
    Tag as TagIcon,
    ArrowLeft,
    DollarSign,
    Info,
    MessageSquare,
    FileText
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ProductLog } from '@/components/products/ProductLog';
import { supabase } from '../supabase/supabaseClient';
import { Category, Product } from '@/types';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AddProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showChatter, setShowChatter] = useState(true);

    useEffect(() => {
        fetchCategories();
        if (isEditMode) {
            fetchProductData();
        }
    }, [id]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('category_name');
        if (data) setCategories(data);
    };

    const fetchProductData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                form.setFieldsValue(data);
                if (data.image_url) {
                    setFileList([{
                        uid: '-1',
                        name: 'image',
                        status: 'done',
                        url: data.image_url,
                    }]);
                }
            }
        } catch (error) {
            message.error('Failed to fetch product data');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const imageUrl = fileList[0]?.url || '';

            const productData = {
                ...values,
                image_url: imageUrl,
                updated_at: new Date().toISOString()
            };

            if (isEditMode) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', id);
                if (error) throw error;
                message.success('Product updated successfully');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
                message.success('Product created successfully');
            }
            navigate('/products');
        } catch (error: any) {
            message.error(error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomRequest = async (options: any) => {
        const { file, onSuccess, onError, onProgress } = options;
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFileList([{
                uid: '-1',
                name: file.name,
                status: 'done',
                url: publicUrl,
            }]);

            onSuccess(publicUrl);
            message.success('Image uploaded successfully');
        } catch (error: any) {
            console.error('Upload error:', error);
            onError(error);
            message.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        onRemove: () => {
            setFileList([]);
        },
        customRequest: handleCustomRequest,
        fileList,
        maxCount: 1,
        listType: "picture-card",
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col h-screen overflow-hidden">
            <Header title={isEditMode ? "Edit Product" : "Add New Product"} />

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ status: 'active' }}
                    >
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <Button
                                    icon={<ArrowLeft size={16} />}
                                    onClick={() => navigate('/products')}
                                    className="flex items-center gap-2"
                                >
                                    Back to Products
                                </Button>
                                <Space size={12}>
                                    <Button onClick={() => navigate('/products')} className="h-10 px-6 rounded-lg font-semibold">
                                        Discard
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        className="bg-primary h-10 px-8 rounded-lg font-bold border-none"
                                    >
                                        {isEditMode ? 'Update Product' : 'Create Product'}
                                    </Button>
                                </Space>
                            </div>

                            <Row gutter={48}>
                                <Col span={16}>
                                    <div className="bg-white p-8 rounded-lg border shadow-sm space-y-8">
                                        <div className="space-y-6">
                                            <Form.Item
                                                name="name"
                                                label="Product Name"
                                                rules={[{ required: true, message: 'Please enter product name' }]}
                                            >
                                                <Input placeholder="Enter product name" className="text-xl font-bold h-12 rounded-lg" />
                                            </Form.Item>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="sku"
                                                        label="SKU / Internal Reference"
                                                        rules={[{ required: true, message: 'Please enter SKU' }]}
                                                    >
                                                        <Input placeholder="PROD-001" className="h-10" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="category_id"
                                                        label="Category"
                                                        rules={[{ required: true, message: 'Please select category' }]}
                                                    >
                                                        <Select placeholder="Select Category" className="h-10">
                                                            {categories.map(cat => (
                                                                <Option key={cat.id} value={cat.id}>{cat.category_name}</Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="base_price"
                                                        label="Sales Price"
                                                        rules={[{ required: true }]}
                                                    >
                                                        <InputNumber
                                                            className="w-full h-10"
                                                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                            parser={value => value!.replace(/₹\s?|(,*)/g, '')}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="cost"
                                                        label="Cost"
                                                    >
                                                        <InputNumber
                                                            className="w-full h-10"
                                                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                            parser={value => value!.replace(/₹\s?|(,*)/g, '')}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Form.Item
                                                name="company"
                                                label="Company"
                                            >
                                                <Input placeholder="Manufacturer or Brand" className="h-10" />
                                            </Form.Item>

                                            <Form.Item
                                                name="description"
                                                label="Product Description"
                                            >
                                                <Input.TextArea rows={4} placeholder="Enter detailed product description..." />
                                            </Form.Item>

                                            <Form.Item
                                                name="status"
                                                label="Status"
                                            >
                                                <Select className="h-10">
                                                    <Option value="active">Active</Option>
                                                    <Option value="inactive">Inactive</Option>
                                                    <Option value="discontinued">Discontinued</Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>
                                </Col>

                                <Col span={8}>
                                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                                        <Title level={5} className="mb-4">Product Image</Title>
                                        <Upload {...uploadProps} className="product-image-upload">
                                            {fileList.length < 1 && (
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <UploadIcon size={32} className="text-slate-300 mb-2" />
                                                    <div className="text-sm text-slate-400">Click to upload image</div>
                                                </div>
                                            )}
                                        </Upload>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                </div>

                {/* Chatter/Logging Sidebar - Only in Edit Mode */}
                {isEditMode && showChatter && (
                    <ProductLog
                        productId={Number(id)}
                        productName={form.getFieldValue('name')}
                        onClose={() => setShowChatter(false)}
                    />
                )}

                {isEditMode && !showChatter && (
                    <Button
                        className="fixed right-0 top-20 z-50 rounded-l-full bg-primary hover:bg-primary/90 border-none h-10 w-10 flex items-center justify-center p-0 shadow-lg shadow-primary/20"
                        onClick={() => setShowChatter(true)}
                    >
                        <MessageSquare className="text-white" size={20} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AddProduct;

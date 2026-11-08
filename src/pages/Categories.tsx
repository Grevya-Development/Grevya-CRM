import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Input,
    Space,
    Card,
    Typography,
    Modal,
    Form,
    message
} from 'antd';
import {
    Plus,
    Edit2,
    Trash2,
    Layers,
    Search
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { supabase } from '../supabase/supabaseClient';
import { Category } from '@/types';

const { Title, Text } = Typography;

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('category_name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            message.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEdit = async (values: any) => {
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update(values)
                    .eq('id', editingCategory.id);
                if (error) throw error;
                message.success('Category updated');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([values]);
                if (error) throw error;
                message.success('Category added');
            }
            setIsModalVisible(false);
            fetchCategories();
        } catch (error: any) {
            message.error(error.message);
        }
    };

    const deleteCategory = (id: number) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this category?',
            content: 'This will not delete products in this category, but mereka will become uncategorized.',
            onOk: async () => {
                const { error } = await supabase.from('categories').delete().eq('id', id);
                if (error) message.error('Failed to delete category');
                else {
                    message.success('Category deleted');
                    fetchCategories();
                }
            }
        });
    };

    const columns = [
        {
            title: 'Category Name',
            dataIndex: 'category_name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary">
                        <Layers size={16} />
                    </div>
                    <span className="font-bold">{text}</span>
                </Space>
            )
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created',
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: Category) => (
                <Space>
                    <Button
                        type="text"
                        icon={<Edit2 size={16} />}
                        onClick={() => {
                            setEditingCategory(record);
                            form.setFieldsValue(record);
                            setIsModalVisible(true);
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => deleteCategory(record.id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Header title="Product Categories" />

            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <Input
                        placeholder="Search categories..."
                        prefix={<Search size={16} className="text-slate-400" />}
                        className="w-80 rounded-lg"
                    />
                    <Button
                        type="primary"
                        icon={<Plus size={16} />}
                        className="flex items-center gap-2 bg-primary h-10 px-6 rounded-lg font-bold"
                        onClick={() => {
                            setEditingCategory(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add Category
                    </Button>
                </div>

                <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
                    <Table
                        columns={columns}
                        dataSource={categories}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 15 }}
                    />
                </Card>
            </div>

            <Modal
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                width={400}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleAddEdit}>
                    <Form.Item name="category_name" label="Category Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Electronics, Furniture" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Categories;

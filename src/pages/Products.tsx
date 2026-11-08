import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    Button,
    Input,
    Space,
    Card,
    Typography,
    Tag,
    Modal,
    message,
    Row,
    Col,
    Select,
    Dropdown,
    Menu
} from 'antd';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Tag as TagIcon,
    Filter,
    MoreVertical,
    Layers,
    LayoutGrid,
    List,
    Clock,
    Star
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { supabase } from '../supabase/supabaseClient';
import { Product, Category } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';

const { Title, Text } = Typography;
const { Option } = Select;

const Products = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'kanban' | 'list' | 'activity'>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                supabase.from('products').select('*, categories(category_name)').order('created_at', { ascending: false }),
                supabase.from('categories').select('*').order('category_name')
            ]);

            if (prodRes.error) throw prodRes.error;
            setProducts(prodRes.data || []);
            setCategories(catRes.data || []);
        } catch (error: any) {
            message.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categories?.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteProduct = (record: Product) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this product?',
            content: 'This will also permanently delete the associated image.',
            onOk: async () => {
                try {
                    if (record.image_url) {
                        const url = new URL(record.image_url);
                        const pathParts = url.pathname.split('/');
                        const fileName = pathParts[pathParts.length - 1];

                        const { error: storageError } = await supabase.storage
                            .from('product-images')
                            .remove([fileName]);

                        if (storageError) {
                            console.error('Error deleting image from storage:', storageError);
                        } else {
                            console.log('Successfully deleted image from storage:', fileName);
                        }
                    }

                    const { error } = await supabase.from('products').delete().eq('id', record.id);
                    if (error) throw error;

                    message.success('Product and associated data deleted');
                    fetchData();
                } catch (error: any) {
                    message.error('Failed to delete product: ' + error.message);
                }
            }
        });
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Product) => (
                <Space>
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden">
                        {record.image_url ? (
                            <img src={record.image_url} alt={text} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={20} />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{text}</div>
                        <div className="text-xs text-slate-400">{record.sku}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Product Category',
            dataIndex: 'category_id',
            key: 'category',
            render: (_: any, record: any) => (
                <Tag color="blue" className="rounded-full px-3">
                    {record.categories?.category_name || 'Uncategorized'}
                </Tag>
            )
        },
        {
            title: 'Company',
            dataIndex: 'company',
            key: 'company',
            render: (company: string) => company || '-'
        },
        {
            title: 'Sales Price',
            dataIndex: 'base_price',
            key: 'price',
            align: 'right' as const,
            render: (price: number) => <span className="text-slate-900">{formatCurrency(price)}</span>
        },
        {
            title: 'Cost',
            dataIndex: 'cost',
            key: 'cost',
            align: 'right' as const,
            render: (cost: number) => <span className="text-slate-900">{formatCurrency(cost || 0)}</span>
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: Product) => (
                <Space>
                    <Button
                        type="text"
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => deleteProduct(record)}
                    />
                </Space>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Header title="Product Catalog" />

            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <Space>
                        <Input
                            placeholder="Search products..."
                            prefix={<Search size={16} className="text-slate-400" />}
                            className="w-80 rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Space>
                    <Space size={12}>
                        <div className="flex items-center border rounded-md bg-white overflow-hidden">
                            <Button
                                type="text"
                                icon={<LayoutGrid size={18} className={view === 'kanban' ? 'text-primary' : 'text-slate-400'} />}
                                className={`h-9 w-10 flex items-center justify-center rounded-none border-r ${view === 'kanban' ? 'bg-slate-50' : ''}`}
                                onClick={() => setView('kanban')}
                            />
                            <Button
                                type="text"
                                icon={<List size={18} className={view === 'list' ? 'text-primary' : 'text-slate-400'} />}
                                className={`h-9 w-10 flex items-center justify-center rounded-none border-r ${view === 'list' ? 'bg-slate-50' : ''}`}
                                onClick={() => setView('list')}
                            />
                            <Button
                                type="text"
                                icon={<Clock size={18} className={view === 'activity' ? 'text-primary' : 'text-slate-400'} />}
                                className={`h-9 w-10 flex items-center justify-center rounded-none ${view === 'activity' ? 'bg-slate-50' : ''}`}
                                onClick={() => setView('activity')}
                            />
                        </div>
                        <Button
                            type="primary"
                            icon={<Plus size={16} />}
                            className="flex items-center gap-2 bg-primary h-10 px-6 rounded-lg font-bold"
                            onClick={() => navigate('/products/add')}
                        >
                            Add Product
                        </Button>
                    </Space>
                </div>

                {view === 'list' && (
                    <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
                        <Table
                            columns={columns}
                            dataSource={filteredProducts}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            onRow={(record) => ({
                                onClick: () => navigate(`/products/${record.id}`),
                                className: 'cursor-pointer hover:bg-slate-50'
                            })}
                        />
                    </Card>
                )}

                {view === 'kanban' && (
                    <div className="py-4">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <Row gutter={[16, 16]}>
                                {filteredProducts.map((product) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                        <Card
                                            hoverable
                                            className="h-full rounded-md border-slate-200 shadow-none hover:shadow-md transition-shadow group relative cursor-pointer"
                                            bodyStyle={{ padding: '0' }}
                                            onClick={() => navigate(`/products/${product.id}`)}
                                        >
                                            <div className="flex p-3 gap-3">
                                                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={24} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="font-bold text-slate-900 truncate text-sm">{product.name}</div>
                                                    <div className="text-[10px] text-primary font-medium truncate mb-1">{product.categories?.category_name || 'Uncategorized'}</div>
                                                    <div className="text-xs text-slate-600">Price: {formatCurrency(product.base_price)}</div>
                                                </div>
                                                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        type="text"
                                                        icon={<Star size={14} className="text-slate-300 hover:text-amber-400" />}
                                                        className="h-6 w-6 flex items-center justify-center p-0"
                                                    />
                                                    <Dropdown
                                                        menu={{
                                                            items: [
                                                                {
                                                                    key: 'edit',
                                                                    label: 'Edit',
                                                                    icon: <Edit2 size={14} />,
                                                                    onClick: () => navigate(`/products/edit/${product.id}`)
                                                                },
                                                                {
                                                                    key: 'delete',
                                                                    label: 'Delete',
                                                                    danger: true,
                                                                    icon: <Trash2 size={14} />,
                                                                    onClick: () => deleteProduct(product)
                                                                }
                                                            ]
                                                        }}
                                                        trigger={['click']}
                                                    >
                                                        <Button
                                                            type="text"
                                                            icon={<MoreVertical size={14} className="text-slate-400" />}
                                                            className="h-6 w-6 flex items-center justify-center p-0"
                                                        />
                                                    </Dropdown>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                )}

                {view === 'activity' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="p-3 font-semibold text-slate-700 text-xs"></div>
                            <div className="p-3 font-semibold text-slate-700 text-xs border-l border-slate-100">Email</div>
                            <div className="p-3 font-semibold text-slate-700 text-xs border-l border-slate-100">Call</div>
                            <div className="p-3 font-semibold text-slate-700 text-xs border-l border-slate-100">Meeting</div>
                            <div className="p-3 font-semibold text-slate-700 text-xs border-l border-slate-100">To-Do</div>
                            <div className="p-3 font-semibold text-slate-700 text-xs border-l border-slate-100">Upload Document</div>
                        </div>
                        <div className="p-8">
                            <Button
                                type="text"
                                icon={<Plus size={16} />}
                                className="text-primary font-bold p-0 flex items-center hover:bg-transparent"
                            >
                                Schedule activity
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;

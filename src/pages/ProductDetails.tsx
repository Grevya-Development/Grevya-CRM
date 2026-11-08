import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Row,
    Col,
    Card,
    Space,
    Typography,
    Tag,
    Skeleton,
    Tabs,
    Divider,
    message,
    Statistic
} from 'antd';
import {
    ArrowLeft,
    Package,
    Tag as TagIcon,
    DollarSign,
    FileText,
    Building,
    Edit2,
    Calendar,
    Layers,
    Info,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ProductLog } from '@/components/products/ProductLog';
import { supabase } from '../supabase/supabaseClient';
import { Product } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [showChatter, setShowChatter] = useState(true);

    useEffect(() => {
        if (id) {
            fetchProductDetails();
        }
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(category_name)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProduct(data);
        } catch (error: any) {
            message.error('Failed to fetch product details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-8 text-center py-20">
                <Title level={4}>Product not found</Title>
                <Button onClick={() => navigate('/products')} icon={<ArrowLeft size={16} />}>Back to Products</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col h-screen overflow-hidden">
            <Header title={product.name} subtitle={product.categories?.category_name || 'Uncategorized'} />

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex justify-between items-center mb-8">
                        <Space>
                            <Button
                                icon={<ArrowLeft size={16} />}
                                onClick={() => navigate('/products')}
                                className="flex items-center gap-2"
                            >
                                Back to Products
                            </Button>
                        </Space>
                        <Space>
                            <Button
                                icon={<Edit2 size={16} />}
                                type="primary"
                                onClick={() => navigate(`/products/edit/${id}`)}
                                className="bg-primary h-10 px-6 rounded-lg font-bold border-none"
                            >
                                Edit Product
                            </Button>
                        </Space>
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden mb-6" bodyStyle={{ padding: 0 }}>
                                <div className="p-1 border-b bg-slate-50/50">
                                    <Tabs
                                        defaultActiveKey="info"
                                        className="px-4"
                                        items={[
                                            {
                                                key: 'info',
                                                label: <span className="flex items-center gap-2"><Info size={16} /> Information</span>,
                                                children: (
                                                    <div className="p-6 space-y-8">
                                                        <Row gutter={48}>
                                                            <Col span={12}>
                                                                <div className="space-y-6">
                                                                    <div>
                                                                        <div className="text-sm text-slate-500 font-medium mb-1">Product Name</div>
                                                                        <div className="text-xl font-bold text-slate-900">{product.name}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm text-slate-500 font-medium mb-1">SKU</div>
                                                                        <div className="font-semibold text-slate-700">{product.sku || 'N/A'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm text-slate-500 font-medium mb-1">Category</div>
                                                                        <Tag color="blue" className="rounded-full px-3 bg-primary/10 text-primary border-none">
                                                                            {product.categories?.category_name || 'Uncategorized'}
                                                                        </Tag>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col span={12}>
                                                                <div className="space-y-6">
                                                                    <div>
                                                                        <div className="text-sm text-slate-500 font-medium mb-1">Sales Price</div>
                                                                        <div className="text-xl font-bold text-primary">{formatCurrency(product.base_price)}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm text-slate-500 font-medium mb-1">Cost</div>
                                                                        <div className="text-xl font-bold text-slate-700">{formatCurrency(product.cost || 0)}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm text-slate-500 font-medium mb-1">Company</div>
                                                                        <div className="font-semibold text-slate-700">{product.company || 'Not Specified'}</div>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>

                                                        <Divider />

                                                        <div>
                                                            <div className="text-sm text-slate-500 font-medium mb-3">Product Description</div>
                                                            <div className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px]">
                                                                {product.description || 'No description provided.'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'specs',
                                                label: <span className="flex items-center gap-2"><Layers size={16} /> Specifications</span>,
                                                children: <div className="py-20 text-center text-slate-400 italic">No technical specifications added yet.</div>
                                            }
                                        ]}
                                    />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden mb-6" bodyStyle={{ padding: 0 }}>
                                <div className="aspect-square bg-slate-50 flex items-center justify-center text-slate-200 border-b relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={120} strokeWidth={1} />
                                    )}
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                                        <Calendar size={16} className="text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-500 font-medium mb-1">Created On</span>
                                            <span className="font-medium">{dayjs(product.created_at).format('MMMM D, YYYY')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                                        <TagIcon size={16} className="text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-500 font-medium mb-1">Status</span>
                                            <Tag
                                                color={product.status === 'active' ? 'success' : product.status === 'discontinued' ? 'error' : 'default'}
                                                className="rounded-full px-3 uppercase text-[10px] font-bold w-fit"
                                            >
                                                {product.status}
                                            </Tag>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
                                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Summary</span>
                                    <Statistic value={0} prefix={<Layers size={14} />} valueStyle={{ fontSize: '14px', fontWeight: 'bold' }} />
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-primary/20 transition-colors cursor-pointer group">
                                        <div>
                                            <div className="text-sm text-slate-500 font-medium mb-1">On Hand</div>
                                            <div className="font-bold text-lg text-slate-900">0.00 Units</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-primary/20 transition-colors cursor-pointer group">
                                        <div>
                                            <div className="text-sm text-slate-500 font-medium mb-1">Forecasted</div>
                                            <div className="font-bold text-lg text-slate-900">0.00 Units</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>

                {showChatter && (
                    <ProductLog
                        productId={Number(id)}
                        productName={product.name}
                        onClose={() => setShowChatter(false)}
                    />
                )}

                {!showChatter && (
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

export default ProductDetails;

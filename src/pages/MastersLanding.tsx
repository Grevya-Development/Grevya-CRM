import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Building, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const masterCategories = [
    {
        id: 'customers',
        title: 'Customer Master',
        description: 'Manage titles, communication preferences, contact types, and customer statuses.',
        icon: Users,
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        hoverColor: 'hover:border-blue-500/50 hover:bg-blue-500/5',
        path: '/configuration/masters/customers'
    },
    {
        id: 'leads',
        title: 'Lead Master',
        description: 'Configure lead sources, lead scores, and industry segments.',
        icon: Target,
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        hoverColor: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
        path: '/configuration/masters/leads'
    },
    {
        id: 'companies',
        title: 'Company Master',
        description: 'Define company sizes, industry types, and organizational structures.',
        icon: Building,
        color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        hoverColor: 'hover:border-amber-500/50 hover:bg-amber-500/5',
        path: '/configuration/masters/companies'
    },
    {
        id: 'products',
        title: 'Product Master',
        description: 'Manage product categories, tax types, and unit of measurements.',
        icon: Package,
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        hoverColor: 'hover:border-purple-500/50 hover:bg-purple-500/5',
        path: '/configuration/masters/products'
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function MastersLanding() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background/50">
            <Header title="Masters Configuration" />

            <div className="p-6 space-y-10">
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Configuration Hub</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Global Master Data</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Centralized management for all reusable values across your CRM. Configure your system components to maintain data consistency and integrity.
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {masterCategories.map((category) => (
                        <motion.div key={category.id} variants={item}>
                            <Card
                                className={`group cursor-pointer border-2 transition-all duration-300 h-full flex flex-col ${category.hoverColor} border-border/50`}
                                onClick={() => navigate(category.path)}
                            >
                                <CardHeader className="space-y-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${category.color} transition-transform group-hover:scale-110 duration-300`}>
                                        <category.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{category.title}</CardTitle>
                                        <CardDescription className="text-sm leading-relaxed">
                                            {category.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="mt-auto pt-6 flex items-center justify-between text-muted-foreground group-hover:text-primary transition-colors">
                                    <span className="text-xs font-medium uppercase tracking-wider">Explore Configuration</span>
                                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

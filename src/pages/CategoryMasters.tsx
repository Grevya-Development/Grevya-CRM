import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    UserCircle,
    MessageSquare,
    UserPlus,
    Settings2,
    Target,
    Building,
    CreditCard,
    MapPin,
    ClipboardList,
    Tags,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

const masterRegistry: Record<string, {
    title: string;
    items: {
        id: string;
        title: string;
        description: string;
        icon: any;
    }[]
}> = {
    customers: {
        title: 'Customer Masters',
        items: [
            { id: 'titles', title: 'Titles', description: 'Manage prefixes like Mr, Ms, Dr, etc.', icon: UserCircle },
            { id: 'comm_prefs', title: 'Preferred Communication', description: 'Enable Email, WhatsApp, SMS, or Phone.', icon: MessageSquare },
            { id: 'contact_types', title: 'Contact Type', description: 'Distinguish between Prospect, Customer, Partner.', icon: UserPlus },
            { id: 'statuses', title: 'Status', description: 'Define lifecycle stages like Active or Dormant.', icon: Settings2 },
            { id: 'lead_sources', title: 'Lead Source', description: 'Track where your customers come from.', icon: Target }
        ]
    },
    leads: {
        title: 'Lead Masters',
        items: [
            { id: 'lead_scores', title: 'Probability Scores', description: 'Define scoring tiers from 0-100.', icon: ClipboardList },
            { id: 'lead_industries', title: 'Industrial Segments', description: 'Categorize leads by industrial sector.', icon: Building },
            { id: 'tags', title: 'Lead Tags', description: 'Manage quick labels for lead tagging.', icon: Tags }
        ]
    },
    companies: {
        title: 'Company Masters',
        items: [
            { id: 'company_sizes', title: 'Employee Brackets', description: 'Define company size ranges (e.g., 1-10, 50+).', icon: Building },
            { id: 'regions', title: 'Operational Regions', description: 'Manage geographical sales territories.', icon: MapPin },
            { id: 'tax_profiles', title: 'Tax Classifications', description: 'Define VAT, GST or generic tax profiles.', icon: CreditCard }
        ]
    },
    products: {
        title: 'Product Masters',
        items: [
            { id: 'uom', title: 'Units of Measure', description: 'Manage Kgs, Pieces, Meters, etc.', icon: CheckCircle2 },
            { id: 'product_categories', title: 'Product Groups', description: 'Define top-level product classifications.', icon: Settings2 }
        ]
    }
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { scale: 0.9, opacity: 0 },
    show: { scale: 1, opacity: 1 }
};

export default function CategoryMasters() {
    const navigate = useNavigate();
    const { category } = useParams<{ category: string }>();

    const categoryData = category ? masterRegistry[category] : null;

    if (!categoryData) {
        return (
            <div className="p-8 text-center space-y-4">
                <h2 className="text-xl font-bold">Category Not Found</h2>
                <Button onClick={() => navigate('/configuration/masters')}>Back to Masters</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/50">
            <Header
                title={categoryData.title}
            />

            <div className="p-6 space-y-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => navigate('/configuration/masters')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{categoryData.title}</h2>
                        <p className="text-muted-foreground">Select a master dataset to manage its values.</p>
                    </div>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {categoryData.items.map((master) => (
                        <motion.div key={master.id} variants={item}>
                            <Card
                                className="group cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card"
                                onClick={() => navigate(`/configuration/masters/${category}/${master.id}`)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                        <master.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg leading-none">{master.title}</CardTitle>
                                        <CardDescription className="text-xs">{master.description}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 border-t border-border/10 mt-2 flex items-center justify-end">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary pt-3 transition-colors">
                                        Edit Master Table
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

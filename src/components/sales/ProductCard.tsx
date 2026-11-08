import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Product } from '@/types';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    statusColors: Record<string, string>;
    formatCurrency: (amount: number) => string;
}

export const ProductCard = ({ product, onEdit, onDelete, statusColors, formatCurrency }: ProductCardProps) => (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
        <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg leading-none">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                </div>
                <Badge className={statusColors[product.status]}>{product.status}</Badge>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex-grow">
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{product.category_name || '-'}</span>
                </div>
                <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-bold text-primary">{formatCurrency(product.base_price)}</span>
                </div>
                {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {product.description}
                    </p>
                )}
            </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(product)} className="h-8">
                <Edit className="h-4 w-4 mr-2" />
                Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)} className="h-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
            </Button>
        </CardFooter>
    </Card>
);

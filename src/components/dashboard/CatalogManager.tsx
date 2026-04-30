import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';
import { ImageUpload } from './ImageUpload';

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  image_urls: string[] | null;
  typical_price: number | null;
  size: string | null;
  color: string | null;
  dimensions: string | null;
}

interface Category {
  id: string;
  name: string;
}

const catalogSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(255, "Name must be less than 255 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  typical_price: z.string().trim().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1000000;
  }, "Price must be a valid positive number less than 1,000,000").optional(),
  dimensions: z.string().trim().max(100, "Dimensions must be less than 100 characters").optional(),
  size: z.string().trim().max(50, "Size must be less than 50 characters").optional(),
  color: z.string().trim().max(50, "Color must be less than 50 characters").optional(),
  image_urls: z.array(z.string()).optional(),
});

export function CatalogManager() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    image_urls: [],
    typical_price: '',
    size: '',
    color: '',
    dimensions: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('product_catalog')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch catalog products');
      return;
    }
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      toast.error('Failed to fetch categories');
      return;
    }
    setCategories(data || []);
  };

  const validateForm = () => {
    try {
      catalogSchema.parse({
        name: formData.name,
        description: formData.description,
        typical_price: formData.typical_price,
        dimensions: formData.dimensions,
        size: formData.size,
        color: formData.color,
        image_urls: formData.image_urls,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category_id: formData.category_id || null,
      image_urls: formData.image_urls,
      typical_price: formData.typical_price ? parseFloat(formData.typical_price) : null,
      size: formData.size.trim() || null,
      color: formData.color.trim() || null,
      dimensions: formData.dimensions.trim() || null
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('product_catalog')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast.error('Failed to update product');
        return;
      }
      toast.success('Product updated successfully');
    } else {
      const { error } = await supabase
        .from('product_catalog')
        .insert(productData);

      if (error) {
        toast.error('Failed to add product');
        return;
      }
      toast.success('Product added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('product_catalog')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete product');
      return;
    }

    toast.success('Product deleted successfully');
    fetchProducts();
  };

  const openEditDialog = (product: CatalogProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      image_urls: product.image_urls || [],
      typical_price: product.typical_price?.toString() || '',
      size: product.size || '',
      color: product.color || '',
      dimensions: product.dimensions || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setErrors({});
    setFormData({
      name: '',
      description: '',
      category_id: '',
      image_urls: [],
      typical_price: '',
      size: '',
      color: '',
      dimensions: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Product Catalog</h2>
          <span className="text-sm text-muted-foreground">(Admin Only)</span>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="p-4">
            {product.image_urls && product.image_urls.length > 0 && (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
            )}
            <h3 className="font-semibold">{product.name}</h3>
            {product.typical_price && (
              <p className="text-sm font-medium mt-1">{formatCurrency(product.typical_price)}</p>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(product)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add Product to Catalog'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={255}
                required
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={2000}
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label>Product Images</Label>
              <ImageUpload
                value={formData.image_urls}
                onChange={(urls) => setFormData({ ...formData, image_urls: urls })}
                label=""
              />
              {errors.image_urls && <p className="text-sm text-destructive mt-1">{errors.image_urls}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="typical_price">Typical Price</Label>
                <Input
                  id="typical_price"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  value={formData.typical_price}
                  onChange={(e) => setFormData({ ...formData, typical_price: e.target.value })}
                  placeholder="0.00"
                />
                {errors.typical_price && <p className="text-sm text-destructive mt-1">{errors.typical_price}</p>}
              </div>

              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  maxLength={50}
                />
                {errors.size && <p className="text-sm text-destructive mt-1">{errors.size}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  maxLength={50}
                />
                {errors.color && <p className="text-sm text-destructive mt-1">{errors.color}</p>}
              </div>

              <div>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  maxLength={100}
                />
                {errors.dimensions && <p className="text-sm text-destructive mt-1">{errors.dimensions}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

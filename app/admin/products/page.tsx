'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

export default function ProductsPage() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<{ products: any[]; count: number }>({
    queryKey: ['/api/products'],
  });
  
  const products = data?.products || [];

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/products/${data.id}`, data.updates);
      const updatedProduct = await response.json();
      return updatedProduct;
    },
    onSuccess: async (updatedProduct) => {
      queryClient.setQueryData<{ products: any[]; count: number }>(['/api/products'], (old) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products.map(p => p.id === updatedProduct.id ? updatedProduct : p),
        };
      });
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);
    const priceInput = formData.get('price') as string;
    const priceFloat = parseFloat(priceInput);
    
    if (isNaN(priceFloat) || priceFloat < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }
    
    const updates: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Math.round(priceFloat * 100),
      sku: formData.get('sku') as string || null,
      durationBillingId: formData.get('durationBillingId') as string || null,
      serviceTitanMembershipTypeId: formData.get('serviceTitanMembershipTypeId') as string || null,
    };

    updateProductMutation.mutate({ id: editingProduct.id, updates });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const memberships = products?.filter(p => p.category === 'membership') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Products & Memberships</h1>
        <p className="text-muted-foreground mb-6">
          Manage VIP membership SKUs and ServiceTitan integration settings
        </p>

        <div className="grid gap-4">
          {memberships.map((product) => (
            <Card key={product.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
                    <span className="text-2xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                      ${(product.price / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-product-description-${product.id}`}>{product.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">SKU</span>
                      </div>
                      <span className="text-foreground" data-testid={`text-product-sku-${product.id}`}>{product.sku || 'Not set'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Duration Billing ID</span>
                      </div>
                      <span className="text-foreground font-mono text-xs" data-testid={`text-product-duration-billing-id-${product.id}`}>{product.durationBillingId || 'Not set'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">ServiceTitan Type ID</span>
                      </div>
                      <span className="text-foreground font-mono text-xs" data-testid={`text-product-servicetitan-type-id-${product.id}`}>{product.serviceTitanMembershipTypeId || 'Not set'}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleEdit(product)}
                  size="sm"
                  variant="outline"
                  data-testid={`button-edit-product-${product.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingProduct?.name}
                required
                data-testid="input-product-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingProduct?.description}
                required
                data-testid="input-product-description"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (in dollars)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={editingProduct ? (editingProduct.price / 100).toFixed(2) : ''}
                required
                data-testid="input-product-price"
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={editingProduct?.sku || ''}
                placeholder="e.g., VIP-ANNUAL"
                data-testid="input-product-sku"
              />
            </div>
            <div>
              <Label htmlFor="durationBillingId">Duration Billing ID</Label>
              <Input
                id="durationBillingId"
                name="durationBillingId"
                defaultValue={editingProduct?.durationBillingId || ''}
                placeholder="ServiceTitan billing ID"
                data-testid="input-duration-billing-id"
              />
            </div>
            <div>
              <Label htmlFor="serviceTitanMembershipTypeId">ServiceTitan Membership Type ID</Label>
              <Input
                id="serviceTitanMembershipTypeId"
                name="serviceTitanMembershipTypeId"
                defaultValue={editingProduct?.serviceTitanMembershipTypeId || ''}
                placeholder="ServiceTitan membership type ID"
                data-testid="input-servicetitan-type-id"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={updateProductMutation.isPending} data-testid="button-save">
                {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

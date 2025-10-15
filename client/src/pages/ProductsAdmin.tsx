import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, DollarSign, Tag, Package } from "lucide-react";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ProductsAdmin() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Product> }) => {
      const response = await apiRequest("PATCH", `/api/products/${data.id}`, data.updates);
      const updatedProduct = await response.json() as Product;
      return updatedProduct;
    },
    onSuccess: async (updatedProduct) => {
      // Manually update the cache with the server response
      queryClient.setQueryData<Product[]>(['/api/products'], (old) => {
        if (!old) return old;
        return old.map(p => p.id === updatedProduct.id ? updatedProduct : p);
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);
    const updates: Partial<Product> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string) * 100, // Convert to cents
      sku: formData.get('sku') as string || null,
      durationBillingId: formData.get('durationBillingId') as string || null,
      serviceTitanMembershipTypeId: formData.get('serviceTitanMembershipTypeId') as string || null,
    };

    updateProductMutation.mutate({ id: editingProduct.id, updates });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading products...</div>
      </div>
    );
  }

  const memberships = products?.filter(p => p.category === 'membership') || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products & Memberships</h1>
        <p className="text-muted-foreground">
          Manage SKUs, pricing, and ServiceTitan integration settings
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">VIP Memberships</h2>
          <div className="grid gap-4">
            {memberships.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{product.name}</h3>
                      <span className="text-2xl font-bold text-primary">
                        ${(product.price / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Tag className="w-4 h-4" />
                          <span className="font-medium">SKU</span>
                        </div>
                        <span className="text-foreground">{product.sku || 'Not set'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Package className="w-4 h-4" />
                          <span className="font-medium">Duration/Billing ID</span>
                        </div>
                        <span className="text-foreground">{product.durationBillingId || 'Not set'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">ST Membership Type</span>
                        </div>
                        <span className="text-foreground">{product.serviceTitanMembershipTypeId || 'Not set'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <span className="font-medium">Status</span>
                        </div>
                        <span className={product.active ? 'text-green-600' : 'text-red-600'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    data-testid={`button-edit-${product.slug}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <form key={editingProduct.id} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                  data-testid="input-product-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProduct.description}
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
                  defaultValue={(editingProduct.price / 100).toFixed(2)}
                  required
                  data-testid="input-product-price"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">ServiceTitan Integration</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      defaultValue={editingProduct.sku || ''}
                      placeholder="e.g., SILVER-TANK-1YR"
                      data-testid="input-product-sku"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used by Zapier to identify this membership
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="durationBillingId">Duration/Billing ID</Label>
                    <Input
                      id="durationBillingId"
                      name="durationBillingId"
                      defaultValue={editingProduct.durationBillingId || ''}
                      placeholder="ServiceTitan duration/billing ID"
                      data-testid="input-product-duration-billing-id"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ServiceTitan duration/billing configuration ID
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="serviceTitanMembershipTypeId">Membership Type ID</Label>
                    <Input
                      id="serviceTitanMembershipTypeId"
                      name="serviceTitanMembershipTypeId"
                      defaultValue={editingProduct.serviceTitanMembershipTypeId || ''}
                      placeholder="ServiceTitan membership type ID"
                      data-testid="input-product-st-membership-type-id"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ServiceTitan membership type identifier
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingProduct(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  data-testid="button-save-product"
                >
                  {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

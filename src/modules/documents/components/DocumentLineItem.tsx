'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface PricebookImage {
  url: string;
  description?: string;
}

interface PricebookItemData {
  id: number;
  type: 'Service' | 'Material' | 'Equipment';
  displayName: string;
  description: string;
  images: PricebookImage[];
}

interface DocumentLineItemProps {
  item: {
    id: number;
    type: 'Service' | 'Material' | 'Equipment';
    skuId: number;
    skuName: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
    memberPrice?: number;
    soldHours?: number;
  };
  pricebookData?: PricebookItemData | null;
  isLoadingPricebook?: boolean;
  formatCurrency: (amount: number) => string;
  onImageClick?: (imageUrl: string) => void;
}

export function DocumentLineItem({
  item,
  pricebookData,
  isLoadingPricebook = false,
  formatCurrency,
  onImageClick,
}: DocumentLineItemProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get the first image from pricebook data
  const primaryImage = pricebookData?.images?.[0];
  const hasImage = primaryImage && !imageError;

  return (
    <Card data-testid={`line-item-${item.id}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {isLoadingPricebook ? (
              <Skeleton className="w-20 h-20 rounded-md" />
            ) : hasImage ? (
              <button
                onClick={() => onImageClick?.(primaryImage.url)}
                className="group relative w-20 h-20 rounded-md overflow-hidden border border-border hover-elevate active-elevate-2 transition-all"
                data-testid={`image-${item.skuId}`}
              >
                <img
                  src={primaryImage.url}
                  alt={pricebookData?.displayName || item.skuName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                {pricebookData?.images && pricebookData.images.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    +{pricebookData.images.length - 1}
                  </div>
                )}
              </button>
            ) : (
              <div className="w-20 h-20 rounded-md border border-border flex items-center justify-center bg-muted">
                <ImageOff className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" data-testid={`badge-type-${item.type}`}>
                {item.type}
              </Badge>
              <p className="font-medium text-sm sm:text-base" data-testid={`text-name-${item.skuId}`}>
                {pricebookData?.displayName || item.skuName}
              </p>
            </div>
            
            {(pricebookData?.description || item.description) && (
              <div className="text-sm text-muted-foreground mb-2 line-clamp-3 prose prose-sm max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {pricebookData?.description || item.description}
                </ReactMarkdown>
              </div>
            )}
            
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <span data-testid={`text-quantity-${item.id}`}>
                Qty: {Number(item.quantity).toFixed(0)}
              </span>
              <span>× {formatCurrency(item.price)}</span>
              {item.soldHours && (
                <span className="text-xs">
                  ({item.soldHours}h per unit)
                </span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-sm sm:text-base" data-testid={`text-total-${item.id}`}>
              {formatCurrency(item.total)}
            </p>
            {item.memberPrice && item.memberPrice < item.price && (
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Member: {formatCurrency(item.memberPrice * item.quantity)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

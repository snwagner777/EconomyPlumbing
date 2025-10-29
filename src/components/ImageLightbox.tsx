'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNavigate }: ImageLightboxProps) {
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && index < images.length - 1) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [index, images.length, onClose]);

  const handlePrevious = () => {
    const newIndex = Math.max(0, index - 1);
    setIndex(newIndex);
    onNavigate?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(images.length - 1, index + 1);
    setIndex(newIndex);
    onNavigate?.(newIndex);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={handleBackdropClick}
      data-testid="lightbox-overlay"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        onClick={onClose}
        data-testid="button-close-lightbox"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            onClick={handlePrevious}
            disabled={index === 0}
            data-testid="button-prev-image"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            onClick={handleNext}
            disabled={index === images.length - 1}
            data-testid="button-next-image"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm" data-testid="text-image-counter">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt=""
        className="max-w-full max-h-full object-contain"
        data-testid="img-lightbox"
      />
    </div>
  );
}

interface ClickableImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export function ClickableImage({ src, alt, className, ...props }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer ${className || ''}`}
        onClick={() => setIsOpen(true)}
        {...props}
      />
      {isOpen && (
        <ImageLightbox
          images={[src]}
          currentIndex={0}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

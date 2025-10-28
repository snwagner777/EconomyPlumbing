import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, RotateCcw } from "lucide-react";

interface FocalPointEditorProps {
  imageUrl: string;
  initialFocalPoint?: { x: number; y: number }; // 0-100 range
  onFocalPointChange: (focalPoint: { x: number; y: number }) => void;
  label?: string;
}

export function FocalPointEditor({
  imageUrl,
  initialFocalPoint,
  onFocalPointChange,
  label = "Click on the image to set focal point"
}: FocalPointEditorProps) {
  const [focalPoint, setFocalPoint] = useState(initialFocalPoint || { x: 50, y: 50 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFocalPoint) {
      setFocalPoint(initialFocalPoint);
    }
  }, [initialFocalPoint]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight
      });
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values to 0-100
    const clampedX = Math.max(0, Math.min(100, Math.round(x)));
    const clampedY = Math.max(0, Math.min(100, Math.round(y)));

    const newFocalPoint = { x: clampedX, y: clampedY };
    setFocalPoint(newFocalPoint);
    onFocalPointChange(newFocalPoint);
  };

  const handleReset = () => {
    const defaultPoint = { x: 50, y: 50 };
    setFocalPoint(defaultPoint);
    onFocalPointChange(defaultPoint);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          {label}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          data-testid="button-reset-focal-point"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Center
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div
            ref={containerRef}
            className="relative cursor-crosshair rounded-md overflow-hidden bg-muted"
            onClick={handleImageClick}
            data-testid="focal-point-editor"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Set focal point"
              className="w-full h-auto max-h-[500px] object-contain"
              onLoad={handleImageLoad}
            />
            
            {/* Crosshair overlay */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${focalPoint.x}%`,
                top: `${focalPoint.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Outer circle */}
              <div className="absolute w-12 h-12 border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 opacity-80" />
              
              {/* Inner dot */}
              <div className="absolute w-3 h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
              
              {/* Crosshair lines */}
              <div className="absolute w-0.5 h-8 bg-primary -translate-x-1/2 -translate-y-1/2 -top-8 left-0" />
              <div className="absolute w-0.5 h-8 bg-primary -translate-x-1/2 -translate-y-1/2 top-3 left-0" />
              <div className="absolute w-8 h-0.5 bg-primary -translate-x-1/2 -translate-y-1/2 -left-8 top-0" />
              <div className="absolute w-8 h-0.5 bg-primary -translate-x-1/2 -translate-y-1/2 left-3 top-0" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Focal Point: ({focalPoint.x}%, {focalPoint.y}%)
            </div>
            <div className="text-xs text-muted-foreground">
              {focalPoint.x === 50 && focalPoint.y === 50 ? 'Center (AI default)' : 'Custom position'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

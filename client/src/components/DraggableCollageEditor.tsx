import { useState, useRef, useEffect, PointerEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DraggableCollageEditorProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  initialBeforeFocal?: { x: number; y: number };
  initialAfterFocal?: { x: number; y: number };
  onSave: (focalPoints: { before: { x: number; y: number }; after: { x: number; y: number } }) => void;
  onClose: () => void;
  open: boolean;
  isSaving?: boolean;
}

interface FocalPoint {
  x: number;
  y: number;
}

interface DragState {
  startPointerX: number;
  startPointerY: number;
  startFocalX: number;
  startFocalY: number;
}

export function DraggableCollageEditor({
  beforeImageUrl,
  afterImageUrl,
  initialBeforeFocal = { x: 50, y: 50 },
  initialAfterFocal = { x: 50, y: 50 },
  onSave,
  onClose,
  open,
  isSaving = false
}: DraggableCollageEditorProps) {
  const [beforeFocal, setBeforeFocal] = useState<FocalPoint>(initialBeforeFocal);
  const [afterFocal, setAfterFocal] = useState<FocalPoint>(initialAfterFocal);
  
  const [isDraggingBefore, setIsDraggingBefore] = useState(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState(false);
  
  const beforeDragState = useRef<DragState | null>(null);
  const afterDragState = useRef<DragState | null>(null);
  
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens with new values
  useEffect(() => {
    if (open) {
      setBeforeFocal(initialBeforeFocal);
      setAfterFocal(initialAfterFocal);
    }
  }, [open, initialBeforeFocal, initialAfterFocal]);

  // Clean up pointer capture on unmount or when dragging stops
  useEffect(() => {
    const handlePointerUp = () => {
      setIsDraggingBefore(false);
      setIsDraggingAfter(false);
      beforeDragState.current = null;
      afterDragState.current = null;
    };

    if (isDraggingBefore || isDraggingAfter) {
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [isDraggingBefore, isDraggingAfter]);

  const handlePointerDown = (type: 'before' | 'after') => (e: PointerEvent) => {
    e.preventDefault();
    const ref = type === 'before' ? beforeRef : afterRef;
    const focal = type === 'before' ? beforeFocal : afterFocal;
    
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    
    // Store the starting position and focal point
    const dragState: DragState = {
      startPointerX: pointerX,
      startPointerY: pointerY,
      startFocalX: focal.x,
      startFocalY: focal.y,
    };
    
    if (type === 'before') {
      beforeDragState.current = dragState;
      setIsDraggingBefore(true);
    } else {
      afterDragState.current = dragState;
      setIsDraggingAfter(true);
    }
  };

  const handlePointerMove = (type: 'before' | 'after') => (e: PointerEvent) => {
    const isDragging = type === 'before' ? isDraggingBefore : isDraggingAfter;
    const ref = type === 'before' ? beforeRef : afterRef;
    const setFocal = type === 'before' ? setBeforeFocal : setAfterFocal;
    const dragState = type === 'before' ? beforeDragState.current : afterDragState.current;
    
    if (!isDragging || !ref.current || !dragState) return;

    const rect = ref.current.getBoundingClientRect();
    
    // Get current pointer position relative to frame
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    
    // Calculate how far the pointer has moved (in pixels)
    const deltaX = pointerX - dragState.startPointerX;
    const deltaY = pointerY - dragState.startPointerY;
    
    // Convert pixel delta to percentage delta
    // Since the image is 200% size, moving 1% of frame = moving 0.5% of image focal point
    const focalDeltaX = (deltaX / rect.width) * 100 * 0.5;
    const focalDeltaY = (deltaY / rect.height) * 100 * 0.5;
    
    // Calculate new focal point by SUBTRACTING the delta
    // (dragging right means we want to see more of the left part of the image)
    const newFocalX = dragState.startFocalX - focalDeltaX;
    const newFocalY = dragState.startFocalY - focalDeltaY;
    
    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(100, newFocalX));
    const clampedY = Math.max(0, Math.min(100, newFocalY));

    setFocal({ x: clampedX, y: clampedY });
  };

  const handleSave = () => {
    onSave({
      before: beforeFocal,
      after: afterFocal
    });
  };

  const handleReset = () => {
    setBeforeFocal({ x: 50, y: 50 });
    setAfterFocal({ x: 50, y: 50 });
  };

  // Calculate image position based on focal point
  // Focal point represents where in the original image should be centered
  const getImageStyle = (focal: FocalPoint) => {
    // The frame shows a cropped view of the image
    // Image is 200% size, so we need to account for the scale
    // To center focal point X at 50%, we need: left = 50% - (focalX * 2)
    // This allows full 0-100% focal range to translate to proper positioning
    return {
      left: `${50 - (focal.x * 2)}%`,
      top: `${50 - (focal.y * 2)}%`,
    };
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isSaving) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-collage-editor">
        <DialogHeader>
          <DialogTitle>Adjust Photo Positioning</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Drag each image to position the main subject where you want it to appear in the collage
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Before Photo */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Before Photo</h3>
            <div
              ref={beforeRef}
              className={`relative w-full aspect-[4/3] bg-white border-8 border-white shadow-lg overflow-hidden ${
                isDraggingBefore ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onPointerDown={handlePointerDown('before')}
              onPointerMove={handlePointerMove('before')}
              data-testid="draggable-before"
            >
              <img
                src={beforeImageUrl}
                alt="Before"
                className="absolute w-[200%] h-[200%] object-cover pointer-events-none select-none"
                style={getImageStyle(beforeFocal)}
                draggable={false}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-white h-16 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-primary">BEFORE</span>
              </div>
              {/* Crosshair indicator */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" />
              </div>
            </div>
          </div>

          {/* After Photo */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">After Photo</h3>
            <div
              ref={afterRef}
              className={`relative w-full aspect-[4/3] bg-white border-8 border-white shadow-lg overflow-hidden ${
                isDraggingAfter ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onPointerDown={handlePointerDown('after')}
              onPointerMove={handlePointerMove('after')}
              data-testid="draggable-after"
            >
              <img
                src={afterImageUrl}
                alt="After"
                className="absolute w-[200%] h-[200%] object-cover pointer-events-none select-none"
                style={getImageStyle(afterFocal)}
                draggable={false}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-white h-16 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-primary">AFTER</span>
              </div>
              {/* Crosshair indicator */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving} data-testid="button-reset">
            Reset to Center
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isSaving} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Save Position"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

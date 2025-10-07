import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Droplets, Leaf, Sprout } from "lucide-react";

export default function SchedulerModal() {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const services = [
    { id: "plumbing", name: "Plumbing", icon: Droplets },
    { id: "water-treatment", name: "Water Treatment", icon: Leaf },
    { id: "irrigation", name: "Irrigation", icon: Sprout }
  ];

  const handleServiceClick = (serviceId: string) => {
    setSelectedService(serviceId);
    // In production, this would integrate with ServiceTitan
    console.log("Selected service:", serviceId);
    // For now, just close the modal after selection
    setTimeout(() => {
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" data-testid="modal-scheduler">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center mb-2">Welcome to Web Scheduler</DialogTitle>
          <p className="text-center text-muted-foreground">What type of service do you need?</p>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Button
                key={service.id}
                variant="outline"
                className={`h-20 text-lg justify-start gap-4 ${
                  selectedService === service.id ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => handleServiceClick(service.id)}
                data-testid={`button-service-${service.id}`}
              >
                <Icon className="w-8 h-8" />
                {service.name}
              </Button>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            data-testid="button-close-scheduler"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

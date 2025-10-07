import ServiceCard from '../ServiceCard';
import { Droplets } from 'lucide-react';
import waterHeaterImage from "@assets/generated_images/Tankless_water_heater_closeup_7279af49.png";

export default function ServiceCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ServiceCard
        icon={Droplets}
        title="Water Heater Services"
        description="Installation, repair, and maintenance of traditional and tankless water heaters."
        features={[
          "Same-day service",
          "All brands serviced",
          "Energy-efficient options"
        ]}
        link="/water-heater-services"
        image={waterHeaterImage}
      />
    </div>
  );
}

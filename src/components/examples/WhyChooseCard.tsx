import WhyChooseCard from '../WhyChooseCard';
import { DollarSign } from 'lucide-react';

export default function WhyChooseCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <WhyChooseCard
        icon={DollarSign}
        title="Upfront Pricing"
        description="No hidden fees or surprises. We provide clear, honest pricing before any work begins."
      />
    </div>
  );
}

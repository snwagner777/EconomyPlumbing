import { memo } from "react";
import { type LucideIcon } from "lucide-react";

interface WhyChooseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const WhyChooseCard = memo(({ icon: Icon, title, description }: WhyChooseCardProps) => {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
});

WhyChooseCard.displayName = "WhyChooseCard";

export default WhyChooseCard;

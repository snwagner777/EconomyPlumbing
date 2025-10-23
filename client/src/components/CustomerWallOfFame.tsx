import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  name: string;
  jobCount: number;
}

export function CustomerWallOfFame() {
  const { data, isLoading } = useQuery<{ leaderboard: LeaderboardEntry[] }>({
    queryKey: ['/api/customers/leaderboard'],
  });

  const leaderboard = data?.leaderboard || [];

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
        <div className="text-center space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  // Determine size classes based on ranking
  const getSizeClass = (index: number) => {
    if (index === 0) return "w-24 h-24 text-2xl"; // Champion
    if (index < 3) return "w-20 h-20 text-xl"; // Top 3
    if (index < 10) return "w-16 h-16 text-lg"; // Top 10
    return "w-14 h-14 text-base"; // Rest
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-amber-400 fill-amber-400"; // Gold
    if (index === 1) return "text-slate-300 fill-slate-300"; // Silver
    if (index === 2) return "text-amber-700 fill-amber-700"; // Bronze
    return null;
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`;
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  const getDisplayName = (name: string): string => {
    const parts = name.trim().split(' ');
    const firstName = parts[0];
    const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : '';
    return `${firstName} ${lastInitial}`.trim();
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-primary fill-primary" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Customer Hall of Fame
            </h2>
            <Trophy className="w-8 h-8 text-primary fill-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Celebrating our most loyal customers who trust us time and time again
          </p>
        </div>

        {/* Customer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
          {leaderboard.map((customer, index) => {
            const sizeClass = getSizeClass(index);
            const medalColor = getMedalColor(index);
            const displayName = getDisplayName(customer.name);
            
            return (
              <div
                key={index}
                className="group relative flex flex-col items-center gap-3 animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationDuration: '500ms',
                  animationFillMode: 'both'
                }}
                data-testid={`customer-hall-${index}`}
              >
                {/* Medal Badge (Top 3) */}
                {medalColor && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Award className={`w-8 h-8 ${medalColor} drop-shadow-md`} />
                  </div>
                )}

                {/* Avatar Circle */}
                <div className="relative">
                  <div
                    className={`
                      ${sizeClass}
                      rounded-full 
                      bg-gradient-to-br from-primary via-primary/80 to-secondary
                      flex items-center justify-center
                      font-bold text-primary-foreground
                      shadow-lg
                      transition-all duration-300
                      group-hover:scale-110 group-hover:shadow-xl
                      group-hover:from-primary/90 group-hover:to-secondary/90
                      cursor-pointer
                      border-4 border-background
                      ${index === 0 ? 'ring-4 ring-primary/30 ring-offset-2 ring-offset-background' : ''}
                    `}
                  >
                    {getInitials(customer.name)}
                  </div>

                  {/* VIP Badge for Top 10 */}
                  {index < 10 && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 bg-primary/90 text-primary-foreground border-2 border-background shadow-md"
                      >
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        VIP
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <p className="text-sm font-semibold text-center truncate w-full px-2" data-testid={`text-customer-name-${index}`}>
                    {displayName}
                  </p>
                  <Badge variant="outline" className="text-xs" data-testid={`badge-job-count-${index}`}>
                    {customer.jobCount} {customer.jobCount === 1 ? 'Service' : 'Services'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Message */}
        <div className="text-center pt-6 border-t">
          <p className="text-sm text-muted-foreground italic">
            Want to join the Hall of Fame? Keep scheduling services with Economy Plumbing Services!
          </p>
        </div>
      </div>
    </Card>
  );
}

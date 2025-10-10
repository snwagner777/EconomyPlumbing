import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Filter, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { BeforeAfterComposite } from "@shared/schema";

export default function SuccessStories() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: composites, isLoading } = useQuery<BeforeAfterComposite[]>({
    queryKey: ["/api/before-after-composites"],
  });

  // Filter composites
  const filteredComposites = composites?.filter((composite) => {
    const matchesCategory = selectedCategory === "all" || composite.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      composite.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      composite.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = Array.from(new Set(composites?.map(c => c.category) || []));

  return (
    <>
      <Helmet>
        <title>Success Stories | Economy Plumbing Services</title>
        <meta 
          name="description" 
          content="See real before and after photos from our plumbing projects in Austin and Marble Falls. Water heater installations, leak repairs, drain cleaning, and more." 
        />
        <link rel="alternate" type="application/rss+xml" title="Success Stories RSS Feed" href="/api/success-stories/rss" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-page-title">
              Success Stories
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl" data-testid="text-page-description">
              Real transformations from real customers. See the quality craftsmanship that makes Economy Plumbing Services the trusted choice in Austin and Marble Falls.
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="container mx-auto max-w-6xl px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search success stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-stories"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* RSS Feed Link */}
              <Button variant="outline" asChild data-testid="button-rss-feed">
                <a href="/api/success-stories/rss" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  RSS Feed
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="container mx-auto max-w-6xl px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="aspect-square w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredComposites && filteredComposites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComposites.map((composite) => (
                <Card 
                  key={composite.id} 
                  className="overflow-hidden hover-elevate transition-all"
                  data-testid={`card-composite-${composite.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" data-testid={`badge-category-${composite.id}`}>
                        {composite.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid={`text-date-${composite.id}`}>
                        {new Date(composite.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2" data-testid={`text-caption-${composite.id}`}>
                      {composite.caption || "Before & After Transformation"}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-0 pb-4">
                    <img
                      src={composite.compositeUrl}
                      alt={composite.caption || "Before and after comparison"}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                      data-testid={`img-composite-${composite.id}`}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg" data-testid="text-no-results">
                {searchQuery || selectedCategory !== "all" 
                  ? "No success stories match your filters. Try adjusting your search or category."
                  : "Images coming soon! We're currently preparing amazing before & after transformations from our recent projects. Check back soon!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

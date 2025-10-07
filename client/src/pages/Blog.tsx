import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  useEffect(() => {
    document.title = "Plumbing Tips & Advice Blog | Economy Plumbing";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Expert plumbing tips, water heater advice, and home maintenance guides from Economy Plumbing Austin."
      );
    }
  }, []);

  const categories = ["All", "Water Heaters", "Drains", "Emergency Tips", "Maintenance", "Leak Repair", "Commercial"];

  const filteredPosts = posts?.filter(
    (post) => selectedCategory === "All" || post.category === selectedCategory
  );

  return (
    <div className="min-h-screen flex flex-col">

      <Header />

      <main className="flex-1">
        <section className="bg-primary text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Plumbing Tips & Advice Blog
            </h1>
            <p className="text-xl text-white/90">
              Expert plumbing tips, water heater advice, and home maintenance guides from Economy Plumbing Austin
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`button-filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {category}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No blog posts found in this category.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

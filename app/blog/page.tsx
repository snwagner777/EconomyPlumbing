'use client';

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Rss, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";

interface BlogResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Scroll to top on initial page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data, isLoading } = useQuery<BlogResponse>({
    queryKey: ["/api/blog", currentPage, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(selectedCategory !== "All" && { category: selectedCategory })
      });
      const response = await fetch(`/api/blog?${params}`);
      if (!response.ok) throw new Error("Failed to fetch blog posts");
      return response.json();
    },
  });

  // Fetch categories dynamically from the API
  const { data: categoriesData } = useQuery<{ categories: string[] }>({
    queryKey: ["/api/blog/categories"],
    queryFn: async () => {
      const response = await fetch("/api/blog/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Always show "All" first, then the rest alphabetically
  const categories = ["All", ...(categoriesData?.categories || [])];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create Blog schema for the listing page
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Economy Plumbing Blog",
    "description": "Expert plumbing tips, water heater advice, and home maintenance guides from Economy Plumbing Services in Austin and Marble Falls, Texas",
    "url": "https://www.plumbersthatcare.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Economy Plumbing Services",
      "url": "https://www.plumbersthatcare.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
        "width": "1024",
        "height": "1024"
      }
    },
    "inLanguage": "en-US"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Plumbing Tips & Advice Blog | Economy Plumbing"
        description="Austin & Marble Falls plumbing tips: water heater maintenance, drain care, leak prevention & home maintenance guides. Expert advice from Economy Plumbing."
        canonical="https://www.plumbersthatcare.com/blog"
        schema={blogSchema}
      />

      <Header />

      <main className="flex-1">
        <section className="bg-primary text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Plumbing Tips & Advice Blog
            </h1>
            <p className="text-xl text-white/90 mb-6">
              Expert plumbing tips, water heater advice, and home maintenance guides from Economy Plumbing Austin
            </p>
            <a 
              href="/rss.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
              data-testid="link-rss-feed"
            >
              <Rss className="w-5 h-5" />
              <span className="text-sm font-medium">Subscribe to RSS Feed</span>
            </a>
          </div>
        </section>

        <section className="py-12 lg:py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category)}
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
            ) : data?.posts && data.posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {data.posts.map((post, index) => (
                    <BlogCard key={post.id} post={post} priority={index === 0 && data.pagination.page === 1} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12" data-testid="pagination-controls">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Mobile: Simple page indicator */}
                    <div className="md:hidden flex items-center justify-center px-4">
                      <span className="text-sm font-medium" data-testid="text-page-indicator">
                        Page {currentPage} of {data.pagination.totalPages}
                      </span>
                    </div>

                    {/* Desktop: Smart pagination with ellipsis */}
                    <div className="hidden md:flex items-center gap-2">
                      {(() => {
                        const totalPages = data.pagination.totalPages;
                        const current = currentPage;
                        const pages: (number | string)[] = [];

                        if (totalPages <= 7) {
                          // Show all pages if 7 or fewer
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);

                          if (current > 3) {
                            pages.push('...');
                          }

                          // Show pages around current
                          const start = Math.max(2, current - 1);
                          const end = Math.min(totalPages - 1, current + 1);
                          
                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }

                          if (current < totalPages - 2) {
                            pages.push('...');
                          }

                          // Always show last page
                          pages.push(totalPages);
                        }

                        return pages.map((page, index) =>
                          typeof page === 'number' ? (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              onClick={() => handlePageChange(page)}
                              className="min-w-10"
                              data-testid={`button-page-${page}`}
                            >
                              {page}
                            </Button>
                          ) : (
                            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                              {page}
                            </span>
                          )
                        );
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === data.pagination.totalPages}
                      aria-label="Next page"
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
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

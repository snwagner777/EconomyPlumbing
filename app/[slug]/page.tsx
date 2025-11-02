'use client';

/**
 * Dynamic Blog Post Page
 * 
 * Handles individual blog post URLs (/:slug)
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import InlineReviewCard from "@/components/InlineReviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, User, Phone, ChevronLeft, ChevronRight, Home, X } from "lucide-react";
import { format } from "date-fns";
import { createBlogPostSchema, createBreadcrumbListSchema } from "@/components/SEO/JsonLd";
import type { BlogPost } from "@shared/schema";
import { usePhoneConfig, useMarbleFallsPhone } from "@/hooks/usePhoneConfig";

// Map blog categories to review categories
const BLOG_CATEGORY_TO_REVIEW_CATEGORY: Record<string, string> = {
  "Water Heaters": "water_heater",
  "Drain Cleaning": "drain",
  "Drains": "drain",
  "Emergency Tips": "general",
  "Maintenance": "general",
  "Leak Repair": "leak",
  "Commercial": "general",
  "Backflow Testing": "general",
  "Customer Stories": "general",
  "Seasonal Tips": "general",
  "Promotions": "general",
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string || "";
  const phoneConfig = usePhoneConfig();
  const marbleFallsPhoneConfig = useMarbleFallsPhone();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  // Fetch original photo for lightbox if imageId exists
  const { data: originalPhoto } = useQuery<{ photoUrl: string; thumbnailUrl?: string }>({
    queryKey: ["/api/photos", post?.imageId],
    enabled: !!post?.imageId && lightboxOpen,
  });

  const { data: allPostsData } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog"],
  });

  const canonicalUrl = `https://www.plumbersthatcare.com/${slug}`;

  const allPosts = allPostsData?.posts || [];

  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.category === post?.category &&
        p.slug !== post?.slug
    )
    .slice(0, 3);

  // Find prev/next posts by publish date
  const sortedPosts = [...allPosts].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
  const currentIndex = sortedPosts.findIndex(p => p.id === post?.id) ?? -1;
  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < (sortedPosts.length ?? 0) - 1 ? sortedPosts[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground">
              The blog post you're looking for doesn't exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const blogPostSchema = post ? createBlogPostSchema(post) : undefined;
  const breadcrumbSchema = post ? createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Blog", url: "https://www.plumbersthatcare.com/blog" },
    { name: post.title, url: canonicalUrl }
  ]) : undefined;

  return (
    <div className="min-h-screen flex flex-col">

      <Header />

      <main className="flex-1">
        <article className="py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground" data-testid="nav-breadcrumbs">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-foreground flex items-center gap-1" data-testid="link-breadcrumb-home">
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/blog" className="hover:text-foreground" data-testid="link-breadcrumb-blog">
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground" data-testid="text-breadcrumb-current">{post.title}</li>
              </ol>
            </nav>

            <div className="mb-6">
              <Badge className="mb-4" data-testid="badge-category">
                {post.category}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4" data-testid="text-title">
                {post.h1 || post.title}
              </h1>
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span data-testid="text-author">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-date">
                    {post.publishDate && !isNaN(new Date(post.publishDate).getTime()) 
                      ? format(new Date(post.publishDate), "MMMM dd, yyyy")
                      : format(new Date(), "MMMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {post.featuredImage && (
              <div className="mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  width="1200"
                  height="630"
                  loading="eager"
                  fetchPriority="high"
                  onClick={() => setLightboxOpen(true)}
                  className="w-full h-96 object-cover rounded-lg cursor-pointer hover-elevate active-elevate-2 transition-all"
                  style={{
                    objectPosition: post.focalPointX && post.focalPointY 
                      ? `${post.focalPointX}% ${post.focalPointY}%`
                      : 'center center'
                  }}
                  data-testid="img-featured"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">Click image to view full size</p>
              </div>
            )}

            {/* Blog content wrapper with floating review card */}
            <div className="relative">
              {/* Review card floats and is positioned down using CSS */}
              {post.category && BLOG_CATEGORY_TO_REVIEW_CATEGORY[post.category] && (
                <div 
                  className="hidden md:block md:float-right md:ml-6 md:w-80 lg:w-96 mb-6"
                  style={{ marginTop: '12rem' }}
                >
                  <InlineReviewCard 
                    category={BLOG_CATEGORY_TO_REVIEW_CATEGORY[post.category]}
                    minRating={4}
                  />
                </div>
              )}
              
              <div
                className="prose prose-lg max-w-none mb-12"
                data-testid="text-content"
              >
                {/* Mobile review card - shows before content on mobile */}
                {post.category && BLOG_CATEGORY_TO_REVIEW_CATEGORY[post.category] && (
                  <div className="md:hidden not-prose mb-6">
                    <InlineReviewCard 
                      category={BLOG_CATEGORY_TO_REVIEW_CATEGORY[post.category]}
                      minRating={4}
                    />
                  </div>
                )}
                
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Related Articles - Card Format */}
            {relatedPosts && relatedPosts.length > 0 && (
              <div className="bg-card border rounded-lg p-6 mb-12" data-testid="card-related-articles">
                <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <BlogCard key={relatedPost.id} post={relatedPost} />
                  ))}
                </div>
              </div>
            )}

            {/* Post Navigation */}
            {(prevPost || nextPost) && (
              <div className="border-t pt-8 mt-12" data-testid="nav-pagination">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  {prevPost && (
                    <Link href={`/${prevPost.slug}`} className="flex-1">
                      <Button variant="ghost" className="gap-2 w-full sm:w-auto justify-start" data-testid="button-prev-post">
                        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <div className="text-xs text-muted-foreground">Previous</div>
                          <div className="font-medium truncate">{prevPost.title}</div>
                        </div>
                      </Button>
                    </Link>
                  )}
                  {nextPost && (
                    <Link href={`/${nextPost.slug}`} className="flex-1">
                      <Button variant="ghost" className="gap-2 w-full sm:w-auto justify-start sm:justify-end" data-testid="button-next-post">
                        <div className="text-left sm:text-right min-w-0 order-2 sm:order-1">
                          <div className="text-xs text-muted-foreground">Next</div>
                          <div className="font-medium truncate">{nextPost.title}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 order-1 sm:order-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        <section className="bg-primary text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Plumbing Services?</h2>
            <p className="text-xl mb-6 text-white/90">
              Contact Economy Plumbing for expert service in Austin and surrounding areas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <a
                  href={phoneConfig.tel}
                  className="text-2xl font-bold hover:underline"
                  data-testid="link-phone-austin"
                >
                  {phoneConfig.display}
                </a>
                <span className="text-white/80">Austin</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <a
                  href={marbleFallsPhoneConfig.tel}
                  className="text-2xl font-bold hover:underline"
                  data-testid="link-phone-marble"
                >
                  {marbleFallsPhoneConfig.display}
                </a>
                <span className="text-white/80">Marble Falls</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* Image Lightbox */}
      {post?.featuredImage && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-7xl w-full p-0 bg-black/95 border-0">
            <DialogTitle className="sr-only">Full size image: {post.title}</DialogTitle>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover-elevate active-elevate-2"
              data-testid="button-close-lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-[90vh] flex items-center justify-center p-8">
              <img
                src={originalPhoto?.photoUrl || post.featuredImage}
                alt={post.title}
                className="max-w-full max-h-full object-contain"
                data-testid="img-lightbox"
              />
              {originalPhoto?.photoUrl && (
                <p className="absolute bottom-2 right-2 text-white/60 text-xs">
                  Full resolution original
                </p>
              )}
              {!originalPhoto?.photoUrl && post.imageId && (
                <p className="absolute bottom-2 right-2 text-white/60 text-xs">
                  Original not available
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

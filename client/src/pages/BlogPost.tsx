import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import InlineReviewCard from "@/components/InlineReviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Phone, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { format } from "date-fns";
import { SEOHead } from "@/components/SEO/SEOHead";
import { createBlogPostSchema } from "@/components/SEO/JsonLd";
import type { BlogPost } from "@shared/schema";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

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

export default function BlogPost() {
  const [matchBlog, paramsBlog] = useRoute("/blog/:slug");
  const [matchFallTips] = useRoute("/fall-plumbing-tips");
  const slug = matchFallTips ? "fall-plumbing-tips" : (paramsBlog?.slug || "");
  const phoneConfig = usePhoneConfig();

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  const { data: allPostsData } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog"],
  });

  const canonicalUrl = matchFallTips 
    ? "https://www.plumbersthatcare.com/fall-plumbing-tips"
    : `https://www.plumbersthatcare.com/blog/${slug}`;

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

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${post.title} | Economy Plumbing Blog`}
        description={post.metaDescription || ""}
        canonical={canonicalUrl}
        ogType="article"
        ogImage={post.featuredImage ? 
          (post.featuredImage.startsWith('http') ? post.featuredImage : `https://www.plumbersthatcare.com${post.featuredImage}`) : 
          undefined}
        ogImageAlt={`Featured image for: ${post.title}`}
        schema={blogPostSchema ? [blogPostSchema] : undefined}
        articlePublishedTime={new Date(post.publishDate).toISOString()}
        articleAuthor={post.author}
      />

      <Header />

      <main className="flex-1">
        <article className="py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2" data-testid="nav-breadcrumbs">
              <Link href="/" className="hover:text-foreground flex items-center gap-1" data-testid="link-breadcrumb-home">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-foreground" data-testid="link-breadcrumb-blog">
                Blog
              </Link>
              <span>/</span>
              <span className="text-foreground" data-testid="text-breadcrumb-current">{post.title}</span>
            </nav>

            <div className="mb-6">
              <Badge className="mb-4" data-testid="badge-category">
                {post.category}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4" data-testid="text-title">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span data-testid="text-author">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-date">
                    {format(new Date(post.publishDate), "MMMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {post.featuredImage && (
              <img
                src={post.featuredImage}
                alt={post.title}
                width="1200"
                height="630"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-96 object-cover rounded-lg mb-8"
                data-testid="img-featured"
              />
            )}

            {/* Inline Review Card - positioned to float within content, pushed down further */}
            <div className="relative">
              {post.category && BLOG_CATEGORY_TO_REVIEW_CATEGORY[post.category] && (
                <div className="md:float-right md:ml-6 md:w-80 lg:w-96 mb-6 mt-32 md:mt-48">
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
                    <Link href={`/blog/${prevPost.slug}`} className="flex-1">
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
                    <Link href={`/blog/${nextPost.slug}`} className="flex-1">
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
                  href="tel:+18304603565"
                  className="text-2xl font-bold hover:underline"
                  data-testid="link-phone-marble"
                >
                  (830) 460-3565
                </a>
                <span className="text-white/80">Marble Falls</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

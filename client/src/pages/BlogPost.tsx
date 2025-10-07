import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Phone } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

export default function BlogPost() {
  const [matchBlog, paramsBlog] = useRoute("/blog/:slug");
  const [matchFallTips] = useRoute("/fall-plumbing-tips");
  const slug = matchFallTips ? "fall-plumbing-tips" : (paramsBlog?.slug || "");

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  const { data: allPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Economy Plumbing Blog`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && post.metaDescription) {
        metaDescription.setAttribute("content", post.metaDescription);
      }
    }
  }, [post]);

  const relatedPosts = allPosts
    ?.filter(
      (p) =>
        p.category === post?.category &&
        p.slug !== post?.slug
    )
    .slice(0, 3);

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

  return (
    <div className="min-h-screen flex flex-col">
      <title>{post.title} | Economy Plumbing Blog</title>
      {post.metaDescription && (
        <meta name="description" content={post.metaDescription} />
      )}

      <Header />

      <main className="flex-1">
        <article className="py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className="w-full h-96 object-cover rounded-lg mb-8"
                data-testid="img-featured"
              />
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
                  href="tel:5123689159"
                  className="text-2xl font-bold hover:underline"
                  data-testid="link-phone-austin"
                >
                  (512) 368-9159
                </a>
                <span className="text-white/80">Austin</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <a
                  href="tel:8304603565"
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

        {relatedPosts && relatedPosts.length > 0 && (
          <section className="py-12 lg:py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8" data-testid="text-related-heading">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

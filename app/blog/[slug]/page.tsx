import BlogPost from "@/pages/BlogPost";
import type { Metadata } from "next";

// Generate static params for all blog posts at build time
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_INTERNAL_URL || "http://localhost:5000";
    const res = await fetch(`${baseUrl}/api/blog?limit=1000`);
    
    if (!res.ok) {
      console.error("Failed to fetch blog posts for static generation");
      return [];
    }
    
    const data = await res.json();
    const posts = data.posts || [];
    
    return posts.map((post: any) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params for blog posts:", error);
    return [];
  }
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_INTERNAL_URL || "http://localhost:5000";
    const res = await fetch(`${baseUrl}/api/blog/${params.slug}`);
    
    if (!res.ok) {
      return {
        title: "Blog Post Not Found | Economy Plumbing",
        description: "The requested blog post could not be found.",
      };
    }
    
    const post = await res.json();
    
    return {
      title: post.title,
      description: post.metaDescription || post.excerpt || "",
      openGraph: {
        title: post.title,
        description: post.metaDescription || post.excerpt || "",
        type: "article",
        publishedTime: post.publishDate,
        authors: [post.author],
        images: post.featuredImage ? [
          {
            url: post.featuredImage.startsWith('http') 
              ? post.featuredImage 
              : `https://www.plumbersthatcare.com${post.featuredImage}`,
            alt: `Featured image for: ${post.title}`,
          }
        ] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata for blog post:", error);
    return {
      title: "Blog Post | Economy Plumbing",
      description: "Read our latest plumbing tips and advice.",
    };
  }
}

// ISR configuration: Revalidate every hour
export const revalidate = 3600;

export default function BlogPostPage() {
  return <BlogPost />;
}

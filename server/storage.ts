import { 
  type User, 
  type InsertUser,
  type BlogPost,
  type InsertBlogPost,
  type Product,
  type InsertProduct,
  type ContactSubmission,
  type InsertContactSubmission
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blog posts
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Contact submissions
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private blogPosts: Map<string, BlogPost>;
  private products: Map<string, Product>;
  private contactSubmissions: Map<string, ContactSubmission>;

  constructor() {
    this.users = new Map();
    this.blogPosts = new Map();
    this.products = new Map();
    this.contactSubmissions = new Map();
    
    // Seed with some blog posts
    this.seedBlogPosts();
    this.seedProducts();
  }

  private seedBlogPosts() {
    const posts: BlogPost[] = [
      {
        id: randomUUID(),
        title: "Signs Your Water Heater Needs Replacement",
        slug: "signs-water-heater-needs-replacement",
        content: "If your water heater is showing signs of age, it might be time for a replacement. Here are the key indicators to watch for...",
        excerpt: "Learn the warning signs that indicate your water heater may need replacement.",
        author: "Economy Plumbing",
        publishDate: new Date("2024-01-15"),
        category: "Water Heaters",
        featuredImage: null,
        metaDescription: "Expert guide on recognizing when your water heater needs replacement. Economy Plumbing Austin.",
        published: true
      },
      {
        id: randomUUID(),
        title: "Tankless vs Traditional Water Heaters: Which is Right for You?",
        slug: "tankless-vs-traditional-water-heaters",
        content: "Choosing between tankless and traditional water heaters depends on several factors...",
        excerpt: "Compare tankless and traditional water heaters to make the best choice for your home.",
        author: "Economy Plumbing",
        publishDate: new Date("2024-02-01"),
        category: "Water Heaters",
        featuredImage: null,
        metaDescription: "Compare tankless vs traditional water heaters. Expert advice from Economy Plumbing.",
        published: true
      }
    ];

    posts.forEach(post => this.blogPosts.set(post.id, post));
  }

  private seedProducts() {
    const products: Product[] = [
      {
        id: randomUUID(),
        name: "Basic Plumbing Membership",
        slug: "basic-plumbing-membership",
        description: "Annual plumbing maintenance and priority service",
        price: 29900, // $299/year
        category: "membership",
        image: null,
        stripeProductId: null,
        stripePriceId: null,
        features: ["Annual drain inspection", "Priority scheduling", "10% off repairs", "Free estimates"],
        active: true
      },
      {
        id: randomUUID(),
        name: "Premium Plumbing Membership",
        slug: "premium-plumbing-membership",
        description: "Complete plumbing care with water heater maintenance",
        price: 49900, // $499/year
        category: "membership",
        image: null,
        stripeProductId: null,
        stripePriceId: null,
        features: ["Everything in Basic", "Water heater flush & inspection", "15% off repairs", "Emergency priority"],
        active: true
      }
    ];

    products.forEach(product => this.products.set(product.id, product));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.published)
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const post: BlogPost = {
      id,
      title: insertPost.title,
      slug: insertPost.slug,
      content: insertPost.content,
      excerpt: insertPost.excerpt ?? null,
      author: insertPost.author ?? "Economy Plumbing",
      publishDate: new Date(),
      category: insertPost.category,
      featuredImage: insertPost.featuredImage ?? null,
      metaDescription: insertPost.metaDescription ?? null,
      published: insertPost.published ?? true
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.active);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.slug === slug);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      id,
      name: insertProduct.name,
      slug: insertProduct.slug,
      description: insertProduct.description,
      price: insertProduct.price,
      category: insertProduct.category,
      image: insertProduct.image ?? null,
      stripeProductId: insertProduct.stripeProductId ?? null,
      stripePriceId: insertProduct.stripePriceId ?? null,
      features: insertProduct.features ?? null,
      active: insertProduct.active ?? true
    };
    this.products.set(id, product);
    return product;
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = {
      id,
      name: insertSubmission.name,
      phone: insertSubmission.phone,
      email: insertSubmission.email ?? null,
      service: insertSubmission.service ?? null,
      location: insertSubmission.location ?? null,
      urgency: insertSubmission.urgency ?? null,
      message: insertSubmission.message ?? null,
      submittedAt: new Date()
    };
    this.contactSubmissions.set(id, submission);
    return submission;
  }
}

export const storage = new MemStorage();

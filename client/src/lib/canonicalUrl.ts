/**
 * Generate canonical URL from current path
 * Ensures all pages have proper canonical URLs for SEO
 */
export function generateCanonicalUrl(path: string): string {
  const productionUrl = "https://www.plumbersthatcare.com";
  
  // Remove trailing slashes (except root)
  const normalizedPath = path === "/" ? path : path.replace(/\/$/, "");
  
  // Remove query parameters and hash fragments
  const cleanPath = normalizedPath.split("?")[0].split("#")[0];
  
  // Ensure path starts with /
  const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  return `${productionUrl}${finalPath}`;
}

/**
 * Get current canonical URL from window location or path
 */
export function getCurrentCanonicalUrl(): string {
  if (typeof window === "undefined") {
    return "https://www.plumbersthatcare.com";
  }
  
  return generateCanonicalUrl(window.location.pathname);
}

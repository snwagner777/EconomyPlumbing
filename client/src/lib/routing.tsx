"use client";

/**
 * Routing compatibility layer for Next.js
 * Provides wouter-compatible API using Next.js routing under the hood
 */

import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Link component - compatible with both wouter and Next.js
 * wouter: <Link href="/path">text</Link>
 * Next.js: <Link href="/path">text</Link>
 * Both have the same API!
 */
export const Link = NextLink;

/**
 * useLocation hook - wouter-compatible wrapper around Next.js usePathname
 * wouter: const [location, setLocation] = useLocation()
 * This adapter: const [location, setLocation] = useLocation()
 */
export function useLocation(): [string, (path: string) => void] {
  const pathname = useNextPathname();
  const router = useRouter();
  
  const setLocation = (path: string) => {
    router.push(path);
  };
  
  return [pathname, setLocation];
}

/**
 * Re-export usePathname for components that use Next.js API directly
 */
export { usePathname } from "next/navigation";

/**
 * useRoute hook - wouter-compatible route matching for Next.js
 * wouter: const [match, params] = useRoute("/:slug");
 * This adapter: const [match, params] = useRoute("/:slug");
 */
export function useRoute(pattern: string): [boolean, Record<string, string> | null] {
  const pathname = useNextPathname();
  
  // Convert wouter pattern to regex
  // Example: "/:slug" -> /^\/([^/]+)$/
  const regexPattern = pattern
    .replace(/:[^/]+/g, '([^/]+)') // Replace :param with capture group
    .replace(/\//g, '\\/'); // Escape slashes
  
  const regex = new RegExp(`^${regexPattern}$`);
  const match = pathname.match(regex);
  
  if (!match) {
    return [false, null];
  }
  
  // Extract parameter names from pattern
  const paramNames = (pattern.match(/:[^/]+/g) || []).map(p => p.slice(1));
  
  // Build params object
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  
  return [true, params];
}

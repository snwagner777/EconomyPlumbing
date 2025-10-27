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

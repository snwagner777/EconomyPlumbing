import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getToken, SessionContext } from "@/modules/session/sessionClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Unauthenticated API request
 * Use for public endpoints that don't require session tokens
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Authenticated API request with session token
 * Use for protected endpoints that require scheduler/portal/chatbot session
 * 
 * @param method - HTTP method
 * @param url - API endpoint
 * @param context - Session context (scheduler, chatbot, or portal)
 * @param data - Request body
 */
export async function authenticatedApiRequest(
  method: string,
  url: string,
  context: SessionContext,
  data?: unknown | undefined,
): Promise<Response> {
  const token = getToken(context);
  
  if (!token) {
    throw new Error(`No ${context} session found. Please authenticate first.`);
  }
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

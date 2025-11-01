import { getSession as getAdminSession } from '@/lib/auth';

export async function requireAdmin() {
  const session = await getAdminSession();
  
  // Check if authenticated with simple username/password auth
  if (!session?.isAuthenticated) {
    return { authorized: false, error: "Unauthorized - Admin login required" };
  }
  
  return { authorized: true, session };
}

import { getSession } from '@/lib/session';
import { storage } from '@/server/storage';

export async function requireAdmin() {
  const session = await getSession();
  
  // Check session admin flag (matches Express requireAdmin middleware)
  if (!session.isAdmin) {
    return { authorized: false, error: "Unauthorized - OAuth login required" };
  }
  
  // Verify user exists in session
  if (!session.user || !session.user.id) {
    return { authorized: false, error: "Unauthorized - OAuth authentication required" };
  }
  
  // Verify email is still whitelisted
  const userEmail = session.user.email;
  if (!userEmail) {
    return { authorized: false, error: "Unauthorized - No email in session" };
  }
  
  const isWhitelisted = await storage.isEmailWhitelisted(userEmail);
  if (!isWhitelisted) {
    return { authorized: false, error: "Unauthorized - Email not whitelisted" };
  }
  
  return { authorized: true, session };
}

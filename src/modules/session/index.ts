/**
 * Session Module
 * 
 * Shared session management for scheduler, AI chatbot, and customer portal
 */

export {
  getToken,
  getSession,
  setSession,
  clearToken,
  isSessionValid,
  updateCustomerId,
  type SessionContext,
  type SessionData,
} from './sessionClient';

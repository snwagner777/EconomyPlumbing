/**
 * In-memory OTP (One-Time Password) storage with automatic expiration
 * 
 * Stores OTP codes temporarily (5 minutes) for SMS authentication.
 * Automatically cleans up expired codes to prevent memory leaks.
 */

interface OTPEntry {
  code: string;
  phoneNumber: string;
  expiresAt: number;
  attempts: number;
}

class OTPStore {
  private store: Map<string, OTPEntry> = new Map();
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_MS = 60 * 1000; // 1 minute between sends

  constructor() {
    // Clean up expired OTPs every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Normalize phone number to digits only
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Create and store a new OTP code for a phone number
   * Returns the code if successful, or null if rate limited
   */
  createOTP(phoneNumber: string): string | null {
    const normalized = this.normalizePhone(phoneNumber);
    
    // Check rate limiting
    const existing = this.store.get(normalized);
    if (existing && Date.now() - (existing.expiresAt - this.OTP_EXPIRY_MS) < this.RATE_LIMIT_MS) {
      console.log(`[OTP] Rate limited for ${normalized}`);
      return null; // Rate limited
    }

    const code = this.generateCode();
    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

    this.store.set(normalized, {
      code,
      phoneNumber: normalized,
      expiresAt,
      attempts: 0
    });

    console.log(`[OTP] Created code for ${normalized} (expires in 5 min)`);
    return code;
  }

  /**
   * Verify an OTP code for a phone number
   * Returns true if valid, false otherwise
   */
  verifyOTP(phoneNumber: string, code: string): boolean {
    const normalized = this.normalizePhone(phoneNumber);
    const entry = this.store.get(normalized);

    if (!entry) {
      console.log(`[OTP] No code found for ${normalized}`);
      return false;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      console.log(`[OTP] Expired code for ${normalized}`);
      this.store.delete(normalized);
      return false;
    }

    // Check attempts
    if (entry.attempts >= this.MAX_ATTEMPTS) {
      console.log(`[OTP] Max attempts exceeded for ${normalized}`);
      this.store.delete(normalized);
      return false;
    }

    // Increment attempts
    entry.attempts++;

    // Verify code
    if (entry.code === code) {
      console.log(`[OTP] ✅ Valid code for ${normalized}`);
      this.store.delete(normalized); // Remove after successful verification
      return true;
    }

    console.log(`[OTP] ❌ Invalid code for ${normalized} (${entry.attempts}/${this.MAX_ATTEMPTS} attempts)`);
    return false;
  }

  /**
   * Clean up expired OTP entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.store.entries());
    for (const [phone, entry] of entries) {
      if (now > entry.expiresAt) {
        this.store.delete(phone);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[OTP] Cleaned up ${cleaned} expired codes`);
    }
  }

  /**
   * Get store size (for monitoring)
   */
  getSize(): number {
    return this.store.size;
  }
}

// Singleton instance
let otpStore: OTPStore | null = null;

export function getOTPStore(): OTPStore {
  if (!otpStore) {
    otpStore = new OTPStore();
  }
  return otpStore;
}

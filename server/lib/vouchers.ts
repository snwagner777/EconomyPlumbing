import QRCode from 'qrcode';
import { db } from '../db';
import { vouchers, referrals } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { getResendClient } from './resendClient';

/**
 * Generate a unique voucher code
 * Format: REF-XXXXXXXX (8 random alphanumeric characters)
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (I, O, 0, 1, L)
  let code = 'REF-';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Generate QR code as base64 data URL
 * The QR code contains a URL that opens when scanned with a phone camera
 */
async function generateQRCode(code: string): Promise<string> {
  try {
    // Generate URL that techs will be redirected to when scanning with camera
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.plumbersthatcare.com';
    const scanUrl = `${baseUrl}/customer-portal/scan?code=${encodeURIComponent(code)}`;
    
    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Create a new voucher with QR code
 */
export async function createVoucher(params: {
  voucherType: 'referral_new_customer' | 'referral_reward' | 'promotional';
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: number;
  referralId?: string;
  referrerCustomerId?: number;
  discountAmount?: number; // in cents, defaults to $25
  minimumJobAmount?: number; // in cents, defaults to $200
}): Promise<{ id: string; code: string; qrCode: string; expiresAt: Date }> {
  // Generate unique code
  let code = generateVoucherCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure code is unique
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.code, code))
      .limit(1);
    
    if (existing.length === 0) break;
    
    code = generateVoucherCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique voucher code');
  }
  
  // Generate QR code
  const qrCode = await generateQRCode(code);
  
  // Calculate expiration (6 months from now)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);
  
  // Create voucher
  const [voucher] = await db
    .insert(vouchers)
    .values({
      code,
      qrCode,
      voucherType: params.voucherType,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerId: params.customerId,
      referralId: params.referralId,
      referrerCustomerId: params.referrerCustomerId,
      discountAmount: params.discountAmount ?? 2500, // Default $25
      minimumJobAmount: params.minimumJobAmount ?? 20000, // Default $200
      expiresAt,
      status: 'active',
    })
    .returning();
  
  return {
    id: voucher.id,
    code: voucher.code,
    qrCode: voucher.qrCode,
    expiresAt: voucher.expiresAt,
  };
}

/**
 * Create vouchers for a new referral:
 * 1. Voucher for the referee (new customer) - immediate
 * 2. Placeholder for referrer reward - created when referee voucher is redeemed
 */
export async function createReferralVouchers(params: {
  referralId: string;
  refereeName: string;
  refereeEmail?: string;
  refereePhone?: string;
  refereeCustomerId?: number; // Link to existing customer if found
  referrerCustomerId: number;
  referrerName: string;
}): Promise<{ refereeVoucher: { id: string; code: string; qrCode: string; expiresAt: Date } }> {
  // Create immediate voucher for referee
  const refereeVoucher = await createVoucher({
    voucherType: 'referral_new_customer',
    customerName: params.refereeName,
    customerEmail: params.refereeEmail,
    customerPhone: params.refereePhone,
    customerId: params.refereeCustomerId, // Link to customer if they exist
    referralId: params.referralId,
    referrerCustomerId: params.referrerCustomerId,
  });
  
  return { refereeVoucher };
}

/**
 * Redeem a voucher and notify customer via email
 */
export async function redeemVoucher(params: {
  code: string;
  jobAmount: number; // in cents
  technicianName?: string;
  jobNumber?: string;
}): Promise<{
  success: boolean;
  message: string;
  discountAmount?: number;
  referrerRewardVoucher?: { id: string; code: string; qrCode: string };
}> {
  // Find voucher
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.code, params.code))
    .limit(1);
  
  if (!voucher) {
    return { success: false, message: 'Voucher not found' };
  }
  
  // Check if already redeemed
  if (voucher.status === 'redeemed') {
    return { success: false, message: 'Voucher already redeemed' };
  }
  
  // Check if expired
  if (voucher.status === 'expired' || new Date() > voucher.expiresAt) {
    return { success: false, message: 'Voucher has expired' };
  }
  
  // Check minimum job amount
  if (params.jobAmount < voucher.minimumJobAmount) {
    const minAmount = (voucher.minimumJobAmount / 100).toFixed(2);
    return { 
      success: false, 
      message: `Job amount must be at least $${minAmount} to use this voucher` 
    };
  }
  
  // Redeem voucher
  await db
    .update(vouchers)
    .set({
      status: 'redeemed',
      redeemedAt: new Date(),
      redeemedBy: params.technicianName,
      redeemedJobNumber: params.jobNumber,
      redeemedJobAmount: params.jobAmount,
      updatedAt: new Date(),
    })
    .where(eq(vouchers.id, voucher.id));
  
  // Send email notification to customer
  if (voucher.customerEmail) {
    try {
      const { client, fromEmail } = await getResendClient();
      
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #10b981; margin-top: 0;">🎉 Voucher Redeemed Successfully!</h2>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Hi ${voucher.customerName},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Great news! Your Economy Plumbing Services voucher has been redeemed.
              </p>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Voucher Code:</strong> ${voucher.code}</p>
                <p style="margin: 8px 0;"><strong>Discount Applied:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">$${(voucher.discountAmount / 100).toFixed(2)}</span></p>
                ${params.jobNumber ? `<p style="margin: 8px 0;"><strong>Job Number:</strong> #${params.jobNumber}</p>` : ''}
                <p style="margin: 8px 0;"><strong>Redeemed On:</strong> ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Important:</strong> This voucher has no cash value and cannot be exchanged for cash. Thank you for choosing Economy Plumbing Services!
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
                Thank you for your business!
              </p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Economy Plumbing Services<br/>
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
      `;
      
      await client.emails.send({
        from: fromEmail,
        to: voucher.customerEmail,
        subject: '✓ Voucher Redeemed - Economy Plumbing Services',
        html: emailHtml,
      });
      
      console.log(`[Voucher] Redemption email sent to ${voucher.customerEmail}`);
    } catch (emailError) {
      console.error('[Voucher] Failed to send redemption email:', emailError);
      // Don't fail the redemption if email fails
    }
  }
  
  // If this is a referral voucher, create reward voucher for the referrer
  let referrerRewardVoucher;
  if (voucher.voucherType === 'referral_new_customer' && voucher.referrerCustomerId) {
    // Get referrer info from the referral
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, voucher.referralId!))
      .limit(1);
    
    if (referral) {
      // Create reward voucher for referrer
      const reward = await createVoucher({
        voucherType: 'referral_reward',
        customerName: referral.referrerName,
        customerEmail: referral.referrerEmail ?? undefined,
        customerPhone: referral.referrerPhone,
        customerId: voucher.referrerCustomerId,
        referralId: voucher.referralId ?? undefined,
        discountAmount: 2500, // $25 reward
        minimumJobAmount: 20000, // $200 minimum
      });
      
      referrerRewardVoucher = reward;
      
      // Update referral status
      await db
        .update(referrals)
        .set({
          status: 'credited',
          creditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, voucher.referralId!));
      
      // Send reward email to referrer
      if (referral.referrerEmail) {
        try {
          const { sendReferrerRewardEmail } = await import('./resendClient');
          await sendReferrerRewardEmail({
            referrerName: referral.referrerName,
            referrerEmail: referral.referrerEmail,
            refereeName: referral.refereeName,
            voucherCode: reward.code,
            voucherQRCode: reward.qrCode,
            discountAmount: 2500, // $25
            expiresAt: reward.expiresAt,
          });
          console.log('[Voucher] Referrer reward email sent successfully');
        } catch (emailError) {
          console.error('[Voucher] Failed to send referrer reward email:', emailError);
          // Don't fail the redemption if email fails
        }
      }
    }
  }
  
  return {
    success: true,
    message: 'Voucher redeemed successfully',
    discountAmount: voucher.discountAmount,
    referrerRewardVoucher,
  };
}

/**
 * Get all vouchers for a customer
 */
export async function getCustomerVouchers(customerId: number) {
  const customerVouchers = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.customerId, customerId))
    .orderBy(vouchers.createdAt);
  
  // Mark expired vouchers
  const now = new Date();
  for (const voucher of customerVouchers) {
    if (voucher.status === 'active' && voucher.expiresAt < now) {
      await db
        .update(vouchers)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(vouchers.id, voucher.id));
      
      voucher.status = 'expired';
    }
  }
  
  return customerVouchers;
}

/**
 * Get voucher totals for a customer
 */
export async function getCustomerVoucherTotals(customerId: number) {
  const customerVouchers = await getCustomerVouchers(customerId);
  
  const active = customerVouchers.filter(v => v.status === 'active');
  const totalValue = active.reduce((sum, v) => sum + v.discountAmount, 0);
  
  return {
    activeCount: active.length,
    totalValue, // in cents
    totalValueFormatted: `$${(totalValue / 100).toFixed(2)}`,
    vouchers: customerVouchers,
  };
}

interface ReferralEmailParams {
  referrerName: string;
  refereeName: string;
  referralUrl: string;
}

export function getReferralEmailTemplate({
  referrerName,
  refereeName,
  referralUrl,
}: ReferralEmailParams): { subject: string; html: string; text: string } {
  const subject = `${referrerName} thinks you could use Economy Plumbing - Get $25 Off!`;
  
  const text = `Hi ${refereeName},

Good news! ${referrerName} recommended Economy Plumbing for your plumbing needs.

As a special thank you, we're offering you $25 off your first service of $200 or more.

Here's what our customers love about us:
✓ Licensed & insured plumbers
✓ Serving Austin & Marble Falls
✓ 24/7 emergency service available
✓ Upfront pricing, no hidden fees

Ready to get started?
Click here: ${referralUrl}

Or call us at (512) 355-0584

Questions? Just reply to this email.

Thanks,
Economy Plumbing Team

---
This is a one-time courtesy email based on a referral from ${referrerName}.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                You've Been Referred!
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                ${referrerName} recommends Economy Plumbing
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi ${refereeName},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Good news! <strong>${referrerName}</strong> recommended Economy Plumbing for your plumbing needs.
              </p>

              <!-- Discount Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 20px 40px; border-radius: 8px; font-size: 24px; font-weight: bold;">
                      Get $25 Off Your First Service!
                    </div>
                    <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                      On services of $200 or more
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6; font-weight: 600;">
                Here's what our customers love about us:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 15px;">
                    ✓ Licensed & insured plumbers
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 15px;">
                    ✓ Serving Austin & Marble Falls since 1976
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 15px;">
                    ✓ 24/7 emergency service available
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 15px;">
                    ✓ Upfront pricing, no hidden fees
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${referralUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                      Claim Your $25 Discount
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">
                Or call us at <a href="tel:+15123550584" style="color: #1e40af; text-decoration: none; font-weight: 600;">(512) 355-0584</a>
              </p>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Thanks,<br>
                <strong>Economy Plumbing Team</strong>
              </p>
              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                This is a one-time courtesy email based on a referral from ${referrerName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

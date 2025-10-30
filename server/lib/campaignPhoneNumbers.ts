import { db } from '@/server/db';
import { storage } from '@/server/storage';
import { systemSettings } from '@shared/schema';

export async function upsertCampaignPhoneNumber(
  campaignKey: string,
  campaignName: string,
  phoneNumber: string,
  utmConfig: { utm_source: string; utm_medium: string; utm_campaign: string; description: string },
  sortOrder: number
) {
  // Format and validate phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    throw new Error("Phone number must be 10 digits");
  }

  const formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  const telLink = `tel:+1${cleaned}`;

  // Check if tracking number already exists
  const existingNumbers = await storage.getAllTrackingNumbers();
  const existingNumber = existingNumbers.find(n => n.channelKey === `${campaignKey}_email`);

  if (existingNumber) {
    // Update existing tracking number
    await storage.updateTrackingNumber(existingNumber.id, {
      displayNumber: formatted,
      rawNumber: cleaned,
      telLink: telLink
    });
  } else {
    // Create new tracking number with UTM parameters
    await storage.createTrackingNumber({
      channelKey: `${campaignKey}_email`,
      channelName: campaignName,
      displayNumber: formatted,
      rawNumber: cleaned,
      telLink: telLink,
      detectionRules: JSON.stringify(utmConfig),
      isActive: true,
      isDefault: false,
      sortOrder
    });
  }

  // Save phone number to system settings
  await db
    .insert(systemSettings)
    .values({
      key: `${campaignKey}_phone_number`,
      value: cleaned,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: cleaned,
        updatedAt: new Date()
      }
    });

  await db
    .insert(systemSettings)
    .values({
      key: `${campaignKey}_phone_formatted`,
      value: formatted,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: formatted,
        updatedAt: new Date()
      }
    });

  // Invalidate SSR cache
  if (global.invalidateSSRCache) global.invalidateSSRCache();

  return { cleaned, formatted };
}

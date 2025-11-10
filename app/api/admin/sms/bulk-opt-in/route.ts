/**
 * Bulk SMS Opt-In Migration
 * 
 * POST: Migrate all active ServiceTitan customers to SMS opt-in
 * 
 * TCPA Compliance Strategy:
 * - Uses "existing customer relationship" justification
 * - Sets opt-in method and source for audit trail
 * - First message sent will include STOP instructions
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { db } from '@/server/db';
import { customersXlsx, smsContacts } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Bulk Opt-In] Starting bulk SMS opt-in migration...');

    // Sync all active ServiceTitan customers to sms_contacts
    // Uses PostgreSQL INSERT...ON CONFLICT for upsert behavior
    const result = await db.execute(sql`
      INSERT INTO sms_contacts (
        phone,
        phone_formatted,
        first_name,
        email,
        customer_id,
        opted_in,
        opt_in_method,
        opt_in_source,
        opt_in_timestamp,
        provider,
        created_at,
        updated_at
      )
      SELECT DISTINCT
        mobile_phone,
        mobile_phone_formatted,
        name,
        email,
        customer_id,
        true,
        'existing_customer_relationship',
        'servicetitan_bulk_enrollment',
        NOW(),
        'simpletexting',
        NOW(),
        NOW()
      FROM customers_xlsx
      WHERE mobile_phone IS NOT NULL
        AND mobile_phone != ''
        AND active = true
      ON CONFLICT (phone) 
      DO UPDATE SET
        opted_in = CASE 
          WHEN sms_contacts.opted_out = true THEN sms_contacts.opted_in
          ELSE EXCLUDED.opted_in
        END,
        opt_in_method = CASE
          WHEN sms_contacts.opted_out = true THEN sms_contacts.opt_in_method
          ELSE EXCLUDED.opt_in_method
        END,
        opt_in_timestamp = CASE
          WHEN sms_contacts.opted_out = true THEN sms_contacts.opt_in_timestamp
          ELSE EXCLUDED.opt_in_timestamp
        END,
        customer_id = EXCLUDED.customer_id,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        phone_formatted = EXCLUDED.phone_formatted,
        updated_at = NOW()
    `);

    // Count results
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE opted_in = true AND opted_out = false) as opted_in_count,
        COUNT(*) FILTER (WHERE opted_out = true) as opted_out_count,
        COUNT(*) as total_contacts
      FROM sms_contacts
    `);

    const stats = statsResult.rows[0] as any;
    console.log('[Bulk Opt-In] Migration complete:', stats);

    return NextResponse.json({
      success: true,
      message: 'Bulk opt-in migration completed successfully',
      stats: {
        totalContacts: parseInt(stats?.total_contacts || '0'),
        optedIn: parseInt(stats?.opted_in_count || '0'),
        optedOut: parseInt(stats?.opted_out_count || '0'),
      },
      note: 'Existing opted-out contacts were NOT re-enrolled (TCPA compliance)',
    });
  } catch (error) {
    console.error('[Bulk Opt-In] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute bulk opt-in migration' },
      { status: 500 }
    );
  }
}

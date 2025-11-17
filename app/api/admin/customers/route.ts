/**
 * Admin API - Customer Management
 * 
 * Get all customers from ServiceTitan XLSX imports
 * Protected route - requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { customersXlsx } from '@shared/schema';
import { desc, sql, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type'); // 'Residential' or 'Commercial'
    const active = searchParams.get('active'); // 'true' or 'false'
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build base query
    const baseQuery = db.select().from(customersXlsx);

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        sql`(${customersXlsx.name} ILIKE ${`%${search}%`} OR 
             ${customersXlsx.email} ILIKE ${`%${search}%`} OR 
             ${customersXlsx.phone} ILIKE ${`%${search}%`})`
      );
    }
    
    if (type) {
      conditions.push(eq(customersXlsx.type, type));
    }
    
    if (active !== null) {
      conditions.push(eq(customersXlsx.active, active === 'true'));
    }

    // Execute query with filters and pagination
    const customers = await (conditions.length > 0
      ? baseQuery.where(sql`${sql.join(conditions, sql` AND `)}`)
      : baseQuery)
      .orderBy(desc(customersXlsx.lastSyncedAt))
      .limit(limit)
      .offset(offset);

    // Get total count WITH SAME FILTERS
    const baseCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customersXlsx);
    
    const [{ count }] = await (conditions.length > 0
      ? baseCountQuery.where(sql`${sql.join(conditions, sql` AND `)}`)
      : baseCountQuery);

    return NextResponse.json({
      customers,
      total: Number(count),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Admin Customers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

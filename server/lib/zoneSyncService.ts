/**
 * Zone Sync Service - Daily sync from ServiceTitan Dispatch API
 * 
 * Strategy: ServiceTitan is source of truth
 * - Adds new zones
 * - Updates existing zones (name, ZIPs, cities)
 * - Deactivates zones removed from ServiceTitan (soft delete)
 * - Detailed logging for change tracking
 */

import { db } from '../db';
import { serviceTitanZones } from '@shared/schema';
import { serviceTitanDispatch, ServiceTitanZone } from './servicetitan/dispatch';
import { eq, sql } from 'drizzle-orm';

interface SyncResult {
  success: boolean;
  zonesAdded: number;
  zonesUpdated: number;
  zonesDeactivated: number;
  zipsAdded: number;
  zipsRemoved: number;
  errors: string[];
}

export async function syncZonesFromServiceTitan(): Promise<SyncResult> {
  console.log('\n🔄 [Zone Sync] Starting daily zone sync from ServiceTitan...');
  
  const result: SyncResult = {
    success: false,
    zonesAdded: 0,
    zonesUpdated: 0,
    zonesDeactivated: 0,
    zipsAdded: 0,
    zipsRemoved: 0,
    errors: [],
  };

  try {
    // Fetch zones from ServiceTitan
    const stZones = await serviceTitanDispatch.getZones();
    console.log(`[Zone Sync] Fetched ${stZones.length} zones from ServiceTitan`);

    // Fetch current zones from database
    const dbZones = await db.query.serviceTitanZones.findMany();
    console.log(`[Zone Sync] Current database has ${dbZones.length} zones`);

    // Build map of ServiceTitan zone IDs to zones
    const stZoneMap = new Map(stZones.map(z => [z.id, z]));
    const dbZoneMap = new Map(
      dbZones
        .filter(z => z.serviceTitanId !== null)
        .map(z => [z.serviceTitanId!, z])
    );

    // Process each ServiceTitan zone
    for (const stZone of stZones) {
      const dbZone = dbZoneMap.get(stZone.id);

      if (!dbZone) {
        // NEW ZONE: Add to database
        await db.insert(serviceTitanZones).values({
          serviceTitanId: stZone.id,
          name: stZone.name,
          zipCodes: stZone.zips,
          cities: stZone.cities.length > 0 ? stZone.cities : null,
          sortOrder: extractSortOrder(stZone.name),
          active: stZone.active,
        });

        console.log(`[Zone Sync] ✅ ADDED: "${stZone.name}" (${stZone.zips.length} ZIPs)`);
        result.zonesAdded++;
        result.zipsAdded += stZone.zips.length;
      } else {
        // EXISTING ZONE: Check for changes
        const nameChanged = dbZone.name !== stZone.name;
        const zipsChanged = !arraysEqual(dbZone.zipCodes || [], stZone.zips);
        const citiesChanged = !arraysEqual(dbZone.cities || [], stZone.cities);
        const activeChanged = dbZone.active !== stZone.active;

        if (nameChanged || zipsChanged || citiesChanged || activeChanged) {
          // Calculate ZIP changes
          const oldZips = new Set(dbZone.zipCodes || []);
          const newZips = new Set(stZone.zips);
          const addedZips = stZone.zips.filter(z => !oldZips.has(z));
          const removedZips = (dbZone.zipCodes || []).filter(z => !newZips.has(z));

          // Update zone
          await db
            .update(serviceTitanZones)
            .set({
              name: stZone.name,
              zipCodes: stZone.zips,
              cities: stZone.cities.length > 0 ? stZone.cities : null,
              sortOrder: extractSortOrder(stZone.name),
              active: stZone.active,
              updatedAt: new Date(),
            })
            .where(eq(serviceTitanZones.id, dbZone.id));

          console.log(`[Zone Sync] 🔄 UPDATED: "${stZone.name}"`);
          if (nameChanged) console.log(`   - Name: "${dbZone.name}" → "${stZone.name}"`);
          if (addedZips.length > 0) console.log(`   - Added ZIPs: ${addedZips.join(', ')}`);
          if (removedZips.length > 0) console.log(`   - Removed ZIPs: ${removedZips.join(', ')}`);
          if (activeChanged) console.log(`   - Active: ${dbZone.active} → ${stZone.active}`);

          result.zonesUpdated++;
          result.zipsAdded += addedZips.length;
          result.zipsRemoved += removedZips.length;
        }
      }
    }

    // DEACTIVATE zones that no longer exist in ServiceTitan
    const stZoneIds = new Set(stZones.map(z => z.id));
    for (const dbZone of dbZones) {
      if (dbZone.serviceTitanId && !stZoneIds.has(dbZone.serviceTitanId) && dbZone.active) {
        await db
          .update(serviceTitanZones)
          .set({
            active: false,
            updatedAt: new Date(),
          })
          .where(eq(serviceTitanZones.id, dbZone.id));

        console.log(`[Zone Sync] ⚠️  DEACTIVATED: "${dbZone.name}" (removed from ServiceTitan)`);
        result.zonesDeactivated++;
      }
    }

    result.success = true;
    console.log('\n[Zone Sync] ✅ Sync completed successfully');
    console.log(`   - Zones added: ${result.zonesAdded}`);
    console.log(`   - Zones updated: ${result.zonesUpdated}`);
    console.log(`   - Zones deactivated: ${result.zonesDeactivated}`);
    console.log(`   - ZIPs added: ${result.zipsAdded}`);
    console.log(`   - ZIPs removed: ${result.zipsRemoved}\n`);

    return result;

  } catch (error: any) {
    console.error('[Zone Sync] ❌ Sync failed:', error);
    result.errors.push(error.message || 'Unknown error');
    return result;
  }
}

/**
 * Extract sort order from zone name
 * Example: "2 - North Austin" → 2, "Hill Country" → 999
 */
function extractSortOrder(zoneName: string): number {
  const match = zoneName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999; // Unnumbered zones go last
}

/**
 * Compare two arrays for equality (order-independent)
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

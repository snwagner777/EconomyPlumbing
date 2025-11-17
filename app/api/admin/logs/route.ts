/**
 * Admin Logs API
 * 
 * Fetches system logs from /tmp/logs directory
 * Supports filtering by workflow name and log level
 * PROTECTED: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdmin } from '@/server/lib/nextAuth';

export const dynamic = 'force-dynamic';

interface LogFile {
  name: string;
  workflow: string;
  timestamp: string;
  size: number;
  path: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const workflow = searchParams.get('workflow');
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const logsDir = '/tmp/logs';
    
    let files: string[] = [];
    try {
      files = await fs.readdir(logsDir);
    } catch (error) {
      return NextResponse.json({
        error: 'Logs directory not found',
        files: [],
      });
    }

    const logFiles: LogFile[] = [];

    for (const file of files) {
      if (!file.endsWith('.log')) continue;

      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);

      const parts = file.replace('.log', '').split('_');
      const workflowName = parts.slice(0, -2).join('_');
      const timestamp = `${parts[parts.length - 2]}_${parts[parts.length - 1]}`;

      if (workflow && workflowName !== workflow) continue;

      logFiles.push({
        name: file,
        workflow: workflowName,
        timestamp,
        size: stats.size,
        path: filePath,
      });
    }

    logFiles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json({
      files: logFiles,
      workflows: [...new Set(logFiles.map(f => f.workflow))],
    });

  } catch (error: any) {
    console.error('[Admin Logs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}

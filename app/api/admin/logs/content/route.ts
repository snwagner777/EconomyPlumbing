/**
 * Admin Log Content API
 * 
 * Fetches content of a specific log file
 * Supports filtering by log level and search term
 * PROTECTED: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdmin } from '@/server/lib/nextAuth';

export const dynamic = 'force-dynamic';

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
    const filePath = searchParams.get('file');
    const searchTerm = searchParams.get('search')?.toLowerCase();
    const level = searchParams.get('level')?.toLowerCase();
    const maxLines = parseInt(searchParams.get('maxLines') || '1000');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path required' },
        { status: 400 }
      );
    }

    const logsDir = '/tmp/logs';
    const resolvedLogsDir = path.resolve(logsDir);
    const resolvedFilePath = path.resolve(filePath);

    if (!resolvedFilePath.startsWith(resolvedLogsDir) || !filePath.endsWith('.log')) {
      return NextResponse.json(
        { error: 'Invalid file path - must be within logs directory' },
        { status: 400 }
      );
    }

    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return NextResponse.json(
        { error: 'Log file not found' },
        { status: 404 }
      );
    }

    let lines = content.split('\n');

    if (level) {
      const levelPatterns = {
        error: /\[ERROR\]|ERROR:|error:/i,
        warn: /\[WARN\]|WARN:|warning:/i,
        info: /\[INFO\]|INFO:/i,
        debug: /\[DEBUG\]|DEBUG:/i,
      };
      
      const pattern = levelPatterns[level as keyof typeof levelPatterns];
      if (pattern) {
        lines = lines.filter(line => pattern.test(line));
      }
    }

    if (searchTerm) {
      lines = lines.filter(line => line.toLowerCase().includes(searchTerm));
    }

    if (lines.length > maxLines) {
      lines = lines.slice(lines.length - maxLines);
    }

    return NextResponse.json({
      content: lines.join('\n'),
      lineCount: lines.length,
      totalSize: content.length,
    });

  } catch (error: any) {
    console.error('[Admin Log Content API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log content', details: error.message },
      { status: 500 }
    );
  }
}

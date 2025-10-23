/**
 * Health Monitoring Service
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'critical';
export type ServiceType = 'scheduler' | 'sync' | 'processor' | 'monitor';

interface RecordRunOptions {
  serviceName: string;
  serviceType: ServiceType;
  success: boolean;
  statusMessage?: string;
  executionTimeMs?: number;
  recordsProcessed?: number;
  errorDetails?: string;
}

// Health monitoring functionality has been temporarily disabled
// This file will be rebuilt when marketing features are re-implemented

export async function recordServiceRun(options: RecordRunOptions): Promise<void> {
  // Disabled - will be rebuilt
}

export async function getServiceHealth(
  serviceName: string,
  serviceType: ServiceType
): Promise<any> {
  // Disabled - will be rebuilt
  return null;
}

export async function getSystemHealthSummary(): Promise<{
  overallStatus: HealthStatus;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  criticalServices: number;
  services: any[];
}> {
  // Disabled - will be rebuilt
  return {
    overallStatus: 'healthy',
    totalServices: 0,
    healthyServices: 0,
    degradedServices: 0,
    unhealthyServices: 0,
    criticalServices: 0,
    services: [],
  };
}

export async function getAllServiceHealth(): Promise<any[]> {
  // Disabled - will be rebuilt
  return [];
}

export async function getSystemHealth(): Promise<any> {
  // Disabled - will be rebuilt
  return {
    overallStatus: 'healthy',
    totalServices: 0,
    healthyServices: 0,
    degradedServices: 0,
    unhealthyServices: 0,
    criticalServices: 0,
    services: [],
  };
}

export async function recordSuccess(serviceName: string, serviceType: ServiceType, options?: any): Promise<void> {
  // Disabled - will be rebuilt
}

export async function recordFailure(serviceName: string, serviceType: ServiceType, error: any, options?: any): Promise<void> {
  // Disabled - will be rebuilt
}
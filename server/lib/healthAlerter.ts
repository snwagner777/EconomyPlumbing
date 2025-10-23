/**
 * Health Alerting Service
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 */

// Health alerting functionality has been temporarily disabled
// This file will be rebuilt when marketing features are re-implemented

export async function checkAndSendHealthAlerts(): Promise<{
  alertsSent: number;
  errors: string[];
}> {
  // Disabled - will be rebuilt
  return {
    alertsSent: 0,
    errors: [],
  };
}

export async function resetHealthAlertIfHealthy(
  serviceName: string,
  serviceType: string
): Promise<void> {
  // Disabled - will be rebuilt
}

export async function resetAlertsForRecoveredServices(): Promise<number> {
  // Disabled - will be rebuilt
  return 0;
}
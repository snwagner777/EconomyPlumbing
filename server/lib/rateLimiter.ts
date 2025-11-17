/**
 * Rate Limiter
 * 
 * Simple in-memory rate limiter for controlling API request rates
 * Handles multiple services with different rate limits
 */

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RateLimiter {
  private queues: Map<string, QueueItem[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private lastExecutionTime: Map<string, number> = new Map();
  private serviceLimits: Map<string, number> = new Map();

  /**
   * Add a function to the rate-limited queue
   * @param service - Service identifier (e.g., 'resend', 'servicetitan')
   * @param fn - Async function to execute
   * @param requestsPerSecond - Maximum requests per second for this service
   * @returns Promise that resolves when the function completes
   */
  async enqueue<T>(
    service: string,
    fn: () => Promise<T>,
    requestsPerSecond: number = 2
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.queues.has(service)) {
        this.queues.set(service, []);
      }

      this.serviceLimits.set(service, requestsPerSecond);

      this.queues.get(service)!.push({
        fn,
        resolve,
        reject,
      });

      this.processQueue(service);
    });
  }

  private async processQueue(service: string): Promise<void> {
    if (this.processing.get(service)) {
      return;
    }

    this.processing.set(service, true);

    while (true) {
      const queue = this.queues.get(service);
      if (!queue || queue.length === 0) {
        this.processing.set(service, false);
        return;
      }

      const requestsPerSecond = this.serviceLimits.get(service) || 2;
      const now = Date.now();
      const lastExecution = this.lastExecutionTime.get(service) || 0;
      const minInterval = 1000 / requestsPerSecond;
      const timeSinceLastExecution = now - lastExecution;

      if (timeSinceLastExecution < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastExecution));
      }

      const item = queue.shift();
      if (!item) continue;

      this.lastExecutionTime.set(service, Date.now());

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
  }

  /**
   * Get current queue size for a service
   */
  getQueueSize(service: string): number {
    return this.queues.get(service)?.length || 0;
  }

  /**
   * Clear all queued items for a service
   */
  clearQueue(service: string): void {
    this.queues.set(service, []);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Tracks performance metrics for async vs blocking endpoints
 */

interface RequestMetric {
    responseTime: number;
    timestamp: number;
}

interface EndpointMetrics {
    totalRequests: number;
    responseTimes: number[];
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50: number;
    p95: number;
    p99: number;
}

export class MetricsService {
    private metrics: Map<string, RequestMetric[]> = new Map();

    recordRequest(endpoint: string, responseTimeMs: number): void {
        if (!this.metrics.has(endpoint)) {
            this.metrics.set(endpoint, []);
        }

        this.metrics.get(endpoint)!.push({
            responseTime: responseTimeMs,
            timestamp: Date.now()
        });
    }

    getMetrics(): Record<string, any> {
        const result: Record<string, EndpointMetrics> = {};

        for (const [endpoint, metrics] of this.metrics.entries()) {
            const times = metrics.map(m => m.responseTime).sort((a, b) => a - b);

            if (times.length > 0) {
                result[endpoint] = {
                    totalRequests: times.length,
                    responseTimes: times,
                    avgResponseTime: this.average(times),
                    minResponseTime: Math.min(...times),
                    maxResponseTime: Math.max(...times),
                    p50: this.percentile(times, 50),
                    p95: this.percentile(times, 95),
                    p99: this.percentile(times, 99)
                };
            }
        }

        return {
            timestamp: new Date().toISOString(),
            eventLoopLag: this.getEventLoopLag(),
            memoryUsage: process.memoryUsage(),
            endpoints: result
        };
    }

    reset(): void {
        this.metrics.clear();
    }

    private average(arr: number[]): number {
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100;
    }

    private percentile(sortedArr: number[], p: number): number {
        const index = Math.ceil(sortedArr.length * p / 100) - 1;
        return Math.round(sortedArr[Math.max(0, index)] * 100) / 100;
    }

    private getEventLoopLag(): number {
        // Simple event loop lag measurement
        const start = Date.now();
        setImmediate(() => {
            const lag = Date.now() - start;
            return lag;
        });
        return 0; // Simplified for this demo
    }
}

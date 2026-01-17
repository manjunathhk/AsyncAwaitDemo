/**
 * Simulates database operations with realistic delays
 */

// Helper to create random delay
const randomDelay = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Helper to create a promise that resolves after a delay
 */
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export class DatabaseService {
    /**
     * ASYNC: Simulates an async database query
     * Event loop is FREE during the delay to process other requests
     */
    async getUsersAsync(): Promise<string[]> {
        // Simulate database latency (50-150ms)
        await delay(randomDelay(50, 150));

        return ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    }

    /**
     * BLOCKING (BAD): Simulates a blocking database query
     * This blocks the event loop - VERY BAD in Node.js!
     *
     * Note: In real Node.js, you'd never do this. This is for demonstration.
     * We simulate blocking with a busy-wait loop.
     */
    getUsersBlocking(): string[] {
        // BAD: Busy-wait blocks the event loop
        const delayMs = randomDelay(50, 150);
        const start = Date.now();
        while (Date.now() - start < delayMs) {
            // Busy wait - blocks the entire event loop!
            // No other requests can be processed during this time
        }

        return ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    }

    /**
     * ASYNC: Simulates multiple parallel async database queries
     */
    async getOrderDetailsAsync(orderId: number): Promise<Record<string, any>> {
        // All queries run in parallel
        const [order, items, customer] = await Promise.all([
            delay(randomDelay(30, 80)).then(() => ({ id: orderId, total: 299.99 })),
            delay(randomDelay(40, 90)).then(() => ['Item1', 'Item2', 'Item3']),
            delay(randomDelay(20, 70)).then(() => 'John Doe')
        ]);

        return {
            order,
            items,
            customer
        };
    }

    /**
     * BLOCKING (BAD): Simulates multiple blocking database queries
     * Runs sequentially and blocks the event loop
     */
    getOrderDetailsBlocking(orderId: number): Record<string, any> {
        // BAD: Sequential blocking operations
        const start1 = Date.now();
        const delay1 = randomDelay(30, 80);
        while (Date.now() - start1 < delay1) { /* busy wait */ }
        const order = { id: orderId, total: 299.99 };

        const start2 = Date.now();
        const delay2 = randomDelay(40, 90);
        while (Date.now() - start2 < delay2) { /* busy wait */ }
        const items = ['Item1', 'Item2', 'Item3'];

        const start3 = Date.now();
        const delay3 = randomDelay(20, 70);
        while (Date.now() - start3 < delay3) { /* busy wait */ }
        const customer = 'John Doe';

        return {
            order,
            items,
            customer
        };
    }

    /**
     * FAKE ASYNC (ANTI-PATTERN): Wrapping blocking code in a Promise
     * This is still blocking! The busy-wait still blocks the event loop.
     */
    async getUsersFakeAsync(): Promise<string[]> {
        // ANTI-PATTERN: This still blocks the event loop!
        const delayMs = randomDelay(50, 150);
        const start = Date.now();
        while (Date.now() - start < delayMs) {
            // Still blocking!
        }

        return ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    }
}

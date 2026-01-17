/**
 * Simulates external API calls with realistic delays
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

export class ExternalApiService {
    /**
     * ASYNC: Simulates calling an external API asynchronously
     * Event loop is free to handle other requests during the network wait
     */
    async getWeatherAsync(city: string): Promise<string> {
        // Simulate network latency (100-300ms)
        await delay(randomDelay(100, 300));

        return `Weather in ${city}: Sunny, 72°F`;
    }

    /**
     * BLOCKING (BAD): Simulates a blocking external API call
     * Blocks the event loop - catastrophic in Node.js!
     */
    getWeatherBlocking(city: string): string {
        // BAD: Blocks the entire event loop
        const delayMs = randomDelay(100, 300);
        const start = Date.now();
        while (Date.now() - start < delayMs) {
            // Busy wait - disaster for Node.js!
        }

        return `Weather in ${city}: Sunny, 72°F`;
    }

    /**
     * ASYNC: Simulates calling multiple external APIs in parallel
     */
    async getEnrichedDataAsync(userId: string): Promise<Record<string, string>> {
        // All API calls run in parallel
        const [profile, preferences, analytics] = await Promise.all([
            delay(randomDelay(80, 150)).then(() => `Profile data for ${userId}`),
            delay(randomDelay(60, 120)).then(() => 'Dark mode enabled'),
            delay(randomDelay(90, 180)).then(() => 'Last login: 2 hours ago')
        ]);

        return {
            profile,
            preferences,
            analytics
        };
    }

    /**
     * BLOCKING (BAD): Simulates calling multiple external APIs sequentially
     * Each call blocks the event loop
     */
    getEnrichedDataBlocking(userId: string): Record<string, string> {
        // BAD: Sequential blocking calls
        let start = Date.now();
        let delayMs = randomDelay(80, 150);
        while (Date.now() - start < delayMs) { /* busy wait */ }
        const profile = `Profile data for ${userId}`;

        start = Date.now();
        delayMs = randomDelay(60, 120);
        while (Date.now() - start < delayMs) { /* busy wait */ }
        const preferences = 'Dark mode enabled';

        start = Date.now();
        delayMs = randomDelay(90, 180);
        while (Date.now() - start < delayMs) { /* busy wait */ }
        const analytics = 'Last login: 2 hours ago';

        return {
            profile,
            preferences,
            analytics
        };
    }
}

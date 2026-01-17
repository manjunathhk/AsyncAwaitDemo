import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ExternalApiService } from '../services/externalApiService';
import { MetricsService } from '../services/metricsService';

export class BlockingController {
    constructor(
        private dbService: DatabaseService,
        private apiService: ExternalApiService,
        private metricsService: MetricsService
    ) {}

    /**
     * BLOCKING (BAD): Fetches users synchronously
     * Event loop is BLOCKED - NO other requests can be processed!
     * This is catastrophic in Node.js!
     */
    getUsers(req: Request, res: Response): void {
        const start = Date.now();

        try {
            // BAD: Event loop is completely BLOCKED during this operation
            // No other requests can be processed AT ALL!
            const users = this.dbService.getUsersBlocking();

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('blocking/users', responseTime);

            res.json({
                method: 'BLOCKING',
                users,
                responseTimeMs: responseTime,
                message: '⚠️ Event loop was BLOCKED - NO other requests could be processed!'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * BLOCKING (BAD): Fetches order details with blocking I/O operations
     * Event loop is blocked for the ENTIRE duration
     */
    getOrder(req: Request, res: Response): void {
        const start = Date.now();
        const orderId = parseInt(req.params.id);

        try {
            // BAD: Sequential blocking operations
            // Event loop is blocked the entire time
            const orderDetails = this.dbService.getOrderDetailsBlocking(orderId);
            const enrichedData = this.apiService.getEnrichedDataBlocking(`user_${orderId}`);

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('blocking/orders', responseTime);

            res.json({
                method: 'BLOCKING',
                orderDetails,
                enrichedData,
                responseTimeMs: responseTime,
                message: '⚠️ Event loop BLOCKED for entire duration - server was frozen!'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * BLOCKING (BAD): Complex scenario with multiple blocking operations
     * This will make the server completely unresponsive under load!
     */
    complexOperation(req: Request, res: Response): void {
        const start = Date.now();

        try {
            // DISASTER: All blocking operations run sequentially
            // Server is completely frozen during this time
            const users = this.dbService.getUsersBlocking();
            const weather = this.apiService.getWeatherBlocking('New York');
            const order = this.dbService.getOrderDetailsBlocking(123);

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('blocking/complex', responseTime);

            res.json({
                method: 'BLOCKING',
                users,
                weather,
                order,
                responseTimeMs: responseTime,
                message: '⚠️ Server was COMPLETELY FROZEN for ' + responseTime + 'ms!'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * FAKE ASYNC (ANTI-PATTERN): Async function that still blocks
     * This demonstrates a common mistake
     */
    async fakeAsyncUsers(req: Request, res: Response): Promise<void> {
        const start = Date.now();

        try {
            // ANTI-PATTERN: This is marked async but still blocks!
            const users = await this.dbService.getUsersFakeAsync();

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('blocking/fake-async', responseTime);

            res.json({
                method: 'FAKE ASYNC (ANTI-PATTERN)',
                users,
                responseTimeMs: responseTime,
                message: '⚠️ Marked as async but still BLOCKS the event loop!'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ExternalApiService } from '../services/externalApiService';
import { MetricsService } from '../services/metricsService';

export class AsyncController {
    constructor(
        private dbService: DatabaseService,
        private apiService: ExternalApiService,
        private metricsService: MetricsService
    ) {}

    /**
     * ASYNC: Fetches users from database asynchronously
     * Event loop is FREE during I/O wait - can handle other requests
     */
    async getUsers(req: Request, res: Response): Promise<void> {
        const start = Date.now();

        try {
            // GOOD: Event loop is free during await
            const users = await this.dbService.getUsersAsync();

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('async/users', responseTime);

            res.json({
                method: 'ASYNC',
                users,
                responseTimeMs: responseTime,
                message: 'Event loop was FREE during I/O wait'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * ASYNC: Fetches order details with multiple parallel I/O operations
     * Demonstrates parallel async calls
     */
    async getOrder(req: Request, res: Response): Promise<void> {
        const start = Date.now();
        const orderId = parseInt(req.params.id as string);

        try {
            // GOOD: Multiple I/O operations run in PARALLEL
            const [orderDetails, enrichedData] = await Promise.all([
                this.dbService.getOrderDetailsAsync(orderId),
                this.apiService.getEnrichedDataAsync(`user_${orderId}`)
            ]);

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('async/orders', responseTime);

            res.json({
                method: 'ASYNC',
                orderDetails,
                enrichedData,
                responseTimeMs: responseTime,
                message: 'Multiple I/O operations ran in PARALLEL, event loop was FREE'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * ASYNC: Complex scenario with multiple parallel I/O operations
     */
    async complexOperation(req: Request, res: Response): Promise<void> {
        const start = Date.now();

        try {
            // All these I/O operations run in parallel
            const [users, weather, order] = await Promise.all([
                this.dbService.getUsersAsync(),
                this.apiService.getWeatherAsync('New York'),
                this.dbService.getOrderDetailsAsync(123)
            ]);

            const responseTime = Date.now() - start;
            this.metricsService.recordRequest('async/complex', responseTime);

            res.json({
                method: 'ASYNC',
                users,
                weather,
                order,
                responseTimeMs: responseTime,
                message: 'All I/O operations ran in PARALLEL'
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

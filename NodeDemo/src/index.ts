import express, { Request, Response } from 'express';
import cors from 'cors';
import { DatabaseService } from './services/databaseService';
import { ExternalApiService } from './services/externalApiService';
import { MetricsService } from './services/metricsService';
import { AsyncController } from './controllers/asyncController';
import { BlockingController } from './controllers/blockingController';

const app = express();
const PORT = 3000;

// Initialize services
const dbService = new DatabaseService();
const apiService = new ExternalApiService();
const metricsService = new MetricsService();

// Initialize controllers
const asyncController = new AsyncController(dbService, apiService, metricsService);
const blockingController = new BlockingController(dbService, apiService, metricsService);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// ============================================
// ASYNC ENDPOINTS (GOOD)
// ============================================
app.get('/api/async/users', (req, res) => asyncController.getUsers(req, res));
app.get('/api/async/orders/:id', (req, res) => asyncController.getOrder(req, res));
app.get('/api/async/complex', (req, res) => asyncController.complexOperation(req, res));

// ============================================
// BLOCKING ENDPOINTS (BAD - for demonstration)
// ============================================
app.get('/api/blocking/users', (req, res) => blockingController.getUsers(req, res));
app.get('/api/blocking/orders/:id', (req, res) => blockingController.getOrder(req, res));
app.get('/api/blocking/complex', (req, res) => blockingController.complexOperation(req, res));
app.get('/api/blocking/fake-async', (req, res) => blockingController.fakeAsyncUsers(req, res));

// ============================================
// METRICS & UTILITY ENDPOINTS
// ============================================
app.get('/metrics', (req: Request, res: Response) => {
    res.json(metricsService.getMetrics());
});

app.post('/metrics/reset', (req: Request, res: Response) => {
    metricsService.reset();
    res.json({ message: 'Metrics reset successfully' });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Root endpoint with instructions
app.get('/', (req: Request, res: Response) => {
    res.json({
        title: 'Async/Await Node.js Demo API',
        description: 'Demonstrates the difference between async/await and blocking code',
        endpoints: {
            async: {
                users: 'GET /api/async/users',
                orders: 'GET /api/async/orders/:id',
                complex: 'GET /api/async/complex'
            },
            blocking: {
                users: 'GET /api/blocking/users',
                orders: 'GET /api/blocking/orders/:id',
                complex: 'GET /api/blocking/complex',
                fakeAsync: 'GET /api/blocking/fake-async'
            },
            metrics: {
                view: 'GET /metrics',
                reset: 'POST /metrics/reset'
            }
        },
        warning: '⚠️ Blocking endpoints will freeze the server under concurrent load!',
        instructions: [
            '1. Use load testing script: npm test',
            '2. Compare async vs blocking performance',
            '3. View metrics at /metrics'
        ]
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('Async/Await Node.js Demo API Started');
    console.log('='.repeat(60));
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Metrics: http://localhost:${PORT}/metrics`);
    console.log('');
    console.log('CORS: Enabled (allows web dashboard access)');
    console.log('');
    console.log('TEST ENDPOINTS:');
    console.log('  Async:    GET /api/async/users');
    console.log('  Blocking: GET /api/blocking/users');
    console.log('  Async:    GET /api/async/orders/:id');
    console.log('  Blocking: GET /api/blocking/orders/:id');
    console.log('  Async:    GET /api/async/complex');
    console.log('  Blocking: GET /api/blocking/complex');
    console.log('');
    console.log('⚠️  WARNING: Blocking endpoints will freeze the server!');
    console.log('   Use them only for comparison during load testing.');
    console.log('='.repeat(60));
});

export default app;

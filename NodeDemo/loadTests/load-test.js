#!/usr/bin/env node

/**
 * Load Testing Script for Node.js Async/Await Demo
 * Demonstrates the catastrophic impact of blocking the event loop
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 200;

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const url = `${BASE_URL}${path}`;

        http.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const elapsed = Date.now() - start;
                resolve({
                    success: res.statusCode === 200,
                    time: elapsed,
                    status: res.statusCode
                });
            });
        }).on('error', (err) => {
            const elapsed = Date.now() - start;
            resolve({
                success: false,
                time: elapsed,
                status: 'error',
                error: err.message
            });
        });
    });
}

async function checkServer() {
    try {
        await makeRequest('/health');
        return true;
    } catch (error) {
        return false;
    }
}

async function resetMetrics() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/metrics/reset',
            method: 'POST'
        };

        const req = http.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve());
        });

        req.on('error', () => resolve());
        req.end();
    });
}

async function runLoadTest(endpoint, name, concurrent = CONCURRENT_REQUESTS, total = TOTAL_REQUESTS) {
    log('\n' + '='.repeat(60), colors.bright);
    log(`Testing: ${name}`, colors.cyan);
    log(`Endpoint: ${endpoint}`, colors.blue);
    log(`Concurrent: ${concurrent} | Total Requests: ${total}`, colors.blue);
    log('='.repeat(60), colors.bright);

    const results = [];
    const batchSize = concurrent;
    const numBatches = Math.ceil(total / batchSize);

    const startTime = Date.now();

    for (let batch = 0; batch < numBatches; batch++) {
        const batchRequests = Math.min(batchSize, total - batch * batchSize);
        process.stdout.write(`  Progress: Batch ${batch + 1}/${numBatches} (${batchRequests} requests)... `);

        const promises = [];
        for (let i = 0; i < batchRequests; i++) {
            promises.push(makeRequest(endpoint));
        }

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        log('✓', colors.green);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const times = results.map(r => r.time).sort((a, b) => a - b);
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    const stats = {
        totalRequests: results.length,
        successful,
        failed,
        totalTimeSec: totalTime.toFixed(2),
        requestsPerSec: (results.length / totalTime).toFixed(2),
        avgResponseMs: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
        minResponseMs: Math.min(...times).toFixed(2),
        maxResponseMs: Math.max(...times).toFixed(2),
        p50Ms: times[Math.floor(times.length * 0.50)].toFixed(2),
        p95Ms: times[Math.floor(times.length * 0.95)].toFixed(2),
        p99Ms: times[Math.floor(times.length * 0.99)].toFixed(2)
    };

    log('\n' + '─'.repeat(60), colors.bright);
    log('RESULTS:', colors.bright);
    log('─'.repeat(60), colors.bright);
    log(`  Total Requests:     ${stats.totalRequests}`);
    log(`  Successful:         ${stats.successful}`, successful === results.length ? colors.green : colors.yellow);
    log(`  Failed:             ${stats.failed}`, failed > 0 ? colors.red : colors.green);
    log(`  Total Time:         ${stats.totalTimeSec}s`);
    log(`  Throughput:         ${stats.requestsPerSec} req/sec`, colors.cyan);
    log('\n  Response Times:');
    log(`    Average:          ${stats.avgResponseMs} ms`, colors.cyan);
    log(`    Min:              ${stats.minResponseMs} ms`);
    log(`    Max:              ${stats.maxResponseMs} ms`, colors.yellow);
    log(`    P50 (median):     ${stats.p50Ms} ms`);
    log(`    P95:              ${stats.p95Ms} ms`, colors.yellow);
    log(`    P99:              ${stats.p99Ms} ms`, colors.red);
    log('─'.repeat(60), colors.bright);

    return stats;
}

async function main() {
    log('='.repeat(60), colors.bright);
    log('Node.js Async/Await Load Testing', colors.bright);
    log('='.repeat(60), colors.bright);

    // Check server
    log('\nChecking server availability...', colors.yellow);
    const serverRunning = await checkServer();

    if (!serverRunning) {
        log('✗ ERROR: Server is not running at ' + BASE_URL, colors.red);
        log('\nPlease start the server first:', colors.yellow);
        log('  cd NodeDemo', colors.cyan);
        log('  npm install', colors.cyan);
        log('  npm run dev', colors.cyan);
        process.exit(1);
    }

    log('✓ Server is running', colors.green);

    // Reset metrics
    log('\nResetting server metrics...', colors.yellow);
    await resetMetrics();
    log('✓ Metrics reset', colors.green);

    const allResults = {};

    // Test ASYNC endpoints
    log('\n' + '='.repeat(60), colors.bright);
    log('PHASE 1: ASYNC ENDPOINTS (Event Loop Free)', colors.green);
    log('='.repeat(60), colors.bright);

    allResults.asyncUsers = await runLoadTest(
        '/api/async/users',
        'ASYNC - Get Users',
        CONCURRENT_REQUESTS,
        TOTAL_REQUESTS
    );

    allResults.asyncOrders = await runLoadTest(
        '/api/async/orders/123',
        'ASYNC - Get Orders',
        CONCURRENT_REQUESTS,
        TOTAL_REQUESTS
    );

    // Test BLOCKING endpoints
    log('\n' + '='.repeat(60), colors.bright);
    log('PHASE 2: BLOCKING ENDPOINTS (Event Loop Blocked)', colors.red);
    log('⚠️  WARNING: This will freeze the server!', colors.yellow);
    log('='.repeat(60), colors.bright);

    allResults.blockingUsers = await runLoadTest(
        '/api/blocking/users',
        'BLOCKING - Get Users',
        CONCURRENT_REQUESTS,
        TOTAL_REQUESTS
    );

    allResults.blockingOrders = await runLoadTest(
        '/api/blocking/orders/123',
        'BLOCKING - Get Orders',
        CONCURRENT_REQUESTS,
        TOTAL_REQUESTS
    );

    // Comparison
    log('\n' + '='.repeat(60), colors.bright);
    log('COMPARISON: ASYNC vs BLOCKING', colors.bright);
    log('='.repeat(60), colors.bright);

    const comparisons = [
        ['Users Endpoint', 'asyncUsers', 'blockingUsers'],
        ['Orders Endpoint', 'asyncOrders', 'blockingOrders']
    ];

    for (const [name, asyncKey, blockingKey] of comparisons) {
        const asyncStats = allResults[asyncKey];
        const blockingStats = allResults[blockingKey];

        log(`\n${name}:`, colors.cyan);
        log(`  Throughput:`);
        log(`    ASYNC:    ${asyncStats.requestsPerSec} req/sec`, colors.green);
        log(`    BLOCKING: ${blockingStats.requestsPerSec} req/sec`, colors.red);
        const throughputImprovement = ((parseFloat(asyncStats.requestsPerSec) - parseFloat(blockingStats.requestsPerSec)) / parseFloat(blockingStats.requestsPerSec) * 100).toFixed(1);
        log(`    ASYNC is ${throughputImprovement}% faster`, throughputImprovement > 0 ? colors.green : colors.red);

        log(`\n  Average Response Time:`);
        log(`    ASYNC:    ${asyncStats.avgResponseMs} ms`, colors.green);
        log(`    BLOCKING: ${blockingStats.avgResponseMs} ms`, colors.red);
        const responseImprovement = ((parseFloat(blockingStats.avgResponseMs) - parseFloat(asyncStats.avgResponseMs)) / parseFloat(blockingStats.avgResponseMs) * 100).toFixed(1);
        log(`    ASYNC is ${responseImprovement}% faster`, responseImprovement > 0 ? colors.green : colors.red);

        log(`\n  P95 Response Time:`);
        log(`    ASYNC:    ${asyncStats.p95Ms} ms`, colors.green);
        log(`    BLOCKING: ${blockingStats.p95Ms} ms`, colors.red);
    }

    log('\n' + '='.repeat(60), colors.bright);
    log('KEY TAKEAWAYS:', colors.bright);
    log('='.repeat(60), colors.bright);
    log(`
1. ${colors.green}ASYNC${colors.reset} keeps the event loop FREE - handles multiple requests concurrently
2. ${colors.red}BLOCKING${colors.reset} freezes the event loop - processes ONE request at a time
3. In Node.js, blocking = ${colors.red}DISASTER${colors.reset} (single-threaded event loop)
4. Always use async/await for I/O operations (DB, APIs, files)

${colors.yellow}Why is blocking SO BAD in Node.js?${colors.reset}
- Node.js has a SINGLE event loop thread
- Blocking that thread = entire server is frozen
- No other requests can be processed AT ALL
- This is why async/await is CRITICAL in Node.js

${colors.cyan}View detailed metrics at: http://localhost:3000/metrics${colors.reset}
`, colors.reset);
    log('='.repeat(60), colors.bright);
}

main().catch(console.error);

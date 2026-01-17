// Configuration
const API_CONFIG = {
    csharp: {
        baseUrl: 'http://localhost:5000',
        asyncEndpoint: '/api/async/users',
        syncEndpoint: '/api/sync/users',
        metricsEndpoint: '/metrics',
        resetEndpoint: '/metrics/reset'
    },
    node: {
        baseUrl: 'http://localhost:3000',
        asyncEndpoint: '/api/async/users',
        syncEndpoint: '/api/blocking/users',
        metricsEndpoint: '/metrics',
        resetEndpoint: '/metrics/reset'
    }
};

// State
let currentApi = 'csharp';
let isRunning = false;

// DOM Elements
const testAsyncBtn = document.getElementById('testAsync');
const testSyncBtn = document.getElementById('testSync');
const testBothBtn = document.getElementById('testBoth');
const resetMetricsBtn = document.getElementById('resetMetrics');
const fetchMetricsBtn = document.getElementById('fetchMetrics');
const statusDiv = document.getElementById('status');
const concurrentRequestsInput = document.getElementById('concurrentRequests');
const totalRequestsInput = document.getElementById('totalRequests');

// API Selection
document.querySelectorAll('input[name="api"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentApi = e.target.value;
        updateStatus(`Switched to ${currentApi === 'csharp' ? 'C#' : 'Node.js'} API`);
    });
});

// Event Listeners
testAsyncBtn.addEventListener('click', () => runTest('async'));
testSyncBtn.addEventListener('click', () => runTest('sync'));
testBothBtn.addEventListener('click', () => runTest('both'));
resetMetricsBtn.addEventListener('click', resetMetrics);
fetchMetricsBtn.addEventListener('click', fetchServerMetrics);

// Update status message
function updateStatus(message, type = 'info') {
    statusDiv.className = `status ${type}`;
    statusDiv.innerHTML = `<p>${message}</p>`;
}

// Disable/enable buttons
function setButtonsEnabled(enabled) {
    testAsyncBtn.disabled = !enabled;
    testSyncBtn.disabled = !enabled;
    testBothBtn.disabled = !enabled;
    resetMetricsBtn.disabled = !enabled;
    fetchMetricsBtn.disabled = !enabled;
}

// Make HTTP request
async function makeRequest(url) {
    const startTime = performance.now();
    try {
        const response = await fetch(url);
        const endTime = performance.now();
        const duration = endTime - startTime;

        return {
            success: response.ok,
            duration,
            status: response.status
        };
    } catch (error) {
        const endTime = performance.now();
        return {
            success: false,
            duration: endTime - startTime,
            error: error.message
        };
    }
}

// Run concurrent requests
async function runConcurrentRequests(url, concurrent, total) {
    const results = [];
    const batches = Math.ceil(total / concurrent);

    for (let batch = 0; batch < batches; batch++) {
        const batchSize = Math.min(concurrent, total - (batch * concurrent));
        const promises = Array(batchSize).fill().map(() => makeRequest(url));

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        // Update progress
        const progress = Math.round(((batch + 1) / batches) * 100);
        updateStatus(`Running test... ${progress}% complete (${results.length}/${total} requests)`, 'loading');
    }

    return results;
}

// Calculate statistics
function calculateStats(results) {
    const successfulResults = results.filter(r => r.success);
    const durations = successfulResults.map(r => r.duration);

    if (durations.length === 0) {
        return {
            throughput: 0,
            avgTime: 0,
            p95Time: 0,
            successRate: 0,
            totalRequests: results.length,
            successfulRequests: 0
        };
    }

    durations.sort((a, b) => a - b);

    const totalTime = durations.reduce((sum, d) => sum + d, 0);
    const avgTime = totalTime / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Time = durations[p95Index] || durations[durations.length - 1];

    // Calculate throughput (requests per second)
    const maxTime = Math.max(...durations);
    const throughput = (results.length / maxTime) * 1000;

    return {
        throughput: Math.round(throughput * 10) / 10,
        avgTime: Math.round(avgTime * 10) / 10,
        p95Time: Math.round(p95Time * 10) / 10,
        successRate: Math.round((successfulResults.length / results.length) * 100),
        totalRequests: results.length,
        successfulRequests: successfulResults.length
    };
}

// Update metrics display
function updateMetricsDisplay(stats, type) {
    const prefix = type === 'async' ? 'async' : 'sync';

    document.getElementById(`${prefix}Throughput`).textContent = stats.throughput.toFixed(1);
    document.getElementById(`${prefix}AvgTime`).textContent = stats.avgTime.toFixed(1);
    document.getElementById(`${prefix}P95`).textContent = stats.p95Time.toFixed(1);
    document.getElementById(`${prefix}SuccessRate`).textContent = stats.successRate.toFixed(1);

    // Update chart placeholder
    const chartCanvas = document.getElementById(`${prefix}Chart`);
    const ctx = chartCanvas.getContext('2d');
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    ctx.fillStyle = '#667eea';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${stats.successfulRequests}/${stats.totalRequests} requests successful`, chartCanvas.width / 2, chartCanvas.height / 2);
}

// Update comparison display
function updateComparison(asyncStats, syncStats) {
    if (!asyncStats || !syncStats) return;

    const throughputImprovement = ((asyncStats.throughput / syncStats.throughput - 1) * 100).toFixed(0);
    const timeImprovement = ((syncStats.avgTime / asyncStats.avgTime - 1) * 100).toFixed(0);

    document.getElementById('throughputImprovement').textContent = `${throughputImprovement}% faster`;
    document.getElementById('timeImprovement').textContent = `${timeImprovement}% faster`;
    document.getElementById('winner').textContent = asyncStats.throughput > syncStats.throughput ? 'ASYNC' : 'SYNC';

    // Update colors
    const winnerElement = document.getElementById('winner');
    winnerElement.style.color = asyncStats.throughput > syncStats.throughput ? 'var(--success-color)' : 'var(--danger-color)';
}

// Run test
async function runTest(mode) {
    if (isRunning) {
        updateStatus('Test already running. Please wait.', 'error');
        return;
    }

    isRunning = true;
    setButtonsEnabled(false);

    const config = API_CONFIG[currentApi];
    const concurrent = parseInt(concurrentRequestsInput.value);
    const total = parseInt(totalRequestsInput.value);

    try {
        let asyncStats = null;
        let syncStats = null;

        if (mode === 'async' || mode === 'both') {
            updateStatus(`Testing async endpoints... (0/${total} requests)`, 'loading');
            const asyncUrl = config.baseUrl + config.asyncEndpoint;
            const asyncResults = await runConcurrentRequests(asyncUrl, concurrent, total);
            asyncStats = calculateStats(asyncResults);
            updateMetricsDisplay(asyncStats, 'async');
        }

        if (mode === 'sync' || mode === 'both') {
            updateStatus(`Testing sync/blocking endpoints... (0/${total} requests)`, 'loading');
            const syncUrl = config.baseUrl + config.syncEndpoint;
            const syncResults = await runConcurrentRequests(syncUrl, concurrent, total);
            syncStats = calculateStats(syncResults);
            updateMetricsDisplay(syncStats, 'sync');
        }

        if (mode === 'both' && asyncStats && syncStats) {
            updateComparison(asyncStats, syncStats);
        }

        updateStatus('Test completed successfully!', 'success');
    } catch (error) {
        updateStatus(`Test failed: ${error.message}`, 'error');
        console.error('Test error:', error);
    } finally {
        isRunning = false;
        setButtonsEnabled(true);
    }
}

// Reset metrics
async function resetMetrics() {
    if (isRunning) return;

    isRunning = true;
    setButtonsEnabled(false);

    try {
        const config = API_CONFIG[currentApi];
        const url = config.baseUrl + config.resetEndpoint;

        updateStatus('Resetting server metrics...', 'loading');

        const response = await fetch(url, { method: 'POST' });

        if (response.ok) {
            updateStatus('Metrics reset successfully!', 'success');

            // Clear UI metrics
            ['async', 'sync'].forEach(type => {
                document.getElementById(`${type}Throughput`).textContent = '-';
                document.getElementById(`${type}AvgTime`).textContent = '-';
                document.getElementById(`${type}P95`).textContent = '-';
                document.getElementById(`${type}SuccessRate`).textContent = '-';
            });

            document.getElementById('throughputImprovement').textContent = '-';
            document.getElementById('timeImprovement').textContent = '-';
            document.getElementById('winner').textContent = '-';
        } else {
            updateStatus('Failed to reset metrics', 'error');
        }
    } catch (error) {
        updateStatus(`Failed to reset metrics: ${error.message}`, 'error');
        console.error('Reset error:', error);
    } finally {
        isRunning = false;
        setButtonsEnabled(true);
    }
}

// Fetch server metrics
async function fetchServerMetrics() {
    if (isRunning) return;

    isRunning = true;
    setButtonsEnabled(false);

    try {
        const config = API_CONFIG[currentApi];
        const url = config.baseUrl + config.metricsEndpoint;

        updateStatus('Fetching server metrics...', 'loading');

        const response = await fetch(url);

        if (response.ok) {
            const metrics = await response.json();
            displayServerMetrics(metrics);
            updateStatus('Server metrics fetched successfully!', 'success');
        } else {
            updateStatus('Failed to fetch server metrics', 'error');
        }
    } catch (error) {
        updateStatus(`Failed to fetch metrics: ${error.message}. Make sure the ${currentApi === 'csharp' ? 'C#' : 'Node.js'} server is running.`, 'error');
        console.error('Fetch error:', error);
    } finally {
        isRunning = false;
        setButtonsEnabled(true);
    }
}

// Display server metrics
function displayServerMetrics(metrics) {
    const metricsDiv = document.getElementById('serverMetrics');

    let html = '<div style="font-family: monospace; white-space: pre-wrap;">';
    html += JSON.stringify(metrics, null, 2);
    html += '</div>';

    metricsDiv.innerHTML = html;
}

// Initialize
updateStatus('Ready to run tests. Select an API and click a test button.');

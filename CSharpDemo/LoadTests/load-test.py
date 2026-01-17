#!/usr/bin/env python3
"""
Advanced Load Testing Script for Async/Await Demo
Uses concurrent requests to demonstrate async vs sync performance differences
"""

import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

BASE_URL = "http://localhost:5000"
CONCURRENT_REQUESTS = 100
TOTAL_REQUESTS = 500

def check_server():
    """Check if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/metrics", timeout=5)
        return response.status_code == 200
    except:
        return False

def reset_metrics():
    """Reset server metrics"""
    try:
        requests.post(f"{BASE_URL}/metrics/reset", timeout=5)
        print("✓ Metrics reset")
    except:
        print("✗ Failed to reset metrics")

def make_request(url):
    """Make a single request and measure response time"""
    start = time.time()
    try:
        response = requests.get(url, timeout=30)
        elapsed = (time.time() - start) * 1000  # Convert to milliseconds
        return {
            'success': response.status_code == 200,
            'time': elapsed,
            'status': response.status_code
        }
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return {
            'success': False,
            'time': elapsed,
            'status': 'error',
            'error': str(e)
        }

def run_load_test(endpoint, name, concurrent=CONCURRENT_REQUESTS, total=TOTAL_REQUESTS):
    """Run load test on a specific endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Endpoint: {endpoint}")
    print(f"Concurrent: {concurrent} | Total Requests: {total}")
    print(f"{'='*60}")

    url = f"{BASE_URL}{endpoint}"
    results = []
    errors = 0

    start_time = time.time()

    # Use ThreadPoolExecutor for concurrent requests
    with ThreadPoolExecutor(max_workers=concurrent) as executor:
        # Submit all requests
        futures = [executor.submit(make_request, url) for _ in range(total)]

        # Collect results as they complete
        completed = 0
        for future in as_completed(futures):
            result = future.result()
            results.append(result['time'])
            if not result['success']:
                errors += 1

            completed += 1
            if completed % 50 == 0:
                print(f"  Progress: {completed}/{total} requests completed")

    total_time = time.time() - start_time

    # Calculate statistics
    if results:
        results.sort()
        stats = {
            'total_requests': total,
            'successful': total - errors,
            'failed': errors,
            'total_time_sec': round(total_time, 2),
            'requests_per_sec': round(total / total_time, 2),
            'avg_response_ms': round(statistics.mean(results), 2),
            'min_response_ms': round(min(results), 2),
            'max_response_ms': round(max(results), 2),
            'p50_ms': round(results[int(len(results) * 0.50)], 2),
            'p95_ms': round(results[int(len(results) * 0.95)], 2),
            'p99_ms': round(results[int(len(results) * 0.99)], 2),
        }

        print(f"\n{'─'*60}")
        print("RESULTS:")
        print(f"{'─'*60}")
        print(f"  Total Requests:     {stats['total_requests']}")
        print(f"  Successful:         {stats['successful']}")
        print(f"  Failed:             {stats['failed']}")
        print(f"  Total Time:         {stats['total_time_sec']}s")
        print(f"  Throughput:         {stats['requests_per_sec']} req/sec")
        print(f"\n  Response Times:")
        print(f"    Average:          {stats['avg_response_ms']} ms")
        print(f"    Min:              {stats['min_response_ms']} ms")
        print(f"    Max:              {stats['max_response_ms']} ms")
        print(f"    P50 (median):     {stats['p50_ms']} ms")
        print(f"    P95:              {stats['p95_ms']} ms")
        print(f"    P99:              {stats['p99_ms']} ms")
        print(f"{'─'*60}")

        return stats
    else:
        print("  ✗ No successful requests")
        return None

def main():
    """Main execution"""
    print("="*60)
    print("Async/Await Load Testing - Advanced")
    print("="*60)

    # Check if server is running
    print("\nChecking server availability...")
    if not check_server():
        print("✗ ERROR: Server is not running at", BASE_URL)
        print("\nPlease start the server first:")
        print("  cd CSharpDemo/AsyncAwaitWebApi")
        print("  dotnet run")
        sys.exit(1)

    print("✓ Server is running")

    # Reset metrics
    print("\nResetting server metrics...")
    reset_metrics()

    # Store results for comparison
    all_results = {}

    # Test ASYNC endpoints
    print("\n" + "="*60)
    print("PHASE 1: ASYNC ENDPOINTS")
    print("="*60)

    all_results['async_users'] = run_load_test(
        "/api/async/users",
        "ASYNC - Get Users",
        concurrent=CONCURRENT_REQUESTS,
        total=TOTAL_REQUESTS
    )

    all_results['async_orders'] = run_load_test(
        "/api/async/orders/123",
        "ASYNC - Get Orders",
        concurrent=CONCURRENT_REQUESTS,
        total=TOTAL_REQUESTS
    )

    # Test SYNC endpoints
    print("\n" + "="*60)
    print("PHASE 2: SYNC ENDPOINTS")
    print("="*60)

    all_results['sync_users'] = run_load_test(
        "/api/sync/users",
        "SYNC - Get Users",
        concurrent=CONCURRENT_REQUESTS,
        total=TOTAL_REQUESTS
    )

    all_results['sync_orders'] = run_load_test(
        "/api/sync/orders/123",
        "SYNC - Get Orders",
        concurrent=CONCURRENT_REQUESTS,
        total=TOTAL_REQUESTS
    )

    # Comparison
    print("\n" + "="*60)
    print("COMPARISON: ASYNC vs SYNC")
    print("="*60)

    comparisons = [
        ('Users Endpoint', 'async_users', 'sync_users'),
        ('Orders Endpoint', 'async_orders', 'sync_orders')
    ]

    for name, async_key, sync_key in comparisons:
        if all_results.get(async_key) and all_results.get(sync_key):
            async_stats = all_results[async_key]
            sync_stats = all_results[sync_key]

            print(f"\n{name}:")
            print(f"  Throughput:")
            print(f"    ASYNC: {async_stats['requests_per_sec']} req/sec")
            print(f"    SYNC:  {sync_stats['requests_per_sec']} req/sec")
            improvement = ((async_stats['requests_per_sec'] - sync_stats['requests_per_sec'])
                          / sync_stats['requests_per_sec'] * 100)
            print(f"    Improvement: {improvement:+.1f}%")

            print(f"\n  Average Response Time:")
            print(f"    ASYNC: {async_stats['avg_response_ms']} ms")
            print(f"    SYNC:  {sync_stats['avg_response_ms']} ms")
            improvement = ((sync_stats['avg_response_ms'] - async_stats['avg_response_ms'])
                          / sync_stats['avg_response_ms'] * 100)
            print(f"    Faster by: {improvement:+.1f}%")

            print(f"\n  P95 Response Time:")
            print(f"    ASYNC: {async_stats['p95_ms']} ms")
            print(f"    SYNC:  {sync_stats['p95_ms']} ms")

    print("\n" + "="*60)
    print("KEY TAKEAWAYS:")
    print("="*60)
    print("""
1. ASYNC endpoints handle MORE concurrent requests with BETTER response times
2. ASYNC releases threads during I/O, allowing better resource utilization
3. SYNC blocks threads, leading to thread pool starvation under load
4. For I/O-bound operations (DB, APIs), ASYNC is significantly better

See the server metrics at: http://localhost:5000/metrics
    """)
    print("="*60)

if __name__ == "__main__":
    main()

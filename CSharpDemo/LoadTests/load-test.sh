#!/bin/bash

# Load Testing Script for Async/Await Demo
# This script sends concurrent requests to test async vs sync performance

BASE_URL="http://localhost:5000"
CONCURRENT_REQUESTS=50
ITERATIONS=5

echo "=============================================="
echo "Async/Await Load Testing Script"
echo "=============================================="
echo "Concurrent Requests: $CONCURRENT_REQUESTS"
echo "Iterations per endpoint: $ITERATIONS"
echo ""

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL/metrics" > /dev/null; then
    echo "ERROR: Server is not running at $BASE_URL"
    echo "Please start the server first: cd CSharpDemo/AsyncAwaitWebApi && dotnet run"
    exit 1
fi

echo "Server is running ✓"
echo ""

# Reset metrics
echo "Resetting metrics..."
curl -s -X POST "$BASE_URL/metrics/reset" > /dev/null
echo ""

# Function to run concurrent requests
run_concurrent_test() {
    local endpoint=$1
    local name=$2

    echo "Testing: $name"
    echo "Endpoint: $endpoint"
    echo "Sending $CONCURRENT_REQUESTS concurrent requests..."

    for i in $(seq 1 $ITERATIONS); do
        echo -n "  Iteration $i/$ITERATIONS: "

        # Launch concurrent requests in background
        for j in $(seq 1 $CONCURRENT_REQUESTS); do
            curl -s "$BASE_URL$endpoint" > /dev/null &
        done

        # Wait for all background jobs to complete
        wait
        echo "✓"
    done

    echo ""
}

echo "=============================================="
echo "PHASE 1: Testing ASYNC endpoints"
echo "=============================================="
echo ""

run_concurrent_test "/api/async/users" "ASYNC - Get Users"
run_concurrent_test "/api/async/orders/123" "ASYNC - Get Orders"

echo "=============================================="
echo "PHASE 2: Testing SYNC endpoints"
echo "=============================================="
echo ""

run_concurrent_test "/api/sync/users" "SYNC - Get Users"
run_concurrent_test "/api/sync/orders/123" "SYNC - Get Orders"

echo "=============================================="
echo "Load test completed!"
echo "=============================================="
echo ""
echo "Fetching metrics..."
echo ""

# Fetch and display metrics
curl -s "$BASE_URL/metrics" | python3 -m json.tool

echo ""
echo "=============================================="
echo "Analysis:"
echo "=============================================="
echo "Compare the metrics above:"
echo "1. Response times (Avg, P95, P99)"
echo "2. Thread pool utilization"
echo ""
echo "EXPECTED RESULTS:"
echo "- ASYNC endpoints: Lower response times, better throughput"
echo "- SYNC endpoints: Higher response times, thread pool exhaustion"
echo "=============================================="

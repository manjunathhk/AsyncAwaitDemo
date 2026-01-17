using System.Collections.Concurrent;
using System.Diagnostics;

namespace AsyncAwaitWebApi.Services;

/// <summary>
/// Tracks performance metrics for async vs sync endpoints
/// </summary>
public class MetricsService
{
    private readonly ConcurrentDictionary<string, List<long>> _responseTimes = new();
    private readonly ConcurrentDictionary<string, int> _requestCounts = new();
    private readonly object _lock = new object();

    public void RecordRequest(string endpoint, long responseTimeMs)
    {
        _responseTimes.AddOrUpdate(
            endpoint,
            _ => new List<long> { responseTimeMs },
            (_, list) =>
            {
                lock (_lock)
                {
                    list.Add(responseTimeMs);
                    return list;
                }
            });

        _requestCounts.AddOrUpdate(endpoint, 1, (_, count) => count + 1);
    }

    public object GetMetrics()
    {
        var metrics = new Dictionary<string, object>();

        foreach (var endpoint in _responseTimes.Keys)
        {
            List<long> times;
            lock (_lock)
            {
                times = _responseTimes[endpoint].ToList();
            }

            if (times.Any())
            {
                times.Sort();
                metrics[endpoint] = new
                {
                    TotalRequests = _requestCounts[endpoint],
                    AvgResponseTime = times.Average(),
                    MinResponseTime = times.Min(),
                    MaxResponseTime = times.Max(),
                    P50 = GetPercentile(times, 50),
                    P95 = GetPercentile(times, 95),
                    P99 = GetPercentile(times, 99)
                };
            }
        }

        return new
        {
            Timestamp = DateTime.UtcNow,
            ThreadPoolInfo = new
            {
                AvailableWorkerThreads = GetAvailableWorkerThreads(),
                AvailableCompletionPortThreads = GetAvailableCompletionPortThreads()
            },
            Endpoints = metrics
        };
    }

    public void Reset()
    {
        _responseTimes.Clear();
        _requestCounts.Clear();
    }

    private long GetPercentile(List<long> sortedList, int percentile)
    {
        if (sortedList.Count == 0) return 0;
        int index = (int)Math.Ceiling(sortedList.Count * percentile / 100.0) - 1;
        index = Math.Max(0, Math.Min(index, sortedList.Count - 1));
        return sortedList[index];
    }

    private int GetAvailableWorkerThreads()
    {
        ThreadPool.GetAvailableThreads(out int workerThreads, out _);
        return workerThreads;
    }

    private int GetAvailableCompletionPortThreads()
    {
        ThreadPool.GetAvailableThreads(out _, out int completionPortThreads);
        return completionPortThreads;
    }
}

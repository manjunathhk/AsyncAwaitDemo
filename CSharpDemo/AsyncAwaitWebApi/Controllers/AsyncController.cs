using Microsoft.AspNetCore.Mvc;
using AsyncAwaitWebApi.Services;
using System.Diagnostics;

namespace AsyncAwaitWebApi.Controllers;

[ApiController]
[Route("api/async")]
public class AsyncController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly ExternalApiService _externalApiService;
    private readonly MetricsService _metricsService;

    public AsyncController(
        DatabaseService databaseService,
        ExternalApiService externalApiService,
        MetricsService metricsService)
    {
        _databaseService = databaseService;
        _externalApiService = externalApiService;
        _metricsService = metricsService;
    }

    /// <summary>
    /// ASYNC: Fetches users from database asynchronously
    /// Thread is RELEASED while waiting for I/O
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsersAsync()
    {
        var sw = Stopwatch.StartNew();

        // GOOD: Thread is released during await, can handle other requests
        var users = await _databaseService.GetUsersAsync();

        sw.Stop();
        _metricsService.RecordRequest("async/users", sw.ElapsedMilliseconds);

        return Ok(new
        {
            Method = "ASYNC",
            Users = users,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            ThreadId = Environment.CurrentManagedThreadId,
            Message = "Thread was RELEASED during I/O wait"
        });
    }

    /// <summary>
    /// ASYNC: Fetches order details with multiple parallel I/O operations
    /// Demonstrates parallel async calls
    /// </summary>
    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderAsync(int id)
    {
        var sw = Stopwatch.StartNew();

        // GOOD: Multiple I/O operations run in PARALLEL
        var orderDetails = await _databaseService.GetOrderDetailsAsync(id);
        var enrichedData = await _externalApiService.GetEnrichedDataAsync($"user_{id}");

        sw.Stop();
        _metricsService.RecordRequest("async/orders", sw.ElapsedMilliseconds);

        return Ok(new
        {
            Method = "ASYNC",
            OrderDetails = orderDetails,
            EnrichedData = enrichedData,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            ThreadId = Environment.CurrentManagedThreadId,
            Message = "Multiple I/O operations ran in PARALLEL, thread was RELEASED"
        });
    }

    /// <summary>
    /// ASYNC: Complex scenario with multiple I/O operations
    /// </summary>
    [HttpGet("complex")]
    public async Task<IActionResult> ComplexOperationAsync()
    {
        var sw = Stopwatch.StartNew();

        // All these I/O operations run in parallel
        var usersTask = _databaseService.GetUsersAsync();
        var weatherTask = _externalApiService.GetWeatherAsync("New York");
        var orderTask = _databaseService.GetOrderDetailsAsync(123);

        // Wait for all to complete - thread is released
        await Task.WhenAll(usersTask, weatherTask, orderTask);

        sw.Stop();
        _metricsService.RecordRequest("async/complex", sw.ElapsedMilliseconds);

        return Ok(new
        {
            Method = "ASYNC",
            Users = usersTask.Result,
            Weather = weatherTask.Result,
            Order = orderTask.Result,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            ThreadId = Environment.CurrentManagedThreadId,
            Message = "All I/O operations ran in PARALLEL"
        });
    }
}

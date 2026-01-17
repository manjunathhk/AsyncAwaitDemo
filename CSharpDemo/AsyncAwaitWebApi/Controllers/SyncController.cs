using Microsoft.AspNetCore.Mvc;
using AsyncAwaitWebApi.Services;
using System.Diagnostics;

namespace AsyncAwaitWebApi.Controllers;

[ApiController]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly ExternalApiService _externalApiService;
    private readonly MetricsService _metricsService;

    public SyncController(
        DatabaseService databaseService,
        ExternalApiService externalApiService,
        MetricsService metricsService)
    {
        _databaseService = databaseService;
        _externalApiService = externalApiService;
        _metricsService = metricsService;
    }

    /// <summary>
    /// SYNC: Fetches users from database synchronously
    /// Thread is BLOCKED while waiting for I/O
    /// </summary>
    [HttpGet("users")]
    public IActionResult GetUsersSync()
    {
        var sw = Stopwatch.StartNew();

        // BAD: Thread is BLOCKED during I/O, cannot handle other requests
        var users = _databaseService.GetUsersSync();

        sw.Stop();
        _metricsService.RecordRequest("sync/users", sw.ElapsedMilliseconds);

        return Ok(new
        {
            Method = "SYNC",
            Users = users,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            ThreadId = Environment.CurrentManagedThreadId,
            Message = "Thread was BLOCKED during I/O wait"
        });
    }

    /// <summary>
    /// SYNC: Fetches order details with blocking I/O operations
    /// Demonstrates sequential blocking calls
    /// </summary>
    [HttpGet("orders/{id}")]
    public IActionResult GetOrderSync(int id)
    {
        var sw = Stopwatch.StartNew();

        // BAD: Multiple I/O operations run SEQUENTIALLY, all blocking
        var orderDetails = _databaseService.GetOrderDetailsSync(id);
        var enrichedData = _externalApiService.GetEnrichedDataSync($"user_{id}");

        sw.Stop();
        _metricsService.RecordRequest("sync/orders", sw.ElapsedMilliseconds);

        return Ok(new
        {
            Method = "SYNC",
            OrderDetails = orderDetails,
            EnrichedData = enrichedData,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            ThreadId = Environment.CurrentManagedThreadId,
            Message = "Multiple I/O operations ran SEQUENTIALLY, thread was BLOCKED"
        });
    }

    /// <summary>
    /// SYNC: Complex scenario with multiple blocking I/O operations
    /// </summary>
    [HttpGet("complex")]
    public IActionResult ComplexOperationSync()
    {
        var sw = Stopwatch.StartNew();

        // BAD: All these run sequentially, blocking the thread
        var users = _databaseService.GetUsersSync();
        var weather = _externalApiService.GetWeatherSync("New York");
        var order = _databaseService.GetOrderDetailsSync(123);

        sw.Stop();
        _metricsService.RecordRequest("sync/complex", sw.ElapsedMilliseconds);

        return Ok(new
        {
            Method = "SYNC",
            Users = users,
            Weather = weather,
            Order = order,
            ResponseTimeMs = sw.ElapsedMilliseconds,
            ThreadId = Environment.CurrentManagedThreadId,
            Message = "All I/O operations ran SEQUENTIALLY and BLOCKED the thread"
        });
    }
}

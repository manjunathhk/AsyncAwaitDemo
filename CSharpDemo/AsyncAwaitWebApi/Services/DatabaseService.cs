namespace AsyncAwaitWebApi.Services;

/// <summary>
/// Simulates database operations with realistic delays
/// </summary>
public class DatabaseService
{
    private readonly Random _random = new Random();

    /// <summary>
    /// ASYNC: Simulates an async database query
    /// Thread is RELEASED during the delay
    /// </summary>
    public async Task<List<string>> GetUsersAsync()
    {
        // Simulate database latency (50-150ms)
        await Task.Delay(_random.Next(50, 150));

        return new List<string>
        {
            "Alice", "Bob", "Charlie", "David", "Eve"
        };
    }

    /// <summary>
    /// SYNC: Simulates a blocking database query
    /// Thread is BLOCKED during the delay
    /// </summary>
    public List<string> GetUsersSync()
    {
        // BAD: Thread.Sleep blocks the thread - it cannot do other work
        Thread.Sleep(_random.Next(50, 150));

        return new List<string>
        {
            "Alice", "Bob", "Charlie", "David", "Eve"
        };
    }

    /// <summary>
    /// ASYNC: Simulates multiple async database calls
    /// </summary>
    public async Task<Dictionary<string, object>> GetOrderDetailsAsync(int orderId)
    {
        // Simulate 3 parallel database queries
        var orderTask = Task.Delay(_random.Next(30, 80)).ContinueWith(_ => new { Id = orderId, Total = 299.99 });
        var itemsTask = Task.Delay(_random.Next(40, 90)).ContinueWith(_ => new[] { "Item1", "Item2", "Item3" });
        var customerTask = Task.Delay(_random.Next(20, 70)).ContinueWith(_ => "John Doe");

        // All queries run in parallel - total time is MAX(30-80, 40-90, 20-70), not SUM
        await Task.WhenAll(orderTask, itemsTask, customerTask);

        return new Dictionary<string, object>
        {
            ["order"] = orderTask.Result,
            ["items"] = itemsTask.Result,
            ["customer"] = customerTask.Result
        };
    }

    /// <summary>
    /// SYNC: Simulates multiple blocking database calls
    /// </summary>
    public Dictionary<string, object> GetOrderDetailsSync(int orderId)
    {
        // BAD: Sequential blocking calls - total time is SUM of all delays
        Thread.Sleep(_random.Next(30, 80));
        var order = new { Id = orderId, Total = 299.99 };

        Thread.Sleep(_random.Next(40, 90));
        var items = new[] { "Item1", "Item2", "Item3" };

        Thread.Sleep(_random.Next(20, 70));
        var customer = "John Doe";

        return new Dictionary<string, object>
        {
            ["order"] = order,
            ["items"] = items,
            ["customer"] = customer
        };
    }
}

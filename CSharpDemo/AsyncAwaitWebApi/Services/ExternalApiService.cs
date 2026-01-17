namespace AsyncAwaitWebApi.Services;

/// <summary>
/// Simulates external API calls with realistic delays
/// </summary>
public class ExternalApiService
{
    private readonly Random _random = new Random();

    /// <summary>
    /// ASYNC: Simulates calling an external API asynchronously
    /// </summary>
    public async Task<string> GetWeatherAsync(string city)
    {
        // Simulate network latency for external API call (100-300ms)
        await Task.Delay(_random.Next(100, 300));

        return $"Weather in {city}: Sunny, 72°F";
    }

    /// <summary>
    /// SYNC: Simulates calling an external API synchronously (BLOCKING)
    /// </summary>
    public string GetWeatherSync(string city)
    {
        // BAD: Blocking the thread for network I/O
        Thread.Sleep(_random.Next(100, 300));

        return $"Weather in {city}: Sunny, 72°F";
    }

    /// <summary>
    /// ASYNC: Simulates calling multiple external APIs
    /// </summary>
    public async Task<Dictionary<string, string>> GetEnrichedDataAsync(string userId)
    {
        // Simulate calling 3 different external services in parallel
        var profileTask = Task.Delay(_random.Next(80, 150))
            .ContinueWith(_ => $"Profile data for {userId}");

        var preferencesTask = Task.Delay(_random.Next(60, 120))
            .ContinueWith(_ => "Dark mode enabled");

        var analyticsTask = Task.Delay(_random.Next(90, 180))
            .ContinueWith(_ => "Last login: 2 hours ago");

        await Task.WhenAll(profileTask, preferencesTask, analyticsTask);

        return new Dictionary<string, string>
        {
            ["profile"] = profileTask.Result,
            ["preferences"] = preferencesTask.Result,
            ["analytics"] = analyticsTask.Result
        };
    }

    /// <summary>
    /// SYNC: Simulates calling multiple external APIs sequentially (BAD)
    /// </summary>
    public Dictionary<string, string> GetEnrichedDataSync(string userId)
    {
        // BAD: Sequential blocking calls - much slower than parallel
        Thread.Sleep(_random.Next(80, 150));
        var profile = $"Profile data for {userId}";

        Thread.Sleep(_random.Next(60, 120));
        var preferences = "Dark mode enabled";

        Thread.Sleep(_random.Next(90, 180));
        var analytics = "Last login: 2 hours ago";

        return new Dictionary<string, string>
        {
            ["profile"] = profile,
            ["preferences"] = preferences,
            ["analytics"] = analytics
        };
    }
}

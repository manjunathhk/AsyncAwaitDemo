using AsyncAwaitWebApi.Services;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<DatabaseService>();
builder.Services.AddSingleton<ExternalApiService>();
builder.Services.AddSingleton<MetricsService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

// Metrics endpoint
app.MapGet("/metrics", (MetricsService metricsService) =>
{
    return Results.Ok(metricsService.GetMetrics());
});

// Reset metrics endpoint
app.MapPost("/metrics/reset", (MetricsService metricsService) =>
{
    metricsService.Reset();
    return Results.Ok("Metrics reset");
});

Console.WriteLine("==============================================");
Console.WriteLine("Async/Await Demo API Started");
Console.WriteLine("==============================================");
Console.WriteLine("Swagger UI: http://localhost:5000/swagger");
Console.WriteLine("Metrics: http://localhost:5000/metrics");
Console.WriteLine();
Console.WriteLine("TEST ENDPOINTS:");
Console.WriteLine("  Async:  GET /api/async/users");
Console.WriteLine("  Sync:   GET /api/sync/users");
Console.WriteLine("  Async:  GET /api/async/orders");
Console.WriteLine("  Sync:   GET /api/sync/orders");
Console.WriteLine("==============================================");

app.Run("http://0.0.0.0:5000");

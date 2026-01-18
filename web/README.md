# Async/Await Performance Dashboard

A modern web UI for visualizing and comparing the performance of async vs sync/blocking implementations in C# and Node.js.

## Features

- Real-time performance testing of async and sync/blocking endpoints
- Visual comparison of throughput, response times, and success rates
- Support for both C# (.NET 10) and Node.js (LTS) APIs
- Configurable concurrent and total request counts
- Live server metrics display
- Responsive design that works on desktop and mobile

## Running Locally

### Prerequisites

Make sure either the C# or Node.js API server is running:

**C# API:**
```bash
cd ../CSharpDemo/AsyncAwaitWebApi
dotnet run
# Server runs at http://localhost:5000
```

**Node.js API:**
```bash
cd ../NodeDemo
npm install
npm run dev
# Server runs at http://localhost:3000
```

### Serve the Web UI

You can serve the static files using any web server. Here are a few options:

**Option 1: Python HTTP Server (Recommended - Auto Port Selection)**
```bash
cd web
python serve.py
# Automatically finds an available port and opens server
# Look for the URL in the console output
```

**Option 2: Python HTTP Server (Manual Port)**
```bash
cd web
python -m http.server 8000
# Open http://localhost:8000 in your browser
# If port 8000 is in use, try: 8001, 8081, 3001, 5500, etc.
```

**Option 3: Node.js http-server**
```bash
npm install -g http-server
cd web
http-server -p 8000
# Open http://localhost:8000 in your browser
```

**Option 4: VS Code Live Server**
- Install the "Live Server" extension in VS Code
- Right-click on `index.html` and select "Open with Live Server"

**Option 5: Just Open the HTML File**
- You can also just double-click `index.html` to open in your browser
- Note: Some features may not work due to CORS restrictions with file:// protocol

## Using the Dashboard

1. **Select API**: Choose between C# or Node.js API
2. **Configure Test Parameters**:
   - Concurrent Requests: Number of simultaneous requests
   - Total Requests: Total number of requests to send
3. **Run Tests**:
   - **Test Async Endpoints**: Test only async implementations
   - **Test Sync/Blocking Endpoints**: Test only sync/blocking implementations
   - **Test Both**: Compare both implementations side-by-side
4. **View Results**:
   - Throughput (requests/second)
   - Average Response Time
   - P95 Response Time (95th percentile)
   - Success Rate
5. **Fetch Server Metrics**: View detailed metrics from the running API server
6. **Reset Metrics**: Clear server-side metrics and UI display

## Deploying to Azure Static Web Apps

### Using Azure Portal

1. **Create a Static Web App**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

2. **Configure the Static Web App**:
   - Subscription: Select your subscription
   - Resource Group: Create new or use existing
   - Name: Choose a unique name (e.g., `async-await-demo`)
   - Plan type: Free
   - Region: Choose closest to you
   - Source: GitHub
   - Organization: Your GitHub username
   - Repository: `AsyncAwaitDemo` (or your fork)
   - Branch: `main`
   - Build Presets: Custom
   - App location: `/web`
   - Api location: (leave empty)
   - Output location: (leave empty)

3. **Deploy**:
   - Click "Review + create"
   - Click "Create"
   - Azure will automatically create a GitHub Actions workflow
   - The site will be deployed automatically

4. **Get Your URL**:
   - Once deployment completes, go to your Static Web App resource
   - Find the URL (e.g., `https://happy-forest-123456.azurestaticapps.net`)

### Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name AsyncAwaitDemo-rg --location eastus

# Create static web app
az staticwebapp create \
  --name async-await-demo \
  --resource-group AsyncAwaitDemo-rg \
  --source https://github.com/YOUR_USERNAME/AsyncAwaitDemo \
  --location eastus \
  --branch main \
  --app-location "/web" \
  --login-with-github

# Get the deployment URL
az staticwebapp show \
  --name async-await-demo \
  --resource-group AsyncAwaitDemo-rg \
  --query "defaultHostname" \
  --output tsv
```

### Manual GitHub Actions Setup

If you prefer to set up GitHub Actions manually:

1. **Get Deployment Token**:
   - Go to your Static Web App in Azure Portal
   - Click "Manage deployment token"
   - Copy the token

2. **Add Secret to GitHub**:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Paste the deployment token
   - Click "Add secret"

3. **Workflow File**:
   - The workflow file is already created at `.github/workflows/azure-static-web-apps.yml`
   - Push your changes to trigger deployment

## CORS Configuration

When testing against local APIs from the deployed Azure Static Web App, you may encounter CORS issues. To resolve:

### C# API (Program.cs)

Add CORS policy:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// After var app = builder.Build();
app.UseCors("AllowAll");
```

### Node.js API

Install and configure CORS:

```bash
npm install cors
```

In your `index.ts` or `index.js`:

```javascript
import cors from 'cors';

app.use(cors());
```

## Architecture

```
web/
├── index.html              # Main dashboard page
├── assets/
│   ├── css/
│   │   └── styles.css     # Styles and responsive design
│   └── js/
│       └── app.js         # Test runner and UI logic
├── staticwebapp.config.json  # Azure Static Web Apps configuration
└── README.md              # This file
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Deployment**: Azure Static Web Apps
- **CI/CD**: GitHub Actions
- **APIs Tested**:
  - C# ASP.NET Core (.NET 10, C# 14)
  - Node.js with TypeScript (Node 22 LTS)

## Performance Tips

- **Start with smaller test sizes** to ensure your API is responding
- **Increase gradually** to see how performance degrades under load
- **Compare async vs sync** with the same parameters for fair comparison
- **Watch for timeout errors** which indicate server overload
- **Monitor server logs** while tests are running

## Troubleshooting

**Issue**: "Failed to fetch metrics"
- **Solution**: Ensure the API server is running and CORS is configured

**Issue**: "Network error" during tests
- **Solution**: Check that the correct API endpoint is selected and accessible

**Issue**: "Low success rate"
- **Solution**: Reduce concurrent requests or total requests

**Issue**: "Azure deployment failed"
- **Solution**: Check GitHub Actions logs and ensure `AZURE_STATIC_WEB_APPS_API_TOKEN` secret is set

## Learn More

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Async/Await Best Practices](https://docs.microsoft.com/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming)

#!/usr/bin/env python3
import http.server
import socketserver
import sys

# Try multiple ports until we find one that's available
ports_to_try = [8000, 8081, 8082, 3001, 5500, 9000]

for port in ports_to_try:
    try:
        Handler = http.server.SimpleHTTPRequestHandler
        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"✓ Server started successfully!")
            print(f"✓ Open http://localhost:{port} in your browser")
            print(f"✓ Press Ctrl+C to stop the server")
            httpd.serve_forever()
        break
    except OSError as e:
        if e.errno == 10013 or e.errno == 48:  # Port in use or permission denied
            print(f"✗ Port {port} is not available, trying next port...")
            continue
        else:
            print(f"Error: {e}")
            sys.exit(1)
else:
    print("✗ Could not find an available port. Please close other applications and try again.")
    sys.exit(1)

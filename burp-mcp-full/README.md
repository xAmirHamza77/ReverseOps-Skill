# BurpSuite MCP Full Control Extension

Full control of all BurpSuite core features via MCP protocol. Cross-platform support for Windows / Linux (Kali) / macOS.

## Quick Start

### 1. Build the Extension

**Windows**:
```cmd
cd burp-mcp-full
build.bat
```

**Linux / Kali / macOS**:
```bash
cd burp-mcp-full
chmod +x build.sh
./build.sh
```

The build script automatically: detects JDK 21+, downloads dependencies (montoya-api 2025.5 / gson / nanohttpd), compiles, includes the extension descriptor (`META-INF/extensions/burp-extension.properties`) in the jar, and packages a fat jar. No Gradle required.

Output: `build/libs/burp-mcp-full.jar`.

### 2. Load into Burp

```
Burp Suite → Extensions → Add → Java → Select build/libs/burp-mcp-full.jar
```

After loading, you should see in Output:
```
[MCP] Server started on http://127.0.0.1:9876
```

### 3. Authentication (enabled by default since v2)

The extension automatically generates a random token on startup and writes it to `~/.burp-mcp-token`. `mcp-bridge.js` will automatically read this file and include the `Authorization: Bearer <token>` header with each request — no manual configuration needed.

When a fixed token is needed (e.g., sharing across multiple clients), use:
- JVM parameter：`-Dburp.mcp.token=<token>`
- environment变量：`BURP_MCP_TOKEN=<token>`（同时用于 bridge 侧）

All `/health`, `/tools`, `/` (POST) requests require this header, otherwise 403 is returned. CORS has been restricted to only allow `http://127.0.0.1` origin.

### 4. Configure MCP Client

Add in any MCP client (Claude Code / Kiro / Cursor / Cline / Windsurf) in stdio mode:

```json
{
  "mcpServers": {
    "burpsuite": {
      "command": "node",
      "args": ["<this-directory-path>/mcp-bridge.js"]
    }
  }
}
```

### 5. Start Using

Tell the AI: "Analyze the requests in Burp proxy history and find security vulnerabilities"

## Feature List

The extension exposes 78 tools. Common categories are listed below (see `src/main/java/com/burpmcp/McpHttpServer.java` `getToolList()` for the full list, or visit `GET http://127.0.0.1:9876/tools` with the Authorization header):

| Category | Tools |
|------|------|
| Proxy History | `proxy_history`, `proxy_detail`, `proxy_history_filtered`, `proxy_websocket`, `proxy_clear`, `search_history`, `highlight`, `annotate`, `compare` |
| Send Request | `send_request`, `send_to_repeater`, `repeater_send`, `repeater_modify_send`, `send_to_intruder` |
| Intruder Attack | `intruder_attack`, `intruder_attack_async`, `intruder_attack_wordlist`, `intruder_pitchfork`, `intruder_cluster_bomb`, `intruder_battering_ram`, `intruder_with_options`, `payload_process` |
| Scan / Crawl | `scan`(主动/被动), `scan_active`, `scan_results`, `scan_issue_detail`, `crawl`, `sequencer` |
| Scope / Sitemap | `sitemap`, `target_info`, `get_scope`, `add_to_scope`, `remove_from_scope`, `add_issue` |
| Intercept / Rules | `intercept_toggle`, `register_http_handler`, `remove_http_handler`, `register_proxy_rule`, `remove_proxy_rule` |
| Encode/Decode | `encode`, `decode`, `convert_request`, `export_request`, `generate_csrf_poc`, `extract_from_response`, `token_analysis` |
| Collaborator | `collaborator_generate`, `collaborator_poll` |
| Configuration | `export_config`, `import_config`, `set_upstream_proxy`, `set_dns_override`, `set_http2`, `cookie_jar`, `save_project`, `burp_version`, `extensions_list`, `log` |

> Scan/crawl (`scan`, `scan_active`, `crawl`) requires **Burp Professional**. Community edition returns a clear license error. Manually added issues (`add_issue`) are written to the Site map.

## Key Tool Parameters

### `intruder_attack` — Automated Enumeration Attack

| Parameter | Description |
|------|------|
| `url_template` | URL template, placeholder defaults to `@@` |
| `placeholder` | Placeholder string (default `@@`) |
| `from` / `to` | Enumeration start/end values |
| `pad_digits` | Zero-padding digits (0 = no padding) |
| `method` | HTTP method (default GET) |
| `body_template` | Request body template (with placeholder) |
| `headers` | Request headers object |
| `success_length_not` | Match condition: response length ≠ this value |
| `success_contains` | Match condition: response body contains this string |

### `scan` — Start Audit

| Parameter | Description |
|------|------|
| `url` | Target URL (required, auto-added to scope) |
| `mode` | `active` (default) or `passive` |

After starting, use `scan_results` to poll issues and active audit status (request count, errors, insertion points).

### `register_proxy_rule` — Proxy Request Interception Rule

| Parameter | Description |
|------|------|
| `url_contains` | Match condition: URL contains this string |
| `intercept` | `true` intercept / `false` pass through (default true) |

Use `remove_proxy_rule` to deregister rules (based on `Registration.deregister()`, truly unloaded from Burp).

## Usage Examples

### View Proxy History
```json
POST http://127.0.0.1:9876
{"tool": "proxy_history", "params": {"limit": 10, "url_filter": "personalblog"}}
```

### Send Request
```json
POST http://127.0.0.1:9876
{"tool": "send_request", "params": {"method": "GET", "url": "https://example.com/api/test"}}
```

### Automated Enumeration Attack (Core Feature)
```json
POST http://127.0.0.1:9876
{
  "tool": "intruder_attack",
  "params": {
    "url_template": "https://target.com/api/verify?code=@@",
    "method": "POST",
    "from": 0,
    "to": 999999,
    "pad_digits": 6,
    "success_length_not": 176,
    "headers": {"User-Agent": "Mozilla/5.0"}
  }
}
```

### Toggle Intercept
```json
POST http://127.0.0.1:9876
{"tool": "intercept_toggle", "params": {"enable": false}}
```

## Port Configuration

Listens on `127.0.0.1:9876` by default. To change (e.g., port conflict with the official PortSwigger MCP extension):

1. **Burp side**: Pass JVM parameter `-Dburp.mcp.port=9877` when starting Burp, or set environment variable `BURP_MCP_PORT=9877`.
2. **Bridge side**: Set environment variables `BURP_MCP_PORT=9877` and `BURP_MCP_HOST=127.0.0.1` in the MCP client configuration.

Ports must match on both sides. If Burp is not running or the port is unreachable, the bridge will return clear connection error guidance in `tools/list` and `tools/call`.

## Troubleshooting

| Symptom | Solution |
|------|------|
| Burp Output missing "[MCP] Server started" | Port occupied or extension load failed, check Burp Errors panel |
| MCP client reports "Burp MCP not connected" | Confirm Burp is running and extension is loaded; confirm ports match on both sides |
| Scan returns "requires Burp Professional" | Normal, Community edition does not support Scanner API |
| `remove_http_handler` / `remove_proxy_rule` not working | Confirm previous `register_*` returned success=true |

## Source Build (Gradle Optional)

```bash
cd burp-mcp-full
gradle jar      # Requires Gradle 8.7+ installed locally
# Output: build/libs/burp-mcp-full.jar
```

> Recommended to use `build.bat` / `build.sh` (zero dependencies, auto-downloads jars). Gradle path is an alternative only.

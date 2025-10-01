# AutoReach Pro Desktop App - User Guide

## Installation

### System Requirements

- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04+, CentOS 7+, or equivalent

### Download and Install

1. **Download**: Visit the [Releases page](https://github.com/kodirov8788/autoreachpro-desktop/releases)
2. **Choose your platform**:

   - Windows: `AutoReachPro-1.0.0.exe`
   - macOS: `AutoReachPro-1.0.0.dmg`
   - Linux: `AutoReachPro-1.0.0.AppImage`

3. **Install**:
   - **Windows**: Run the `.exe` installer
   - **macOS**: Mount the `.dmg` and drag to Applications
   - **Linux**: Make executable and run: `chmod +x AutoReachPro-1.0.0.AppImage && ./AutoReachPro-1.0.0.AppImage`

## Getting Started

### First Launch

1. **Open the application** from your Applications folder or desktop
2. **Grant permissions** when prompted (required for web automation)
3. **Configure settings** in the Settings tab

### Basic Usage

#### 1. Connect to WebSocket Server

- The app automatically starts a WebSocket server on port 8080
- You can connect external clients to `ws://localhost:8080`

#### 2. Start Automation

- Enter the target website URL
- Fill in the form data
- Click "Start Automation"

#### 3. Monitor Progress

- Watch real-time progress updates
- View automation logs
- Stop automation if needed

## Interface Overview

### Main Window

```
┌─────────────────────────────────────────┐
│ AutoReach Pro Desktop                   │
├─────────────────────────────────────────┤
│ [URL Input] [Start] [Stop] [Settings]   │
├─────────────────────────────────────────┤
│ Form Data:                              │
│ Name: [________________]                │
│ Email: [_______________]                │
│ Phone: [_______________]                │
├─────────────────────────────────────────┤
│ Status: Ready                           │
│ Progress: [████████████████████] 100%   │
├─────────────────────────────────────────┤
│ Logs:                                   │
│ [12:00:00] Automation started           │
│ [12:00:05] Form filled successfully     │
│ [12:00:10] Automation completed         │
└─────────────────────────────────────────┘
```

### Menu Bar

- **File**: New, Open, Save, Exit
- **Edit**: Undo, Redo, Cut, Copy, Paste
- **View**: Zoom, Developer Tools, Full Screen
- **Automation**: Start, Stop, Pause, Resume
- **Help**: Documentation, About

## Configuration

### Settings Panel

#### General Settings

- **Language**: English, Japanese
- **Theme**: Light, Dark, System
- **Auto-start**: Start server on app launch
- **Notifications**: Enable/disable notifications

#### Automation Settings

- **Default Timeout**: 30 seconds
- **Headless Mode**: Run browser in background
- **User Agent**: Custom browser identification
- **Proxy Settings**: Configure proxy if needed

#### Security Settings

- **Enable Authentication**: Require token for connections
- **Allowed Origins**: Restrict connection sources
- **Log Level**: Debug, Info, Warning, Error

### Advanced Configuration

#### Custom Form Fields

```json
{
  "fields": [
    {
      "name": "custom_field",
      "type": "text",
      "required": true,
      "placeholder": "Enter custom value"
    }
  ]
}
```

#### Automation Rules

```json
{
  "rules": [
    {
      "condition": "url_contains",
      "value": "example.com",
      "action": "auto_fill"
    }
  ]
}
```

## WebSocket API Usage

### Connecting to the App

#### JavaScript Example

```javascript
const ws = new WebSocket("ws://localhost:8080");

ws.onopen = function () {
  console.log("Connected to AutoReach Pro");
};

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

// Start automation
ws.send(
  JSON.stringify({
    type: "command",
    command: "start-automation",
    data: {
      url: "https://example.com/form",
      formData: {
        name: "John Doe",
        email: "john@example.com",
      },
    },
  })
);
```

#### Python Example

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Status: {data['data']['status']}")

def on_open(ws):
    command = {
        "type": "command",
        "command": "start-automation",
        "data": {
            "url": "https://example.com/form",
            "formData": {
                "name": "Jane Doe",
                "email": "jane@example.com"
            }
        }
    }
    ws.send(json.dumps(command))

ws = websocket.WebSocketApp("ws://localhost:8080",
                          on_open=on_open,
                          on_message=on_message)
ws.run_forever()
```

### Available Commands

| Command            | Description             | Parameters                   |
| ------------------ | ----------------------- | ---------------------------- |
| `start-automation` | Begin form automation   | `url`, `formData`, `options` |
| `stop-automation`  | Stop current automation | `sessionId`                  |
| `get-status`       | Get automation status   | `sessionId`                  |
| `update-form-data` | Update form data        | `sessionId`, `formData`      |
| `get-forms`        | Get available forms     | `url`                        |

## Troubleshooting

### Common Issues

#### Application Won't Start

1. **Check system requirements**
2. **Run as administrator** (Windows)
3. **Check antivirus software** - may be blocking the app
4. **Reinstall the application**

#### WebSocket Connection Failed

1. **Check if port 8080 is available**:

   ```bash
   # Windows
   netstat -an | findstr :8080

   # macOS/Linux
   lsof -i :8080
   ```

2. **Try a different port** in settings
3. **Check firewall settings**

#### Automation Fails

1. **Verify website URL** is accessible
2. **Check form field names** match the website
3. **Increase timeout** in settings
4. **Disable headless mode** to see what's happening

#### Browser Issues

1. **Update Chrome/Chromium** to latest version
2. **Clear browser cache** and cookies
3. **Disable browser extensions** that might interfere
4. **Check if website blocks automation**

### Debug Mode

#### Enable Debug Logging

1. Open **Settings** → **Security**
2. Set **Log Level** to "Debug"
3. Restart the application
4. Check logs in the **Logs** panel

#### Developer Tools

- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

### Performance Issues

#### Slow Automation

1. **Reduce timeout values**
2. **Enable headless mode**
3. **Close unnecessary applications**
4. **Check internet connection speed**

#### High Memory Usage

1. **Restart the application** periodically
2. **Limit concurrent automations**
3. **Close unused browser tabs**
4. **Check for memory leaks** in logs

## Security Best Practices

### Network Security

- **Use HTTPS** for target websites
- **Enable authentication** for production use
- **Restrict allowed origins** to trusted domains
- **Use VPN** for sensitive operations

### Data Protection

- **Don't store sensitive data** in form templates
- **Use environment variables** for credentials
- **Clear logs** regularly
- **Enable encryption** for stored data

### Access Control

- **Limit WebSocket access** to localhost in production
- **Use strong authentication tokens**
- **Monitor connection attempts**
- **Implement rate limiting**

## Support

### Getting Help

- **Documentation**: Check this user guide and API documentation
- **GitHub Issues**: [Report bugs or request features](https://github.com/kodirov8788/autoreachpro-desktop/issues)
- **Discussions**: [Community support](https://github.com/kodirov8788/autoreachpro-desktop/discussions)

### Reporting Issues

When reporting issues, please include:

1. **Operating system** and version
2. **Application version**
3. **Steps to reproduce** the issue
4. **Error messages** or logs
5. **Screenshots** if applicable

### Feature Requests

For feature requests, please provide:

1. **Detailed description** of the feature
2. **Use case** and benefits
3. **Proposed implementation** (if you have ideas)
4. **Priority level** (low/medium/high)

## Updates

### Automatic Updates

- The app checks for updates on startup
- **Enable automatic updates** in Settings → General
- **Manual check**: Help → Check for Updates

### Manual Updates

1. **Download** latest version from GitHub Releases
2. **Backup** your configuration files
3. **Install** new version
4. **Restore** configuration if needed

### Version History

- **v1.0.0**: Initial release with basic automation features
- **Future versions**: Check GitHub Releases for changelog

---

**Need more help?** Visit our [GitHub repository](https://github.com/kodirov8788/autoreachpro-desktop) for the latest documentation and support.


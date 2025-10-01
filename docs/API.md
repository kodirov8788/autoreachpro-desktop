# AutoReach Pro Desktop App - API Documentation

## WebSocket API Reference

The AutoReach Pro Desktop App exposes a WebSocket API for real-time communication and control.

### Connection Details

- **URL**: `ws://localhost:8080`
- **Protocol**: WebSocket
- **Authentication**: Optional token-based authentication

### Message Format

All messages follow this JSON structure:

```json
{
  "type": "command|response|error",
  "command": "command-name",
  "data": {},
  "timestamp": "2025-01-10T12:00:00Z",
  "id": "unique-message-id"
}
```

### Commands

#### 1. Start Automation

```json
{
  "type": "command",
  "command": "start-automation",
  "data": {
    "url": "https://example.com/form",
    "formData": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "options": {
      "headless": false,
      "timeout": 30000
    }
  }
}
```

**Response:**

```json
{
  "type": "response",
  "command": "start-automation",
  "data": {
    "status": "started",
    "sessionId": "session-123",
    "message": "Automation started successfully"
  }
}
```

#### 2. Stop Automation

```json
{
  "type": "command",
  "command": "stop-automation",
  "data": {
    "sessionId": "session-123"
  }
}
```

#### 3. Get Status

```json
{
  "type": "command",
  "command": "get-status",
  "data": {
    "sessionId": "session-123"
  }
}
```

**Response:**

```json
{
  "type": "response",
  "command": "get-status",
  "data": {
    "status": "running|completed|error|stopped",
    "progress": 75,
    "currentStep": "Filling form fields",
    "message": "Processing step 3 of 4"
  }
}
```

#### 4. Update Form Data

```json
{
  "type": "command",
  "command": "update-form-data",
  "data": {
    "sessionId": "session-123",
    "formData": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

#### 5. Get Available Forms

```json
{
  "type": "command",
  "command": "get-forms",
  "data": {
    "url": "https://example.com"
  }
}
```

**Response:**

```json
{
  "type": "response",
  "command": "get-forms",
  "data": {
    "forms": [
      {
        "id": "contact-form",
        "fields": [
          {
            "name": "name",
            "type": "text",
            "required": true,
            "placeholder": "Enter your name"
          },
          {
            "name": "email",
            "type": "email",
            "required": true,
            "placeholder": "Enter your email"
          }
        ]
      }
    ]
  }
}
```

### Error Handling

All errors follow this format:

```json
{
  "type": "error",
  "command": "command-name",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `INVALID_COMMAND`: Unknown command received
- `INVALID_DATA`: Malformed request data
- `AUTHENTICATION_REQUIRED`: Authentication token missing or invalid
- `SESSION_NOT_FOUND`: Session ID does not exist
- `AUTOMATION_FAILED`: Automation process failed
- `TIMEOUT`: Operation timed out
- `BROWSER_ERROR`: Browser/Puppeteer error

### Event Streams

The API also supports event streaming for real-time updates:

#### Automation Events

```json
{
  "type": "event",
  "event": "automation-progress",
  "data": {
    "sessionId": "session-123",
    "progress": 50,
    "step": "Filling email field",
    "timestamp": "2025-01-10T12:00:00Z"
  }
}
```

#### Browser Events

```json
{
  "type": "event",
  "event": "browser-event",
  "data": {
    "type": "page-loaded|form-submitted|error",
    "url": "https://example.com",
    "timestamp": "2025-01-10T12:00:00Z"
  }
}
```

### Authentication

Optional authentication can be enabled by including a token in the connection:

```javascript
const ws = new WebSocket("ws://localhost:8080", {
  headers: {
    Authorization: "Bearer your-token-here",
  },
});
```

### Rate Limiting

- Maximum 100 requests per minute per connection
- Maximum 10 concurrent automation sessions
- Connection timeout: 5 minutes of inactivity

### Examples

#### JavaScript Client

```javascript
const ws = new WebSocket("ws://localhost:8080");

ws.onopen = function () {
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
};

ws.onmessage = function (event) {
  const message = JSON.parse(event.data);
  console.log("Received:", message);
};
```

#### Python Client

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

def on_open(ws):
    # Start automation
    command = {
        "type": "command",
        "command": "start-automation",
        "data": {
            "url": "https://example.com/form",
            "formData": {
                "name": "John Doe",
                "email": "john@example.com"
            }
        }
    }
    ws.send(json.dumps(command))

ws = websocket.WebSocketApp("ws://localhost:8080",
                          on_open=on_open,
                          on_message=on_message)
ws.run_forever()
```


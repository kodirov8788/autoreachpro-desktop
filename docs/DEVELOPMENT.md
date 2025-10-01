# AutoReach Pro Desktop App - Development Guide

## Getting Started

This guide covers the development setup, architecture, and contribution guidelines for the AutoReach Pro Desktop App.

## Architecture Overview

The application follows Electron's multi-process architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main Process  │    │ Renderer Process│    │   WebSocket     │
│                 │    │                 │    │    Server       │
│ • App lifecycle │◄──►│ • UI rendering  │◄──►│ • API handling  │
│ • Window mgmt   │    │ • User input    │    │ • Automation    │
│ • Security      │    │ • Event handling│    │ • Puppeteer     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Process Responsibilities

#### Main Process (`main.js`)
- Application lifecycle management
- Window creation and management
- Security and permissions
- IPC communication coordination

#### Renderer Process (`src/renderer/`)
- User interface rendering
- User input handling
- WebSocket client communication
- UI state management

#### WebSocket Server (`src/main/websocket-server.ts`)
- Real-time communication
- Command processing
- Automation orchestration
- Session management

## Development Setup

### Prerequisites
- Node.js 18+
- npm 8+
- Git

### Initial Setup
```bash
# Clone repository
git clone https://github.com/kodirov8788/autoreachpro-desktop.git
cd autoreachpro-desktop

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev
```

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode |
| `npm run dev:watch` | Development with TypeScript watch |
| `npm run build` | Build TypeScript and copy files |
| `npm run pack` | Package application |
| `npm run dist` | Create distributables |
| `npm test` | Run tests |

## Code Structure

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### File Organization

```
src/
├── main/                    # Main process files
│   ├── main.ts             # Application entry point
│   ├── preload.ts          # Preload script
│   ├── websocket-server.ts # WebSocket server
│   ├── puppeteer-handler.ts # Automation logic
│   └── security.ts         # Security utilities
├── renderer/               # Renderer process files
│   ├── index.html          # HTML template
│   └── renderer.js         # Renderer JavaScript
└── shared/                 # Shared utilities
    ├── types.ts            # TypeScript definitions
    └── constants.ts        # Application constants
```

## Security Considerations

### Preload Script Security
```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose only necessary APIs
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('message', (_, message) => callback(message));
  }
});
```

### Content Security Policy
```html
<!-- electron-ui.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

### Input Validation
```typescript
// Validate all user inputs
function validateFormData(data: any): FormData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid form data');
  }
  
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Name is required');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Valid email is required');
  }
  
  return data as FormData;
}
```

## Testing

### Test Structure
```
tests/
├── unit/                   # Unit tests
│   ├── websocket-server.test.ts
│   ├── puppeteer-handler.test.ts
│   └── security.test.ts
├── integration/           # Integration tests
│   ├── api.test.ts
│   └── automation.test.ts
└── e2e/                   # End-to-end tests
    └── app.test.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "websocket"

# Run with coverage
npm test -- --coverage
```

### Test Examples
```typescript
// tests/unit/websocket-server.test.ts
import { WebSocketServer } from '../../src/main/websocket-server';

describe('WebSocketServer', () => {
  let server: WebSocketServer;
  
  beforeEach(() => {
    server = new WebSocketServer(8080);
  });
  
  afterEach(() => {
    server.close();
  });
  
  it('should start automation', async () => {
    const result = await server.handleCommand('start-automation', {
      url: 'https://example.com',
      formData: { name: 'Test' }
    });
    
    expect(result.status).toBe('started');
  });
});
```

## Building and Distribution

### Build Process
1. **TypeScript Compilation**: Convert TS to JS
2. **File Copying**: Copy renderer files to dist/
3. **Asset Preparation**: Prepare icons and resources
4. **Packaging**: Create platform-specific packages

### Platform-Specific Builds

#### macOS
```bash
npm run dist -- --mac
# Creates: AutoReachPro-1.0.0.dmg
```

#### Windows
```bash
npm run dist -- --win
# Creates: AutoReachPro-1.0.0.exe
```

#### Linux
```bash
npm run dist -- --linux
# Creates: AutoReachPro-1.0.0.AppImage
```

### Code Signing (macOS)
```bash
# Set environment variables
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

# Build signed version
npm run dist -- --mac --publish=never
```

## Debugging

### Main Process Debugging
```bash
# Enable debug logging
DEBUG=electron:* npm run dev

# Use Chrome DevTools
npm run dev -- --inspect=9229
```

### Renderer Process Debugging
- Use Chrome DevTools (Cmd+Option+I on macOS)
- Enable "Show Developer Tools" in app menu

### WebSocket Debugging
```typescript
// Enable WebSocket logging
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => console.log('Message:', event.data);
ws.onerror = (error) => console.error('WebSocket error:', error);
```

## Performance Optimization

### Memory Management
```typescript
// Clean up resources
class PuppeteerHandler {
  private browser: Browser | null = null;
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

### Bundle Size Optimization
```json
// package.json
{
  "build": {
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "!node_modules/**/test/**",
      "!node_modules/**/tests/**",
      "!node_modules/**/*.md"
    ]
  }
}
```

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write comprehensive tests

### Commit Messages
```
feat: add new automation command
fix: resolve WebSocket connection issue
docs: update API documentation
test: add unit tests for security module
```

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit pull request

### Code Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Cross-platform compatibility verified

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist/ *.tsbuildinfo
npm run build
```

#### WebSocket Connection Issues
```bash
# Check if port is available
lsof -i :8080

# Test WebSocket connection
wscat -c ws://localhost:8080
```

#### Puppeteer Issues
```bash
# Install Puppeteer dependencies
npm run postinstall

# Check Chrome installation
puppeteer.executablePath()
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Enable Puppeteer debugging
PUPPETEER_DEBUG=1 npm run dev
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Puppeteer Documentation](https://pptr.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

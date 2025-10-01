# AutoReach Pro Desktop App

A WebSocket-based desktop application for automated form filling and web interaction using Electron and Puppeteer. This application provides real-time control over web automation tasks through a secure desktop interface.

## 🚀 Features

- **WebSocket Communication**: Real-time bidirectional communication for instant control
- **Automated Form Filling**: Intelligent form automation using Puppeteer
- **Cross-Platform Support**: Windows, macOS, and Linux compatibility
- **Modern UI**: Clean, responsive Electron-based interface
- **Security**: Secure preload scripts and sandboxed execution
- **TypeScript Support**: Full type safety and modern development experience

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Git**: For version control

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kodirov8788/autoreachpro-desktop.git
cd autoreachpro-desktop
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Application

```bash
npm run build
```

### 4. Start the Application

```bash
npm start
```

## 🔧 Development

### Development Mode

```bash
# Run in development mode with hot reload
npm run dev

# Run with TypeScript compilation
npm run dev:watch
```

### Building for Production

```bash
# Build TypeScript and copy renderer files
npm run build

# Package for current platform
npm run pack

# Create distributables for all platforms
npm run dist
```

## 📁 Project Structure

```
desktop-app/
├── .gitignore              # Git exclusion rules
├── README.md               # This documentation
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── main.js                 # Main Electron process entry point
├── preload.js              # Preload script for security
├── electron-ui.html        # Main UI template
├── api-client.js           # WebSocket API client
├── icon.icns               # macOS application icon
├── logo-black.png          # Application logo
├── src/                    # TypeScript source files
│   ├── main/               # Main process files
│   │   ├── main.ts         # Main process entry
│   │   ├── preload.ts      # Preload script source
│   │   ├── puppeteer-handler.ts  # Puppeteer automation logic
│   │   ├── security.ts      # Security utilities
│   │   └── websocket-server.ts   # WebSocket server
│   ├── renderer/           # Renderer process files
│   │   ├── index.html      # Renderer HTML template
│   │   └── renderer.js     # Renderer JavaScript
│   └── shared/             # Shared utilities
├── public/                 # Static assets
│   └── downloads/          # Built application downloads
└── test-desktop-app.sh     # Test script
```

## 🔨 Build Configuration

The application uses **electron-builder** for packaging with the following targets:

- **macOS**: DMG format with code signing
- **Windows**: NSIS installer with Windows compatibility
- **Linux**: AppImage for universal Linux compatibility

### Build Scripts

- `npm run build`: Compile TypeScript and prepare files
- `npm run pack`: Create unpacked application
- `npm run dist`: Create distributables for all platforms

## 🌐 WebSocket API

The application exposes a WebSocket server for real-time communication:

### Connection

- **Port**: 8080 (configurable)
- **Protocol**: WebSocket
- **Authentication**: Token-based (optional)

### Available Commands

- `start-automation`: Begin form filling process
- `stop-automation`: Stop current automation
- `get-status`: Get current automation status
- `update-form-data`: Update form data in real-time

## 🔒 Security Features

- **Preload Scripts**: Secure context isolation
- **Content Security Policy**: XSS protection
- **Sandboxed Execution**: Limited system access
- **Input Validation**: All inputs are validated and sanitized

## 🧪 Testing

### Run Tests

```bash
# Run the test script
./test-desktop-app.sh

# Test specific components
npm test
```

### Test Coverage

The application includes comprehensive tests for:

- WebSocket communication
- Form automation logic
- Security features
- Cross-platform compatibility

## 📦 Distribution

### Creating Releases

1. Update version in `package.json`
2. Run `npm run dist` to build all platforms
3. Upload artifacts to GitHub Releases
4. Update documentation with new features

### Supported Platforms

- **Windows**: Windows 10/11 (x64)
- **macOS**: macOS 10.15+ (Intel and Apple Silicon)
- **Linux**: Ubuntu 18.04+, CentOS 7+, and other modern distributions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Ensure cross-platform compatibility

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/kodirov8788/autoreachpro-desktop/issues)
- **Documentation**: [Wiki](https://github.com/kodirov8788/autoreachpro-desktop/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/kodirov8788/autoreachpro-desktop/discussions)

## 🔄 Changelog

### Version 1.0.0

- Initial release
- WebSocket-based communication
- Cross-platform support
- Form automation capabilities
- Security features implementation

---

**Made with ❤️ by the AutoReach Pro Team**

# AutoReach Pro Desktop App

A WebSocket-based desktop application for automated form filling and web interaction using Electron and Puppeteer.

## Features

- WebSocket communication for real-time control
- Automated form filling using Puppeteer
- Cross-platform desktop application (Windows, macOS, Linux)
- Modern Electron-based UI

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run dist
```

## Project Structure

```
desktop-app/
├── main.js              # Main Electron process
├── preload.js           # Preload script for security
├── electron-ui.html     # Main UI template
├── src/                 # TypeScript source files
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── .gitignore          # Git ignore rules
```

## Build Configuration

The app uses electron-builder for packaging:
- macOS: DMG format
- Windows: NSIS installer
- Linux: AppImage

## License

MIT

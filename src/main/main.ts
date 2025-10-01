import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { WebSocketServer } from "./websocket-server";
import { PuppeteerHandler } from "./puppeteer-handler";
import { SecurityManager } from "./security";

class AutoReachDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private wsServer: WebSocketServer | null = null;
  private puppeteerHandler: PuppeteerHandler | null = null;
  private securityManager: SecurityManager;

  constructor() {
    this.securityManager = new SecurityManager();
    this.setupApp();
    this.setupIPC();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.initializeServices();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("before-quit", () => {
      this.cleanup();
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, "preload.js"),
      },
      title: "AutoReach Pro Desktop",
      show: false, // Don't show until ready
    });

    // Load the renderer HTML
    this.mainWindow.loadFile(join(__dirname, "../renderer/index.html"));

    // Show window when ready
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show();
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === "development") {
      this.mainWindow.webContents.openDevTools();
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize WebSocket server
      this.wsServer = new WebSocketServer(this.securityManager);
      await this.wsServer.start();

      // Initialize Puppeteer handler
      this.puppeteerHandler = new PuppeteerHandler();

      // Send server info to renderer
      if (this.mainWindow) {
        this.mainWindow.webContents.send("server-started", {
          port: this.wsServer.getPort(),
          status: "running",
        });
      }

      console.log("✅ AutoReach Desktop App initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize services:", error);
      this.showErrorDialog(
        "Initialization Error",
        "Failed to start desktop app services"
      );
    }
  }

  private setupIPC(): void {
    // Handle pairing code generation
    ipcMain.handle("generate-pairing-code", async () => {
      try {
        const code = this.securityManager.generatePairingCode();
        return { success: true, code };
      } catch (error) {
        console.error("Failed to generate pairing code:", error);
        return { success: false, error: "Failed to generate pairing code" };
      }
    });

    // Handle connection status requests
    ipcMain.handle("get-connection-status", async () => {
      if (!this.wsServer) {
        return { connected: false, port: 0 };
      }
      return {
        connected: this.wsServer.isConnected(),
        port: this.wsServer.getPort(),
        clients: this.wsServer.getClientCount(),
      };
    });

    // Handle manual disconnect
    ipcMain.handle("disconnect-clients", async () => {
      if (this.wsServer) {
        await this.wsServer.disconnectAll();
        return { success: true };
      }
      return { success: false, error: "No WebSocket server running" };
    });

    // Handle Puppeteer commands
    ipcMain.handle("execute-puppeteer-command", async (event, command) => {
      if (!this.puppeteerHandler) {
        return { success: false, error: "Puppeteer handler not initialized" };
      }

      try {
        const result = await this.puppeteerHandler.executeCommand(command);
        return { success: true, result };
      } catch (error) {
        console.error("Puppeteer command failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Handle connection logs requests
    ipcMain.handle("get-connection-logs", async () => {
      if (!this.wsServer) {
        return { success: false, error: "No WebSocket server running" };
      }
      return {
        success: true,
        logs: this.wsServer.getConnectionLogs(),
      };
    });

    // Handle recent connections requests
    ipcMain.handle("get-recent-connections", async (event, limit = 10) => {
      if (!this.wsServer) {
        return { success: false, error: "No WebSocket server running" };
      }
      return {
        success: true,
        connections: this.wsServer.getRecentConnections(limit),
      };
    });
  }

  private showErrorDialog(title: string, message: string): void {
    if (this.mainWindow) {
      dialog.showErrorBox(title, message);
    }
  }

  private async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up desktop app...");

    if (this.puppeteerHandler) {
      await this.puppeteerHandler.cleanup();
    }

    if (this.wsServer) {
      await this.wsServer.stop();
    }

    console.log("✅ Cleanup completed");
  }
}

// Start the application
new AutoReachDesktopApp();

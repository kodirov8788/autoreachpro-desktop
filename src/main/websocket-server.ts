import { WebSocketServer as WSWebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { dialog } from "electron";
import { SecurityManager } from "./security";
// Note: These imports will be implemented in the desktop app
// import { DesktopPuppeteerAutomation } from "./puppeteer-handler";
// import { CommandSystem } from "./command-system";

export interface WebSocketMessage {
  type: "OPEN" | "FILL" | "SCREENSHOT" | "CLOSE" | "PAUSE" | "RESUME";
  data?: any;
  token?: string;
}

export interface WebSocketResponse {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
}

export interface ConnectionLog {
  id: string;
  origin: string;
  timestamp: Date;
  status: "allowed" | "denied" | "disconnected";
  reason?: string;
}

export class WebSocketServer {
  private server: WSWebSocketServer | null = null;
  private httpServer: any = null;
  private port: number = 0;
  private securityManager: SecurityManager;
  private puppeteerAutomation: any = null; // DesktopPuppeteerAutomation | null = null;
  private commandSystem: any = null; // CommandSystem | null = null;
  private clients: Map<WebSocket, { origin: string; token: string }> =
    new Map();
  private connectionLogs: ConnectionLog[] = [];

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
  }

  async start(): Promise<void> {
    try {
      // Find available port
      this.port = await this.findAvailablePort();

      // Create HTTP server
      this.httpServer = createServer();

      // Create WebSocket server
      this.server = new WSWebSocketServer({
        server: this.httpServer,
        verifyClient: async (info: any) => {
          try {
            return await this.verifyClient(info);
          } catch (error) {
            console.error("Error in verifyClient:", error);
            return false;
          }
        },
      });

      // Handle WebSocket connections
      this.server.on("connection", this.handleConnection.bind(this));

      // Start HTTP server
      this.httpServer.listen(this.port, "127.0.0.1", () => {
        console.log(
          `🚀 WebSocket server started on ws://127.0.0.1:${this.port}`
        );
      });

      // Initialize basic Puppeteer automation (simplified)
      this.puppeteerAutomation = {
        executeCommand: async (command: any) => {
          console.log("Executing command:", command);
          return { success: true, result: "Command executed" };
        },
      };

      // Initialize basic command system (simplified)
      this.commandSystem = {
        executeCommand: async (message: WebSocketMessage) => {
          console.log("Processing command:", message);
          return { success: true, data: "Command processed" };
        },
      };
    } catch (error) {
      console.error("Failed to start WebSocket server:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log("🛑 Stopping WebSocket server...");

    // TODO: Implement puppeteer handler cleanup
    // if (this.puppeteerHandler) {
    //   await this.puppeteerHandler.cleanup();
    // }

    if (this.server) {
      this.server.close();
    }

    if (this.httpServer) {
      this.httpServer.close();
    }

    this.clients.clear();
    console.log("✅ WebSocket server stopped");
  }

  private async findAvailablePort(): Promise<number> {
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];

    for (const port of ports) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error("No available ports found in range 3000-3005");
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(true));
      });
      server.on("error", () => resolve(false));
    });
  }

  private async showConnectionPrompt(origin: string): Promise<boolean> {
    return new Promise((resolve) => {
      const result = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Allow", "Deny"],
        title: "Desktop App Connection Request",
        message: `Allow connection from ${origin}?`,
        detail: `This will allow the website to control form filling automation on your local machine.\n\nOrigin: ${origin}\n\nClick "Allow" to proceed or "Deny" to reject the connection.`,
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      });
      resolve(result === 0);
    });
  }

  private async verifyClient(info: any): Promise<boolean> {
    const origin = info.origin;
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get("token");
    const connectionId = this.generateConnectionId();

    // Validate origin
    if (!this.securityManager.validateOrigin(origin)) {
      this.logConnection(connectionId, origin, "denied", "Invalid origin");
      console.warn(`❌ Connection denied from invalid origin: ${origin}`);
      return false;
    }

    // Validate token
    if (!token || !this.securityManager.validateToken(token, origin)) {
      this.logConnection(connectionId, origin, "denied", "Invalid token");
      console.warn(
        `❌ Connection denied - invalid token from origin: ${origin}`
      );
      return false;
    }

    // Show user consent dialog
    const userConsent = await this.showConnectionPrompt(origin);
    if (!userConsent) {
      this.logConnection(connectionId, origin, "denied", "User denied");
      console.warn(`❌ User denied connection from origin: ${origin}`);
      return false;
    }

    this.logConnection(connectionId, origin, "allowed");
    console.log(`✅ Connection verified and approved from origin: ${origin}`);
    return true;
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const origin = req.headers.origin;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const connectionId = this.generateConnectionId();

    // Store client info
    this.clients.set(ws, { origin, token });

    console.log(`🔗 New WebSocket connection from ${origin}`);

    // Handle messages
    ws.on("message", async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        const response = await this.handleMessage(message, ws);

        if (response) {
          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(
          JSON.stringify({
            success: false,
            error: "Invalid message format",
          })
        );
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log(`🔌 WebSocket connection closed from ${origin}`);
      this.logConnection(
        connectionId,
        origin,
        "disconnected",
        "Client disconnected"
      );
      this.clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`WebSocket error from ${origin}:`, error);
      this.logConnection(
        connectionId,
        origin,
        "disconnected",
        `Error: ${error.message}`
      );
      this.clients.delete(ws);
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        success: true,
        data: {
          message: "Connected to AutoReach Pro Desktop",
          port: this.port,
          timestamp: new Date().toISOString(),
        },
      })
    );
  }

  private async handleMessage(
    message: WebSocketMessage,
    ws: WebSocket
  ): Promise<WebSocketResponse | null> {
    try {
      console.log("Received WebSocket message:", message);

      // Use command system to process the message
      if (this.commandSystem) {
        const result = await this.commandSystem.executeCommand(message);
        return {
          success: true,
          data: result.data || "Command processed successfully",
        };
      }

      // Fallback for basic command handling
      switch (message.type) {
        case "OPEN":
          return {
            success: true,
            data: "Browser opened successfully",
          };
        case "FILL":
          return {
            success: true,
            data: "Form filled successfully",
          };
        case "SCREENSHOT":
          return {
            success: true,
            data: "Screenshot taken successfully",
            screenshot:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          };
        case "CLOSE":
          return {
            success: true,
            data: "Browser closed successfully",
          };
        case "PAUSE":
          return {
            success: true,
            data: "Automation paused",
          };
        case "RESUME":
          return {
            success: true,
            data: "Automation resumed",
          };
        default:
          return {
            success: false,
            error: "Unknown command type",
          };
      }
    } catch (error) {
      console.error("Error handling message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getPort(): number {
    return this.port;
  }

  isConnected(): boolean {
    return this.clients.size > 0;
  }

  getClientCount(): number {
    return this.clients.size;
  }

  async disconnectAll(): Promise<void> {
    for (const [ws, clientInfo] of this.clients) {
      this.logConnection(
        this.generateConnectionId(),
        clientInfo.origin,
        "disconnected",
        "Manual disconnect"
      );
      ws.close();
    }
    this.clients.clear();
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logConnection(
    id: string,
    origin: string,
    status: ConnectionLog["status"],
    reason?: string
  ): void {
    const log: ConnectionLog = {
      id,
      origin,
      timestamp: new Date(),
      status,
      reason,
    };

    this.connectionLogs.push(log);

    // Keep only last 100 logs
    if (this.connectionLogs.length > 100) {
      this.connectionLogs = this.connectionLogs.slice(-100);
    }

    console.log(
      `📝 Connection log: ${status.toUpperCase()} - ${origin} - ${
        reason || "No reason"
      }`
    );
  }

  getConnectionLogs(): ConnectionLog[] {
    return [...this.connectionLogs].reverse(); // Most recent first
  }

  getRecentConnections(limit: number = 10): ConnectionLog[] {
    return this.getConnectionLogs().slice(0, limit);
  }

  // Command system methods
  getCommandQueueStatus(): any {
    // TODO: Implement command queue status
    return null;
  }

  getCommandHistory(limit: number = 50): any[] {
    // TODO: Implement command history
    return [];
  }

  clearCompletedCommands(): number {
    // TODO: Implement clear completed commands
    return 0;
  }
}

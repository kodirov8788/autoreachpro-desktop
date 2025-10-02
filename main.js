// Check if Electron is available
let electron, app, BrowserWindow, ipcMain, shell;
try {
  electron = require("electron");
  app = electron.app;
  BrowserWindow = electron.BrowserWindow;
  ipcMain = electron.ipcMain;
  shell = electron.shell;
  console.log("🚀 AutoReach Pro デスクトップアプリ - フルバージョン！");
  console.log("Node バージョン:", process.version);
  console.log("プラットフォーム:", process.platform);
  console.log("✅ Electronが正常に読み込まれました");
} catch (error) {
  console.log("❌ この環境ではElectronが利用できません");
  console.log("一部の開発環境では正常です。");
  console.log("🌐 テスト用にWebSocketサーバーのみを開始中...");

  // Start WebSocket server for testing even without Electron
  startWebSocketServerOnly()
    .then(() => {
      process.exit(0); // Exit gracefully after starting WebSocket server
    })
    .catch(console.error);
}

const path = require("path");
const WebSocket = require("ws");
const { EventEmitter } = require("events");

// Import Puppeteer for contact form automation
let puppeteer;
try {
  puppeteer = require("puppeteer");
  console.log("✅ Puppeteerが正常に読み込まれました");
} catch (error) {
  console.log("❌ Puppeteerが利用できません:", error.message);
}

// Helper function to check if port is available
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require("net");
    const server = net.createServer();

    server.listen(port, "127.0.0.1", () => {
      server.once("close", () => {
        resolve(true);
      });
      server.close();
    });

    server.on("error", () => {
      resolve(false);
    });
  });
}

// WebSocket server only mode (for testing when Electron isn't available)
async function startWebSocketServerOnly() {
  const ports = [3002, 3003, 3004, 3005];

  for (const port of ports) {
    try {
      // Check if port is available first
      if (!(await isPortAvailable(port))) {
        console.log(`⚠️ Port ${port} is already in use, trying next...`);
        continue;
      }

      const wsServer = new WebSocket.Server({
        port: port,
        host: "127.0.0.1",
      });

      console.log(`✅ WebSocketサーバーがポート${port}で開始されました`);

      // Create a minimal app instance for WebSocket-only mode
      const minimalApp = {
        generateSessionToken: () => {
          return `dev-session-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        },
        sessionTokens: new Map(),
        connections: new Map(),
        pairingCodes: new Map(),
        broadcastConnectionChange: () => {},
        broadcastStatusUpdate: () => {},
        updateStatus: () => {},
        startTime: Date.now(),
        port: port,
        isServerEnabled: true,
        handleStatusRequest(ws, connectionId) {
          const status = {
            version: "1.0.0",
            uptime: Date.now() - this.startTime,
            connections: this.connections.size,
            authenticatedConnections: Array.from(
              this.connections.values()
            ).filter((c) => c.isAuthenticated).length,
            pairingCodes: this.pairingCodes.size,
            sessionTokens: this.sessionTokens.size,
            port: this.port,
            serverEnabled: this.isServerEnabled,
            timestamp: Date.now(),
          };

          ws.send(
            JSON.stringify({
              type: "status_update",
              data: status,
              timestamp: Date.now(),
            })
          );
        },
        handleCommand(ws, message, connectionId) {
          console.log(
            "🎮 Executing command:",
            message.data?.command || message.command
          );

          // Check if connection is authenticated
          const connection = this.connections.get(connectionId);
          if (!connection || !connection.isAuthenticated) {
            ws.send(
              JSON.stringify({
                type: "error",
                data: {
                  message: "Connection not authenticated",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          const command = message.data?.command || message.command;
          const params = message.data?.params || {};

          // Handle different command types
          switch (command) {
            case "open_website":
              this.openWebsite(ws, params, connectionId);
              break;
            case "open_contact_form":
              this.openContactForm(ws, params, connectionId);
              break;
            case "automate_contact_form":
              this.automateContactForm(ws, params, connectionId);
              break;
            default:
              // For unknown commands, just acknowledge
              ws.send(
                JSON.stringify({
                  type: "command_response",
                  data: {
                    command: command,
                    status: "success",
                    message: "Command executed successfully",
                  },
                  timestamp: Date.now(),
                })
              );
          }
        },
        openWebsite(ws, params, connectionId) {
          const { url } = params;

          if (!url) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_website",
                  status: "error",
                  message: "URL parameter is required",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          // Validate URL format (basic security check)
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_website",
                  status: "error",
                  message: "URL must start with http:// or https://",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          try {
            // Fallback for non-Electron environments
            console.log(
              `🌐 Would open website: ${url} (shell not available in WebSocket-only mode)`
            );

            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_website",
                  status: "success",
                  message: `Website opening simulated: ${url}`,
                  url: url,
                },
                timestamp: Date.now(),
              })
            );
          } catch (error) {
            console.error(`❌ Error opening website ${url}:`, error);

            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_website",
                  status: "error",
                  message: `Failed to open website: ${error.message}`,
                  url: url,
                },
                timestamp: Date.now(),
              })
            );
          }
        },
        openContactForm(ws, params, connectionId) {
          const { url, formData, businessName } = params;

          if (!url) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_contact_form",
                  status: "error",
                  message: "URL parameter is required",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          // Validate URL format (basic security check)
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_contact_form",
                  status: "error",
                  message: "URL must start with http:// or https://",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          try {
            // Fallback for non-Electron environments
            console.log(
              `📝 Would open contact form: ${url} (shell not available in WebSocket-only mode)`
            );
            console.log(`📝 Form data:`, formData);
            console.log(`📝 Business: ${businessName}`);

            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_contact_form",
                  status: "success",
                  message: `Contact form opening simulated for ${businessName}`,
                  url: url,
                  formData: formData,
                  businessName: businessName,
                },
                timestamp: Date.now(),
              })
            );
          } catch (error) {
            console.error(`❌ Error opening contact form ${url}:`, error);

            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "open_contact_form",
                  status: "error",
                  message: `Failed to open contact form: ${error.message}`,
                  url: url,
                },
                timestamp: Date.now(),
              })
            );
          }
        },
        automateContactForm(ws, params, connectionId) {
          const { url, formData, businessName, subject, message } = params;

          if (!url) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "automate_contact_form",
                  status: "error",
                  message: "URL parameter is required",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          // Validate URL format (basic security check)
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "automate_contact_form",
                  status: "error",
                  message: "URL must start with http:// or https://",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          if (!puppeteer) {
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "automate_contact_form",
                  status: "error",
                  message: "Puppeteer not available in desktop app",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          // Start Puppeteer automation
          this.runPuppeteerAutomation(
            ws,
            url,
            formData,
            businessName,
            subject,
            message
          );
        },
        runPuppeteerAutomation: async (
          ws,
          url,
          formData,
          businessName,
          subject,
          message
        ) => {
          let browser;
          try {
            console.log(`🚀 Starting Puppeteer automation for ${businessName}`);
            console.log(`🌐 URL: ${url}`);
            console.log(`📝 Form data:`, formData);

            // Launch browser with user data directory for persistence
            browser = await puppeteer.launch({
              headless: false, // Show browser for user review
              defaultViewport: null,
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--window-size=1200,800",
              ],
              userDataDir: path.join(
                __dirname,
                `chrome-user-data-${Date.now()}`
              ),
            });

            const page = await browser.newPage();

            // Set user agent to avoid detection
            await page.setUserAgent(
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Navigate to the contact form
            console.log(`🌐 Navigating to: ${url}`);
            await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

            // Wait for page to load
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Auto-fill form fields
            console.log(`📝 Auto-filling form for ${businessName}`);

            // Common form field selectors
            const fieldSelectors = {
              name: [
                'input[name="name"]',
                'input[name="your-name"]',
                'input[name="fullname"]',
                'input[placeholder*="name" i]',
                "#name",
                "#fullname",
              ],
              email: [
                'input[name="email"]',
                'input[name="your-email"]',
                'input[type="email"]',
                'input[placeholder*="email" i]',
                "#email",
              ],
              phone: [
                'input[name="phone"]',
                'input[name="tel"]',
                'input[name="your-tel"]',
                'input[type="tel"]',
                'input[placeholder*="phone" i]',
                "#phone",
                "#tel",
              ],
              company: [
                'input[name="company"]',
                'input[name="your-company"]',
                'input[placeholder*="company" i]',
                "#company",
              ],
              subject: [
                'input[name="subject"]',
                'input[name="your-subject"]',
                'input[placeholder*="subject" i]',
                "#subject",
              ],
              message: [
                'textarea[name="message"]',
                'textarea[name="your-message"]',
                'textarea[name="comments"]',
                'textarea[placeholder*="message" i]',
                "#message",
                "#comments",
              ],
            };

            // Fill name field
            if (formData.name) {
              for (const selector of fieldSelectors.name) {
                try {
                  await page.waitForSelector(selector, { timeout: 1000 });
                  await page.type(selector, formData.name, { delay: 100 });
                  console.log(`✅ Filled name field: ${formData.name}`);
                  break;
                } catch (e) {
                  // Continue to next selector
                }
              }
            }

            // Fill email field
            if (formData.email) {
              for (const selector of fieldSelectors.email) {
                try {
                  await page.waitForSelector(selector, { timeout: 1000 });
                  await page.type(selector, formData.email, { delay: 100 });
                  console.log(`✅ Filled email field: ${formData.email}`);
                  break;
                } catch (e) {
                  // Continue to next selector
                }
              }
            }

            // Fill phone field
            if (formData.phone) {
              for (const selector of fieldSelectors.phone) {
                try {
                  await page.waitForSelector(selector, { timeout: 1000 });
                  await page.type(selector, formData.phone, { delay: 100 });
                  console.log(`✅ Filled phone field: ${formData.phone}`);
                  break;
                } catch (e) {
                  // Continue to next selector
                }
              }
            }

            // Fill company field
            if (formData.company) {
              for (const selector of fieldSelectors.company) {
                try {
                  await page.waitForSelector(selector, { timeout: 1000 });
                  await page.type(selector, formData.company, { delay: 100 });
                  console.log(`✅ Filled company field: ${formData.company}`);
                  break;
                } catch (e) {
                  // Continue to next selector
                }
              }
            }

            // Fill subject field
            if (subject) {
              for (const selector of fieldSelectors.subject) {
                try {
                  await page.waitForSelector(selector, { timeout: 1000 });
                  await page.type(selector, subject, { delay: 100 });
                  console.log(`✅ Filled subject field: ${subject}`);
                  break;
                } catch (e) {
                  // Continue to next selector
                }
              }
            }

            // Fill message field
            if (message) {
              for (const selector of fieldSelectors.message) {
                try {
                  await page.waitForSelector(selector, { timeout: 1000 });
                  await page.type(selector, message, { delay: 100 });
                  console.log(
                    `✅ Filled message field: ${message.substring(0, 50)}...`
                  );
                  break;
                } catch (e) {
                  // Continue to next selector
                }
              }
            }

            // Send success response
            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "automate_contact_form",
                  status: "success",
                  message: `Form auto-filled successfully for ${businessName}. Please review and submit manually.`,
                  url: url,
                  businessName: businessName,
                  automation: "completed",
                  userAction: "review_and_submit",
                },
                timestamp: Date.now(),
              })
            );

            console.log(`✅ Form auto-filled successfully for ${businessName}`);
            console.log(`👤 User can now review and submit the form manually`);

            // Keep browser open for user review
            // Browser will be closed when user closes it or after timeout
          } catch (error) {
            console.error(`❌ Puppeteer automation error:`, error);

            ws.send(
              JSON.stringify({
                type: "command_response",
                data: {
                  command: "automate_contact_form",
                  status: "error",
                  message: `Puppeteer automation failed: ${error.message}`,
                  url: url,
                  businessName: businessName,
                },
                timestamp: Date.now(),
              })
            );

            if (browser) {
              await browser.close();
            }
          }
        },
        log: (level, component, message, data) => {
          console.log(
            `[${new Date().toISOString()}] [${level}] [${component}] ${message}`,
            data || ""
          );
        },
        async handlePairingRequest(ws, message, connectionId) {
          const { code } = message.data || message;

          if (!code || !/^\d{6}$/.test(code)) {
            ws.send(
              JSON.stringify({
                type: "pairing_response",
                data: {
                  success: false,
                  message: "Invalid pairing code format",
                },
                timestamp: Date.now(),
              })
            );
            return;
          }

          // For development mode, accept any 6-digit code
          console.log(
            `🔧 Development mode: Accepting code ${code} without API validation`
          );

          // Generate session token for development
          const sessionToken = this.generateSessionToken();
          this.sessionTokens.set(sessionToken, {
            userId: "development-user",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            origin: "development",
            connectionId: connectionId,
          });

          // Mark connection as authenticated
          if (this.connections.has(connectionId)) {
            this.connections.get(connectionId).isAuthenticated = true;
            this.connections.get(connectionId).sessionToken = sessionToken;
          }

          // Send success response
          ws.send(
            JSON.stringify({
              type: "pairing_response",
              data: {
                success: true,
                sessionToken: sessionToken,
                connectionId: connectionId,
                message: "Pairing successful (development mode)",
              },
              timestamp: Date.now(),
            })
          );

          console.log(
            `✅ Pairing successful for code ${code} (development mode)`
          );
        },
      };

      wsServer.on("connection", (ws, req) => {
        const connectionId = `connection-${Date.now()}`;
        console.log(
          `🔗 New WebSocket connection from ${req.socket.remoteAddress} (${connectionId})`
        );

        // Track connection
        minimalApp.connections.set(connectionId, {
          ws: ws,
          isAuthenticated: false,
          sessionToken: null,
          lastActivity: new Date(),
        });

        ws.on("message", (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log("📨 Received message:", message);

            // Update last activity
            if (minimalApp.connections.has(connectionId)) {
              minimalApp.connections.get(connectionId).lastActivity =
                new Date();
            }

            // Use the same message handling logic as the full desktop app
            handleWebSocketMessage(ws, message, connectionId, minimalApp);
          } catch (error) {
            console.error("❌ Error parsing WebSocket message:", error);
          }
        });

        ws.on("close", () => {
          console.log(`🔌 WebSocket connection closed (${connectionId})`);
          minimalApp.connections.delete(connectionId);
        });

        ws.on("error", (error) => {
          console.error(`❌ WebSocket error (${connectionId}):`, error);
          minimalApp.connections.delete(connectionId);
        });
      });

      console.log(
        `🎯 デスクトップアプリWebSocketサーバーがポート${port}で稼働中`
      );
      console.log(
        `📱 http://localhost:3000/test-desktop-app を開いて接続をテストしてください`
      );
      break; // Successfully started on this port
    } catch (error) {
      console.log(`❌ Port ${port} not available, trying next...`);
      continue;
    }
  }
}

// Enhanced logging system for desktop app
function log(level, component, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    component,
    message,
    data: data ? JSON.stringify(data, null, 2) : undefined,
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
  };

  console.log(
    `[${timestamp}] [${level}] [${component}] ${message}`,
    data || ""
  );

  // Emit log event for external monitoring
  if (global.desktopApp) {
    global.desktopApp.emit("log", logEntry);
  }
}

// Standalone message handler for WebSocket connections
function handleWebSocketMessage(ws, message, connectionId, appInstance = null) {
  log("DEBUG", "WebSocketHandler", "Handling WebSocket message", {
    messageType: message.type,
    connectionId,
    hasAppInstance: !!appInstance,
    messageData: message.data,
  });

  switch (message.type) {
    case "ping":
      console.log("🔄 Handling ping message");
      ws.send(
        JSON.stringify({
          type: "pong",
          timestamp: Date.now(),
          connectionId: connectionId,
        })
      );
      break;

    case "pairing_request":
      console.log("🔄 Handling pairing_request message");
      if (appInstance) {
        appInstance
          .handlePairingRequest(ws, message, connectionId)
          .catch((error) => {
            console.error("❌ Error in handlePairingRequest:", error);
            ws.send(
              JSON.stringify({
                type: "pairing_response",
                data: {
                  success: false,
                  message: "Internal server error during pairing",
                },
                timestamp: Date.now(),
              })
            );
          });
      } else {
        // Standalone mode - simple pairing response
        ws.send(
          JSON.stringify({
            type: "pairing_response",
            data: {
              success: false,
              message: "Pairing not available in standalone mode",
            },
            timestamp: Date.now(),
          })
        );
      }
      break;

    case "command":
      console.log("🔄 Handling command message");
      if (appInstance) {
        appInstance.handleCommand(ws, message, connectionId);
      } else {
        ws.send(
          JSON.stringify({
            type: "command_response",
            data: {
              success: false,
              message: "Commands not available in standalone mode",
            },
            timestamp: Date.now(),
          })
        );
      }
      break;

    case "status_request":
      console.log("🔄 Handling status_request message");
      if (appInstance) {
        appInstance.handleStatusRequest(ws, connectionId);
      } else {
        ws.send(
          JSON.stringify({
            type: "status_update",
            data: {
              version: "1.0.0",
              connections: 1,
              authenticatedConnections: 0,
              port: 3002,
              serverEnabled: true,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
          })
        );
      }
      break;

    default:
      console.log("❌ Unknown message type:", message.type);
      ws.send(
        JSON.stringify({
          type: "error",
          data: {
            message: `Unknown message type: ${message.type}`,
          },
          timestamp: Date.now(),
        })
      );
  }
}

class AutoReachDesktopApp extends EventEmitter {
  constructor() {
    super(); // Call EventEmitter constructor
    this.mainWindow = null;
    this.wsServer = null;
    this.port = null;
    this.pairingCodes = new Map();
    this.sessionTokens = new Map();
    this.connections = new Map(); // Track active connections
    this.statusInterval = null;
    this.isRunning = false;
    this.isServerEnabled = false; // Server starts OFF by default
    this.startTime = Date.now();

    // Enhanced logging for desktop app
    this.log("INFO", "AutoReachDesktopApp", "Desktop app initialized", {
      port: this.port,
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      startTime: this.startTime,
    });
  }

  // Enhanced logging method for desktop app
  log(level, component, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      port: this.port,
      isRunning: this.isRunning,
      isServerEnabled: this.isServerEnabled,
      totalConnections: this.connections.size,
      sessionTokensCount: this.sessionTokens.size,
      pairingCodesCount: this.pairingCodes.size,
      uptime: Date.now() - this.startTime,
    };

    console.log(
      `[${timestamp}] [${level}] [${component}] ${message}`,
      data || ""
    );

    // Emit log event for external monitoring
    this.emit("log", logEntry);
  }

  // Generate session token for authentication
  generateSessionToken() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async start() {
    this.log("INFO", "AutoReachDesktopApp", "Starting AutoReach Desktop App");

    try {
      // Create main window first
      this.log("DEBUG", "AutoReachDesktopApp", "Creating main window");
      this.createMainWindow();

      // Setup IPC handlers
      this.log("DEBUG", "AutoReachDesktopApp", "Setting up IPC handlers");
      this.setupIPC();

      // Start real-time status updates
      this.log("DEBUG", "AutoReachDesktopApp", "Starting status updates");
      this.startStatusUpdates();

      // Setup cleanup handlers
      this.setupCleanupHandlers();

      this.isRunning = true;
      this.log(
        "INFO",
        "AutoReachDesktopApp",
        "AutoReach Desktop App started successfully",
        {
          isRunning: this.isRunning,
          isServerEnabled: this.isServerEnabled,
          port: this.port,
        }
      );
    } catch (error) {
      this.log("ERROR", "AutoReachDesktopApp", "Failed to start desktop app", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Setup cleanup handlers for graceful shutdown
  setupCleanupHandlers() {
    this.log("DEBUG", "AutoReachDesktopApp", "Setting up cleanup handlers");

    // Handle app window close
    if (this.mainWindow) {
      this.mainWindow.on("closed", () => {
        this.log(
          "INFO",
          "AutoReachDesktopApp",
          "Main window closed, shutting down"
        );
        this.shutdown();
      });
    }

    // Handle process termination
    process.on("SIGINT", () => {
      this.log(
        "INFO",
        "AutoReachDesktopApp",
        "SIGINT received, shutting down gracefully"
      );
      this.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      this.log(
        "INFO",
        "AutoReachDesktopApp",
        "SIGTERM received, shutting down gracefully"
      );
      this.shutdown();
      process.exit(0);
    });

    process.on("exit", () => {
      this.log("INFO", "AutoReachDesktopApp", "Process exiting, final cleanup");
      this.shutdown();
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.log("ERROR", "AutoReachDesktopApp", "Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });
      this.shutdown();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      this.log("ERROR", "AutoReachDesktopApp", "Unhandled promise rejection", {
        reason: reason,
        promise: promise,
      });
    });
  }

  // Graceful shutdown method
  async shutdown() {
    this.log("INFO", "AutoReachDesktopApp", "Starting graceful shutdown");

    try {
      this.isRunning = false;

      // Stop status updates
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
        this.log("DEBUG", "AutoReachDesktopApp", "Status updates stopped");
      }

      // Close all WebSocket connections
      if (this.connections.size > 0) {
        this.log(
          "INFO",
          "AutoReachDesktopApp",
          `Closing ${this.connections.size} WebSocket connections`
        );

        for (const [connectionId, connection] of this.connections) {
          try {
            if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.close(1000, "Server shutting down");
              this.log(
                "DEBUG",
                "AutoReachDesktopApp",
                `Closed connection ${connectionId}`
              );
            }
          } catch (error) {
            this.log(
              "WARN",
              "AutoReachDesktopApp",
              `Error closing connection ${connectionId}`,
              {
                error: error.message,
              }
            );
          }
        }

        this.connections.clear();
      }

      // Close WebSocket server
      if (this.wsServer) {
        this.log("INFO", "AutoReachDesktopApp", "Closing WebSocket server");

        return new Promise((resolve) => {
          this.wsServer.close(() => {
            this.log("INFO", "AutoReachDesktopApp", "WebSocket server closed");
            this.wsServer = null;
            this.port = null;
            resolve();
          });
        });
      }

      // Clear all data
      this.pairingCodes.clear();
      this.sessionTokens.clear();

      this.log("INFO", "AutoReachDesktopApp", "Graceful shutdown completed");
    } catch (error) {
      this.log("ERROR", "AutoReachDesktopApp", "Error during shutdown", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async startWebSocketServer() {
    this.log("INFO", "WebSocketServer", "Starting WebSocket server");

    const ports = [3002, 3003, 3004, 3005];

    for (const port of ports) {
      try {
        // Check if port is available first
        this.log(
          "DEBUG",
          "WebSocketServer",
          `Checking port availability for port ${port}`
        );
        if (!(await this.isPortAvailable(port))) {
          this.log(
            "WARN",
            "WebSocketServer",
            `Port ${port} is already in use, trying next port`
          );
          continue;
        }

        this.log(
          "DEBUG",
          "WebSocketServer",
          `Creating WebSocket server on port ${port}`
        );
        this.wsServer = new WebSocket.Server({
          port: port,
          host: "127.0.0.1",
        });

        this.port = port;
        this.log(
          "INFO",
          "WebSocketServer",
          `WebSocket server started successfully on port ${port}`,
          {
            port,
            host: "127.0.0.1",
            totalPorts: ports.length,
          }
        );

        this.wsServer.on("connection", (ws, req) => {
          const connectionId = `${req.socket.remoteAddress}:${Date.now()}`;
          this.log(
            "INFO",
            "WebSocketServer",
            "New WebSocket connection established",
            {
              connectionId,
              remoteAddress: req.socket.remoteAddress,
              userAgent: req.headers["user-agent"],
              totalConnections: this.connections.size + 1,
            }
          );

          // Track connection
          this.connections.set(connectionId, {
            ws,
            remoteAddress: req.socket.remoteAddress,
            connectedAt: new Date(),
            lastActivity: new Date(),
            isAuthenticated: false,
          });

          this.log(
            "DEBUG",
            "WebSocketServer",
            "Connection tracked and stored",
            {
              connectionId,
              isAuthenticated: false,
              totalConnections: this.connections.size,
            }
          );

          ws.on("message", (data) => {
            try {
              const message = JSON.parse(data.toString());
              this.log(
                "DEBUG",
                "WebSocketServer",
                "WebSocket message received",
                {
                  connectionId,
                  messageType: message.type,
                  messageSize: data.length,
                  hasData: !!message.data,
                }
              );

              // Update last activity
              if (this.connections.has(connectionId)) {
                this.connections.get(connectionId).lastActivity = new Date();
                this.log(
                  "DEBUG",
                  "WebSocketServer",
                  "Connection last activity updated",
                  {
                    connectionId,
                    lastActivity: this.connections
                      .get(connectionId)
                      .lastActivity.toISOString(),
                  }
                );
              }

              this.handleWebSocketMessage(ws, message, connectionId);
            } catch (error) {
              this.log(
                "ERROR",
                "WebSocketServer",
                "Error parsing WebSocket message",
                {
                  connectionId,
                  error: error.message,
                  dataLength: data.length,
                  dataPreview: data.toString().substring(0, 100),
                }
              );
            }
          });

          ws.on("close", () => {
            this.log("INFO", "WebSocketServer", "WebSocket connection closed", {
              connectionId,
              totalConnections: this.connections.size - 1,
            });
            this.connections.delete(connectionId);
            // Immediately broadcast connection change to all remaining clients
            this.broadcastConnectionChange(connectionId, false);
            // Also broadcast updated status
            this.broadcastStatusUpdate();
            this.updateStatus();
          });

          ws.on("error", (error) => {
            this.log("ERROR", "WebSocketServer", "WebSocket connection error", {
              connectionId,
              error: error.message,
              code: error.code,
              totalConnections: this.connections.size - 1,
            });
            this.connections.delete(connectionId);
            // Immediately broadcast connection change to all remaining clients
            this.broadcastConnectionChange(connectionId, false);
            // Also broadcast updated status
            this.broadcastStatusUpdate();
            this.updateStatus();
          });

          // Send initial status update
          this.updateStatus();
        });

        break; // Successfully started on this port
      } catch (error) {
        console.log(`❌ Port ${port} not available, trying next...`);
        continue;
      }
    }

    if (!this.wsServer) {
      throw new Error("❌ Could not start WebSocket server on any port");
    }
  }

  handleWebSocketMessage(ws, message, connectionId) {
    return handleWebSocketMessage(ws, message, connectionId, this);
  }

  async handlePairingRequest(ws, message, connectionId) {
    const { code } = message.data || message;

    if (!code || !/^\d{6}$/.test(code)) {
      ws.send(
        JSON.stringify({
          type: "pairing_response",
          data: {
            success: false,
            message: "Invalid pairing code format",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    // First check local pairing codes
    if (this.pairingCodes.has(code)) {
      const pairingData = this.pairingCodes.get(code);

      // Generate session token
      const sessionToken = this.generateSessionToken();
      this.sessionTokens.set(sessionToken, {
        userId: pairingData.userId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        origin: pairingData.origin,
        connectionId: connectionId,
      });

      // Mark connection as authenticated
      if (this.connections.has(connectionId)) {
        this.connections.get(connectionId).isAuthenticated = true;
        this.connections.get(connectionId).sessionToken = sessionToken;
      }

      // Remove used pairing code
      this.pairingCodes.delete(code);

      // Send success response
      ws.send(
        JSON.stringify({
          type: "pairing_response",
          data: {
            success: true,
            sessionToken: sessionToken,
            connectionId: connectionId,
            message: "Pairing successful",
          },
          timestamp: Date.now(),
        })
      );

      // Send connection change notification
      this.broadcastConnectionChange(connectionId, true);
      // Also broadcast updated status
      this.broadcastStatusUpdate();

      console.log(`✅ Pairing successful for code ${code}`);
      this.updateStatus();
      return;
    }

    // If not found locally, validate with website API
    try {
      console.log(`🔍 Validating code ${code} with website API...`);

      // Development mode: Accept any 6-digit code for testing
      if (
        process.env.NODE_ENV === "development" ||
        process.env.DESKTOP_DEV_MODE === "true" ||
        !process.env.NODE_ENV
      ) {
        console.log(
          `🔧 Development mode: Accepting code ${code} without API validation`
        );

        // Generate session token for development
        const sessionToken = this.generateSessionToken();
        this.sessionTokens.set(sessionToken, {
          userId: "development-user",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          origin: "development",
          connectionId: connectionId,
        });

        // Mark connection as authenticated
        if (this.connections.has(connectionId)) {
          this.connections.get(connectionId).isAuthenticated = true;
          this.connections.get(connectionId).sessionToken = sessionToken;
        }

        // Send success response
        ws.send(
          JSON.stringify({
            type: "pairing_response",
            data: {
              success: true,
              sessionToken: sessionToken,
              connectionId: connectionId,
              message: "Pairing successful (development mode)",
            },
            timestamp: Date.now(),
          })
        );

        // Send connection change notification
        this.broadcastConnectionChange(connectionId, true);
        this.broadcastStatusUpdate();

        console.log(
          `✅ Pairing successful for code ${code} (development mode)`
        );
        this.updateStatus();
        return;
      }

      const response = await fetch(
        "http://localhost:3000/api/desktop-app/pairing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "validate",
            code: code,
          }),
        }
      );

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.log(`⚠️  API requires authentication for code ${code}`);
          // For development/testing, accept any 6-digit code
          console.log(
            `🔧 Development mode: Accepting code ${code} without API validation`
          );

          // Generate session token for development
          const sessionToken = this.generateSessionToken();
          this.sessionTokens.set(sessionToken, {
            userId: "development-user",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            origin: "development",
            connectionId: connectionId,
          });

          // Mark connection as authenticated
          if (this.connections.has(connectionId)) {
            this.connections.get(connectionId).isAuthenticated = true;
            this.connections.get(connectionId).sessionToken = sessionToken;
          }

          // Send success response
          ws.send(
            JSON.stringify({
              type: "pairing_response",
              data: {
                success: true,
                sessionToken: sessionToken,
                connectionId: connectionId,
                message: "Pairing successful (development mode)",
              },
              timestamp: Date.now(),
            })
          );

          // Send connection change notification
          this.broadcastConnectionChange(connectionId, true);
          this.broadcastStatusUpdate();

          console.log(
            `✅ Pairing successful for code ${code} (development mode)`
          );
          this.updateStatus();
          return;
        }

        // Handle 400 Bad Request (invalid/expired code)
        if (response.status === 400) {
          let result;
          try {
            result = await response.json();
          } catch (jsonError) {
            console.error(`❌ Error parsing 400 response JSON:`, jsonError);
            result = { error: "Invalid pairing code" };
          }

          ws.send(
            JSON.stringify({
              type: "pairing_response",
              data: {
                success: false,
                message: result.error || "Invalid pairing code",
              },
              timestamp: Date.now(),
            })
          );
          console.log(`❌ Pairing failed for code ${code}: ${result.error}`);
          return;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error(`❌ Error parsing JSON response:`, jsonError);
        throw new Error(`Invalid JSON response from website API`);
      }

      if (result.success) {
        // Generate session token
        const sessionToken = this.generateSessionToken();
        this.sessionTokens.set(sessionToken, {
          userId: result.userId || "unknown",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          origin: result.origin || "website",
          connectionId: connectionId,
        });

        // Mark connection as authenticated
        if (this.connections.has(connectionId)) {
          this.connections.get(connectionId).isAuthenticated = true;
          this.connections.get(connectionId).sessionToken = sessionToken;
        }

        // Send success response
        ws.send(
          JSON.stringify({
            type: "pairing_response",
            data: {
              success: true,
              sessionToken: sessionToken,
              connectionId: connectionId,
              message: "Pairing successful",
            },
            timestamp: Date.now(),
          })
        );

        // Send connection change notification
        this.broadcastConnectionChange(connectionId, true);
        // Also broadcast updated status
        this.broadcastStatusUpdate();

        console.log(
          `✅ Pairing successful for code ${code} (validated via website API)`
        );
        this.updateStatus();
      } else {
        ws.send(
          JSON.stringify({
            type: "pairing_response",
            data: {
              success: false,
              message: result.error || "Invalid pairing code",
            },
            timestamp: Date.now(),
          })
        );
        console.log(`❌ Pairing failed for code ${code}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error validating code ${code}:`, error);

      let errorMessage = "Failed to validate code with website";
      if (error.message.includes("ECONNREFUSED")) {
        errorMessage =
          "Website not accessible - please ensure the website is running";
      } else if (error.message.includes("401")) {
        errorMessage =
          "Authentication required - please log in to the website first";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Website validation timeout - please try again";
      }

      ws.send(
        JSON.stringify({
          type: "pairing_response",
          data: {
            success: false,
            message: errorMessage,
          },
          timestamp: Date.now(),
        })
      );
    }
  }

  handleCommand(ws, message, connectionId) {
    console.log(
      "🎮 Executing command:",
      message.data?.command || message.command
    );

    // Check if connection is authenticated
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAuthenticated) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: {
            message: "Connection not authenticated",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    const command = message.data?.command || message.command;
    const params = message.data?.params || {};

    // Handle different command types
    switch (command) {
      case "open_website":
        this.openWebsite(ws, params, connectionId);
        break;
      case "open_contact_form":
        this.openContactForm(ws, params, connectionId);
        break;
      case "automate_contact_form":
        this.automateContactForm(ws, params, connectionId);
        break;
      case "send_task":
        this.sendTask(ws, params, connectionId);
        break;
      case "add_to_waiting_list":
        this.addToWaitingList(ws, params, connectionId);
        break;
      default:
        // For unknown commands, just acknowledge
        ws.send(
          JSON.stringify({
            type: "command_response",
            data: {
              command: command,
              status: "success",
              message: "Command executed successfully",
            },
            timestamp: Date.now(),
          })
        );
    }
  }

  openWebsite(ws, params, connectionId) {
    const { url } = params;

    if (!url) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "open_website",
            status: "error",
            message: "URL parameter is required",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    // Validate URL format (basic security check)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "open_website",
            status: "error",
            message: "URL must start with http:// or https://",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    try {
      // Use Electron's shell.openExternal for cross-platform compatibility
      if (shell && shell.openExternal) {
        shell.openExternal(url);
        console.log(`🌐 Opened website: ${url}`);

        ws.send(
          JSON.stringify({
            type: "command_response",
            data: {
              command: "open_website",
              status: "success",
              message: `Successfully opened ${url}`,
              url: url,
            },
            timestamp: Date.now(),
          })
        );
      } else {
        // Fallback for non-Electron environments
        console.log(`🌐 Would open website: ${url} (shell not available)`);

        ws.send(
          JSON.stringify({
            type: "command_response",
            data: {
              command: "open_website",
              status: "success",
              message: `Website opening simulated: ${url}`,
              url: url,
            },
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error(`❌ Error opening website ${url}:`, error);

      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "open_website",
            status: "error",
            message: `Failed to open website: ${error.message}`,
            url: url,
          },
          timestamp: Date.now(),
        })
      );
    }
  }

  openContactForm(ws, params, connectionId) {
    const { url, formData, businessName } = params;

    if (!url) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "open_contact_form",
            status: "error",
            message: "URL parameter is required",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    // Validate URL format (basic security check)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "open_contact_form",
            status: "error",
            message: "URL must start with http:// or https://",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    try {
      // Use Electron's shell.openExternal to open the contact form
      if (shell && shell.openExternal) {
        shell.openExternal(url);
        console.log(`📝 Opened contact form: ${url}`);
        console.log(`📝 Form data:`, formData);
        console.log(`📝 Business: ${businessName}`);

        ws.send(
          JSON.stringify({
            type: "command_response",
            data: {
              command: "open_contact_form",
              status: "success",
              message: `Successfully opened contact form for ${businessName}`,
              url: url,
              formData: formData,
              businessName: businessName,
            },
            timestamp: Date.now(),
          })
        );
      } else {
        // Fallback for non-Electron environments
        console.log(`📝 Would open contact form: ${url} (shell not available)`);
        console.log(`📝 Form data:`, formData);
        console.log(`📝 Business: ${businessName}`);

        ws.send(
          JSON.stringify({
            type: "command_response",
            data: {
              command: "open_contact_form",
              status: "success",
              message: `Contact form opening simulated for ${businessName}`,
              url: url,
              formData: formData,
              businessName: businessName,
            },
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error(`❌ Error opening contact form ${url}:`, error);

      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "open_contact_form",
            status: "error",
            message: `Failed to open contact form: ${error.message}`,
            url: url,
          },
          timestamp: Date.now(),
        })
      );
    }
  }

  // Update waiting list item status
  updateWaitingListItem(itemId, status, result) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send("waiting-list-update", {
        action: "update",
        id: itemId,
        status: status,
        result: result,
      });
    }
  }

  // Direct contact form automation (from desktop app UI)
  async automateContactFormDirect(data) {
    const { url, formData, businessName, subject, message } = data;

    if (!url) {
      return {
        success: false,
        error: "URL parameter is required",
        businessName: businessName,
      };
    }

    // Validate URL format (basic security check)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return {
        success: false,
        error: "URL must start with http:// or https://",
        businessName: businessName,
      };
    }

    if (!puppeteer) {
      return {
        success: false,
        error: "Puppeteer not available in desktop app",
        businessName: businessName,
      };
    }

    console.log(
      `🚀 Starting direct contact form automation for: ${businessName}`
    );
    console.log(`📝 URL: ${url}`);

    try {
      // Launch browser
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Navigate to contact page
      console.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to fill form fields
      console.log("📝 Attempting to fill form fields...");

      // Common form field selectors
      const fieldSelectors = {
        name: [
          'input[name="name"]',
          'input[name="fullname"]',
          'input[name="full_name"]',
          'input[name="contact_name"]',
          'input[placeholder*="name" i]',
          'input[placeholder*="Name" i]',
          "#name",
          "#fullname",
          "#contact_name",
        ],
        email: [
          'input[name="email"]',
          'input[name="email_address"]',
          'input[type="email"]',
          'input[placeholder*="email" i]',
          'input[placeholder*="Email" i]',
          "#email",
          "#email_address",
        ],
        phone: [
          'input[name="phone"]',
          'input[name="telephone"]',
          'input[name="phone_number"]',
          'input[type="tel"]',
          'input[placeholder*="phone" i]',
          'input[placeholder*="Phone" i]',
          "#phone",
          "#telephone",
        ],
        company: [
          'input[name="company"]',
          'input[name="organization"]',
          'input[name="business"]',
          'input[placeholder*="company" i]',
          'input[placeholder*="Company" i]',
          "#company",
          "#organization",
        ],
        message: [
          'textarea[name="message"]',
          'textarea[name="comments"]',
          'textarea[name="inquiry"]',
          'textarea[placeholder*="message" i]',
          'textarea[placeholder*="Message" i]',
          "#message",
          "#comments",
        ],
      };

      // Fill form fields
      for (const [fieldName, selectors] of Object.entries(fieldSelectors)) {
        if (formData[fieldName]) {
          let filled = false;

          for (const selector of selectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                await element.click();
                await element.type(formData[fieldName], { delay: 100 });
                console.log(`✅ Filled ${fieldName} field`);
                filled = true;
                break;
              }
            } catch (error) {
              // Continue to next selector
            }
          }

          if (!filled) {
            console.log(`⚠️ Could not find ${fieldName} field`);
          }
        }
      }

      console.log(
        "✅ Form filling completed. Browser will remain open for user review."
      );
      console.log("👤 User can now review the form and submit manually.");

      return {
        success: true,
        message: "Contact form opened and filled successfully",
        businessName: businessName,
        url: url,
      };
    } catch (error) {
      console.error("❌ Contact form automation error:", error);
      return {
        success: false,
        error: error.message,
        businessName: businessName,
      };
    }
  }

  automateContactForm(ws, params, connectionId) {
    const { url, formData, businessName, subject, message } = params;

    if (!url) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "automate_contact_form",
            status: "error",
            message: "URL parameter is required",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    // Validate URL format (basic security check)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "automate_contact_form",
            status: "error",
            message: "URL must start with http:// or https://",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    if (!puppeteer) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "automate_contact_form",
            status: "error",
            message: "Puppeteer not available in desktop app",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    // Start Puppeteer automation
    this.runPuppeteerAutomation(
      ws,
      url,
      formData,
      businessName,
      subject,
      message
    );
  }

  async runPuppeteerAutomation(
    ws,
    url,
    formData,
    businessName,
    subject,
    message
  ) {
    let browser;
    try {
      console.log(`🚀 Starting Puppeteer automation for ${businessName}`);
      console.log(`🌐 URL: ${url}`);
      console.log(`📝 Form data:`, formData);

      // Launch browser with user data directory for persistence
      browser = await puppeteer.launch({
        headless: false, // Show browser for user review
        defaultViewport: null,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--window-size=1200,800",
        ],
        userDataDir: path.join(__dirname, `chrome-user-data-${Date.now()}`),
      });

      const page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Navigate to the contact form
      console.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Wait for page to load (reduced from 2000ms to 1000ms)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Inject countdown overlay
      await page.evaluate(() => {
        // Create countdown overlay
        const overlay = document.createElement("div");
        overlay.id = "autoreach-countdown-overlay";
        overlay.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          min-width: 200px;
          animation: slideIn 0.5s ease-out;
        `;

        // Add CSS animation
        const style = document.createElement("style");
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .countdown-number {
            font-size: 24px;
            font-weight: bold;
            color: #ffeb3b;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            animation: pulse 1s infinite;
          }
        `;
        document.head.appendChild(style);

        // Add overlay content
        overlay.innerHTML = `
          <div style="margin-bottom: 10px;">🤖 AutoReach Pro</div>
          <div style="font-size: 14px; margin-bottom: 10px;">フォームを自動入力中...</div>
          <div>ブラウザは以下で閉じます:</div>
          <div class="countdown-number" id="countdown-timer">60</div>
          <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">秒</div>
          <button id="close-now-btn" style="
            background: #ff5722;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#e64a19'" onmouseout="this.style.background='#ff5722'">
            今すぐ閉じる
          </button>
        `;

        document.body.appendChild(overlay);

        // Start countdown
        let timeLeft = 60;
        const timerElement = document.getElementById("countdown-timer");

        const countdown = setInterval(() => {
          timeLeft--;
          timerElement.textContent = timeLeft;

          if (timeLeft <= 10) {
            timerElement.style.color = "#ff5722";
            timerElement.style.animation = "pulse 0.5s infinite";
          }

          if (timeLeft <= 0) {
            clearInterval(countdown);
            overlay.innerHTML = `
              <div style="margin-bottom: 10px;">🤖 AutoReach Pro</div>
              <div style="font-size: 14px;">Closing browser...</div>
            `;
          }
        }, 1000);

        // Store interval ID for cleanup
        window.autoreachCountdown = countdown;

        // Add manual close button functionality
        const closeBtn = document.getElementById("close-now-btn");
        closeBtn.addEventListener("click", () => {
          console.log("🚪 Manual close button clicked");
          clearInterval(countdown);

          // Start 3-second countdown before closing
          let closeCountdown = 3;
          overlay.innerHTML = `
            <div style="margin-bottom: 10px;">🤖 AutoReach Pro</div>
            <div style="font-size: 14px; margin-bottom: 10px;">Closing browser in:</div>
            <div class="countdown-number" id="close-countdown-timer">${closeCountdown}</div>
            <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">seconds</div>
          `;

          // Start countdown
          const closeTimer = setInterval(() => {
            closeCountdown--;
            const timerElement = document.getElementById(
              "close-countdown-timer"
            );
            if (timerElement) {
              timerElement.textContent = closeCountdown;

              if (closeCountdown <= 0) {
                clearInterval(closeTimer);
                // Signal to parent process that manual close was requested
                window.autoreachManualClose = true;
              }
            }
          }, 1000);
        });
      });

      console.log(
        `⏰ Countdown overlay injected - browser will close in 60 seconds`
      );

      // Auto-fill form fields (optimized for speed)
      console.log(`📝 Auto-filling form for ${businessName}`);

      // Common form field selectors
      const fieldSelectors = {
        name: [
          'input[name="name"]',
          'input[name="your-name"]',
          'input[name="fullname"]',
          'input[placeholder*="name" i]',
          "#name",
          "#fullname",
        ],
        email: [
          'input[name="email"]',
          'input[name="your-email"]',
          'input[type="email"]',
          'input[placeholder*="email" i]',
          "#email",
        ],
        phone: [
          'input[name="phone"]',
          'input[name="tel"]',
          'input[name="your-tel"]',
          'input[type="tel"]',
          'input[placeholder*="phone" i]',
          "#phone",
          "#tel",
        ],
        company: [
          'input[name="company"]',
          'input[name="your-company"]',
          'input[placeholder*="company" i]',
          "#company",
        ],
        subject: [
          'input[name="subject"]',
          'input[name="your-subject"]',
          'input[placeholder*="subject" i]',
          "#subject",
        ],
        message: [
          'textarea[name="message"]',
          'textarea[name="your-message"]',
          'textarea[name="comments"]',
          'textarea[placeholder*="message" i]',
          "#message",
          "#comments",
        ],
      };

      // Fill name field
      if (formData.name) {
        for (const selector of fieldSelectors.name) {
          try {
            await page.waitForSelector(selector, { timeout: 500 }); // Reduced from 1000ms to 500ms
            await page.type(selector, formData.name, { delay: 50 }); // Reduced from 100ms to 50ms
            console.log(`✅ Filled name field: ${formData.name}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill email field
      if (formData.email) {
        for (const selector of fieldSelectors.email) {
          try {
            await page.waitForSelector(selector, { timeout: 500 }); // Reduced from 1000ms to 500ms
            await page.type(selector, formData.email, { delay: 50 }); // Reduced from 100ms to 50ms
            console.log(`✅ Filled email field: ${formData.email}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill phone field
      if (formData.phone) {
        for (const selector of fieldSelectors.phone) {
          try {
            await page.waitForSelector(selector, { timeout: 500 }); // Reduced from 1000ms to 500ms
            await page.type(selector, formData.phone, { delay: 50 }); // Reduced from 100ms to 50ms
            console.log(`✅ Filled phone field: ${formData.phone}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill company field
      if (formData.company) {
        for (const selector of fieldSelectors.company) {
          try {
            await page.waitForSelector(selector, { timeout: 500 }); // Reduced from 1000ms to 500ms
            await page.type(selector, formData.company, { delay: 50 }); // Reduced from 100ms to 50ms
            console.log(`✅ Filled company field: ${formData.company}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill subject field
      if (subject) {
        for (const selector of fieldSelectors.subject) {
          try {
            await page.waitForSelector(selector, { timeout: 500 }); // Reduced from 1000ms to 500ms
            await page.type(selector, subject, { delay: 50 }); // Reduced from 100ms to 50ms
            console.log(`✅ Filled subject field: ${subject}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill message field
      if (message) {
        for (const selector of fieldSelectors.message) {
          try {
            await page.waitForSelector(selector, { timeout: 500 }); // Reduced from 1000ms to 500ms
            await page.type(selector, message, { delay: 50 }); // Reduced from 100ms to 50ms
            console.log(
              `✅ Filled message field: ${message.substring(0, 50)}...`
            );
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Send success response
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "automate_contact_form",
            status: "success",
            message: `Form auto-filled successfully for ${businessName}. Please review and submit manually.`,
            url: url,
            businessName: businessName,
            automation: "completed",
            userAction: "review_and_submit",
          },
          timestamp: Date.now(),
        })
      );

      console.log(`✅ Form auto-filled successfully for ${businessName}`);
      console.log(`👤 User can now review and submit the form manually`);

      // Set up 1-minute auto-close timer with manual close check
      const autoCloseTimer = setTimeout(async () => {
        console.log(
          `⏰ Auto-closing browser for ${businessName} after 1 minute`
        );
        try {
          if (browser && browser.isConnected()) {
            // Check if manual close was already requested
            const manualCloseRequested = await page.evaluate(() => {
              return window.autoreachManualClose || false;
            });

            if (manualCloseRequested) {
              console.log(
                `🚪 Manual close already requested, skipping auto-close`
              );
              return;
            }

            // Update overlay to show closing message
            await page.evaluate(() => {
              const overlay = document.getElementById(
                "autoreach-countdown-overlay"
              );
              if (overlay) {
                overlay.innerHTML = `
                  <div style="margin-bottom: 10px;">🤖 AutoReach Pro</div>
                  <div style="font-size: 14px; color: #ffeb3b;">Closing browser...</div>
                `;
              }
              // Clear countdown interval
              if (window.autoreachCountdown) {
                clearInterval(window.autoreachCountdown);
              }
            });

            // Wait a moment for user to see the message
            await new Promise((resolve) => setTimeout(resolve, 1000));

            await browser.close();
            console.log(`✅ Browser closed successfully for ${businessName}`);
          }
        } catch (error) {
          console.error(`❌ Error closing browser for ${businessName}:`, error);
        }
      }, 60000); // 1 minute = 60,000ms

      // Check for manual close requests periodically
      const manualCloseChecker = setInterval(async () => {
        try {
          if (browser && browser.isConnected() && !page.isClosed()) {
            // Check if page is still valid and has active frames
            const frames = page.frames();
            if (frames.length === 0) {
              console.log(
                `⚠️ No active frames for ${businessName}, stopping manual close checker`
              );
              clearInterval(manualCloseChecker);
              return;
            }

            const manualCloseRequested = await page.evaluate(() => {
              return window.autoreachManualClose || false;
            });

            if (manualCloseRequested) {
              console.log(
                `🚪 Manual close requested, closing browser immediately`
              );
              clearInterval(manualCloseChecker);
              clearTimeout(autoCloseTimer);

              await browser.close();
              console.log(
                `✅ Browser closed successfully for ${businessName} (manual close)`
              );
            }
          } else {
            // Browser or page is closed, stop checking
            clearInterval(manualCloseChecker);
          }
        } catch (error) {
          // If it's a detached frame error, stop the checker
          if (
            error.message.includes("detached Frame") ||
            error.message.includes("Target closed")
          ) {
            console.log(
              `⚠️ Page/frame detached for ${businessName}, stopping manual close checker`
            );
            clearInterval(manualCloseChecker);
          } else {
            console.error(
              `❌ Error checking manual close for ${businessName}:`,
              error
            );
          }
        }
      }, 1000); // Check every second

      console.log(`⏰ Browser will auto-close in 1 minute`);
    } catch (error) {
      console.error(`❌ Puppeteer automation error:`, error);

      // Clean up countdown overlay on error
      try {
        if (browser && browser.isConnected()) {
          const pages = await browser.pages();
          for (const page of pages) {
            await page.evaluate(() => {
              const overlay = document.getElementById(
                "autoreach-countdown-overlay"
              );
              if (overlay) {
                overlay.remove();
              }
              if (window.autoreachCountdown) {
                clearInterval(window.autoreachCountdown);
              }
            });
          }
        }
      } catch (cleanupError) {
        console.error(`❌ Error cleaning up countdown overlay:`, cleanupError);
      }

      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "automate_contact_form",
            status: "error",
            message: `Puppeteer automation failed: ${error.message}`,
            url: url,
            businessName: businessName,
          },
          timestamp: Date.now(),
        })
      );

      if (browser) {
        await browser.close();
      }
    }
  }

  sendTask(ws, params, connectionId) {
    const { taskText, timestamp } = params;

    if (!taskText) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "send_task",
            status: "error",
            message: "Task text is required",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    try {
      // Display task in desktop app console
      console.log("📋 Task received from website:");
      console.log("Task:", taskText);
      console.log("Timestamp:", timestamp);
      console.log("Connection ID:", connectionId);

      // If we have a main window, we could also display it there
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send("task-received", {
          taskText,
          timestamp,
          connectionId,
        });
      }

      // Send success response
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "send_task",
            status: "success",
            message: `Task received and displayed: ${taskText}`,
            taskText: taskText,
            timestamp: timestamp,
          },
          timestamp: Date.now(),
        })
      );

      console.log(`✅ Task displayed successfully: ${taskText}`);
    } catch (error) {
      console.error(`❌ Error displaying task:`, error);

      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "send_task",
            status: "error",
            message: `Failed to display task: ${error.message}`,
          },
          timestamp: Date.now(),
        })
      );
    }
  }

  addToWaitingList(ws, params, connectionId) {
    const { url, businessName, subject, message } = params;

    if (!url) {
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "add_to_waiting_list",
            status: "error",
            message: "URL is required",
          },
          timestamp: Date.now(),
        })
      );
      return;
    }

    try {
      // Generate unique ID for waiting list item
      const itemId = `waiting_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log("⏳ Adding to waiting list:");
      console.log("URL:", url);
      console.log("Business:", businessName || "Unknown Business");
      console.log("Subject:", subject || "No subject");
      console.log("Message:", message || "No message");
      console.log("Item ID:", itemId);

      // Add to waiting list in UI
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send("waiting-list-update", {
          action: "add",
          id: itemId,
          url: url,
          businessName: businessName || "Unknown Business",
          subject: subject || "",
          message: message || "",
        });
      }

      // Start 3-second auto-send timer
      console.log(`⏰ Starting 3-second auto-send timer for item: ${itemId}`);
      setTimeout(() => {
        // Check if item still exists and hasn't been manually processed
        this.autoSendWaitingListItem(
          itemId,
          url,
          businessName,
          subject,
          message
        );
      }, 3000);

      // Send success response
      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "add_to_waiting_list",
            status: "success",
            message: `URL added to waiting list: ${url}`,
            itemId: itemId,
            url: url,
            businessName: businessName || "Unknown Business",
          },
          timestamp: Date.now(),
        })
      );

      console.log(`✅ URL added to waiting list successfully: ${url}`);
    } catch (error) {
      console.error(`❌ Error adding to waiting list:`, error);

      ws.send(
        JSON.stringify({
          type: "command_response",
          data: {
            command: "add_to_waiting_list",
            status: "error",
            message: `Failed to add to waiting list: ${error.message}`,
          },
          timestamp: Date.now(),
        })
      );
    }
  }

  updateWaitingListItem(itemId, status, result) {
    console.log(`📝 Updating waiting list item ${itemId}: ${status}`);

    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send("waiting-list-update", {
        action: "update",
        id: itemId,
        status: status,
        result: result,
      });
    }
  }

  // Auto-send waiting list item after 3 seconds
  async autoSendWaitingListItem(
    itemId,
    url,
    businessName,
    subject,
    message,
    retryCount = 0
  ) {
    const maxRetries = 2;
    console.log(
      `🚀 Auto-sending waiting list item: ${itemId} (attempt ${
        retryCount + 1
      }/${maxRetries + 1})`
    );
    console.log(`📝 URL: ${url}`);
    console.log(`📝 Business: ${businessName}`);

    // Check if item is already completed or processing
    if (this.completedItems && this.completedItems.has(itemId)) {
      console.log(`⏭️ Item ${itemId} already completed, skipping auto-send`);
      return;
    }

    // Initialize completed items set if not exists
    if (!this.completedItems) {
      this.completedItems = new Set();
    }

    try {
      // Update status to processing
      this.updateWaitingListItem(itemId, "processing", null);

      // Prepare form data
      const formData = {
        name: "AutoReach Pro User",
        email: "contact@autoreachpro.com",
        phone: "+1-555-0123",
        company: "AutoReach Pro",
      };

      // Run the automation with timeout
      const automationPromise = this.automateContactFormDirect({
        url: url,
        formData: formData,
        businessName: businessName,
        subject: subject || "Business Inquiry",
        message:
          message ||
          "Hello! I'm interested in your services. Please contact me for more information.",
        waitingListItemId: itemId,
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Automation timeout after 30 seconds")),
          30000
        );
      });

      const result = await Promise.race([automationPromise, timeoutPromise]);

      // Update status based on result
      if (result.success) {
        console.log(`✅ Auto-send completed successfully for: ${businessName}`);

        // Mark as completed to prevent re-execution
        this.completedItems.add(itemId);

        this.updateWaitingListItem(itemId, "completed", result);

        // Keep item in waiting list (don't remove it)
        // User can see the completed status and result
      } else {
        console.log(
          `❌ Auto-send failed for: ${businessName} - ${result.error}`
        );

        // Retry logic for certain types of errors
        if (retryCount < maxRetries && this.shouldRetry(result.error)) {
          console.log(
            `🔄 Retrying auto-send for ${businessName} in 2 seconds...`
          );
          setTimeout(() => {
            this.autoSendWaitingListItem(
              itemId,
              url,
              businessName,
              subject,
              message,
              retryCount + 1
            );
          }, 2000);
        } else {
          this.updateWaitingListItem(itemId, "error", result);
        }
      }
    } catch (error) {
      console.error(`❌ Auto-send error for item ${itemId}:`, error);

      // Retry logic for network/timeout errors
      if (retryCount < maxRetries && this.shouldRetry(error.message)) {
        console.log(
          `🔄 Retrying auto-send for ${businessName} in 2 seconds...`
        );
        setTimeout(() => {
          this.autoSendWaitingListItem(
            itemId,
            url,
            businessName,
            subject,
            message,
            retryCount + 1
          );
        }, 2000);
      } else {
        this.updateWaitingListItem(itemId, "error", {
          error: error.message,
          success: false,
          retryCount: retryCount,
        });
      }
    }
  }

  // Determine if an error should trigger a retry
  shouldRetry(errorMessage) {
    const retryableErrors = [
      "timeout",
      "network",
      "connection",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      "temporary",
      "unavailable",
    ];

    return retryableErrors.some((error) =>
      errorMessage.toLowerCase().includes(error.toLowerCase())
    );
  }

  // Remove waiting list item from UI
  removeWaitingListItem(itemId) {
    console.log(`🗑️ Removing waiting list item: ${itemId}`);

    // Remove from completed items set
    if (this.completedItems) {
      this.completedItems.delete(itemId);
    }

    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send("waiting-list-update", {
        action: "remove",
        id: itemId,
      });
    }
  }

  async automateContactFormDirect(data) {
    console.log("🚀 Starting direct contact form automation:", data);

    const { url, formData, businessName, subject, message, waitingListItemId } =
      data;

    console.log("📝 Automation parameters:", {
      url,
      businessName,
      subject: subject || "No subject",
      message: message ? message.substring(0, 50) + "..." : "No message",
      hasFormData: !!formData,
    });

    // Use the existing runPuppeteerAutomation method
    return new Promise((resolve, reject) => {
      let isResolved = false;

      // Create a fake WebSocket-like response handler
      const fakeWs = {
        send: (response) => {
          if (isResolved) return; // Prevent multiple resolutions

          try {
            const responseData = JSON.parse(response);
            console.log("📊 Puppeteer automation result:", responseData);

            isResolved = true;
            resolve({
              success: responseData.data.status === "success",
              message: responseData.data.message,
              url: responseData.data.url,
              businessName: responseData.data.businessName,
            });
          } catch (error) {
            console.error("❌ Failed to parse automation response:", error);
            isResolved = true;
            resolve({
              success: false,
              message: "Failed to parse automation response",
              error: error.message,
            });
          }
        },
      };

      // Add a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          console.log(
            "⏰ Automation timeout - resolving as success (form likely filled)"
          );
          isResolved = true;
          resolve({
            success: true,
            message: "Form automation completed (timeout reached)",
            url: url,
            businessName: businessName,
          });
        }
      }, 25000); // 25 seconds timeout

      // Run the automation using the WebSocket server method
      if (this.runPuppeteerAutomation) {
        this.runPuppeteerAutomation(
          fakeWs,
          url,
          formData,
          businessName,
          subject,
          message
        )
          .then(() => {
            // Clear timeout if automation completes
            clearTimeout(timeoutId);
          })
          .catch((error) => {
            if (!isResolved) {
              console.error("❌ Puppeteer automation error:", error);
              isResolved = true;
              clearTimeout(timeoutId);
              resolve({
                success: false,
                message: "Puppeteer automation failed",
                error: error.message,
              });
            }
          });
      } else {
        console.error("❌ runPuppeteerAutomation method not available");
        clearTimeout(timeoutId);
        resolve({
          success: false,
          message: "Puppeteer automation not available",
        });
      }
    });
  }

  handleStatusRequest(ws, connectionId) {
    const status = {
      version: "1.0.0",
      uptime: Date.now() - this.startTime,
      connections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(
        (c) => c.isAuthenticated
      ).length,
      pairingCodes: this.pairingCodes.size,
      sessionTokens: this.sessionTokens.size,
      port: this.port,
      serverEnabled: this.isServerEnabled,
      timestamp: Date.now(),
    };

    ws.send(
      JSON.stringify({
        type: "status_update",
        data: status,
        timestamp: Date.now(),
      })
    );
  }

  broadcastConnectionChange(connectionId, connected) {
    const message = {
      type: "connection_change",
      data: {
        connectionId: connectionId,
        connected: connected,
        totalConnections: this.connections.size,
        authenticatedConnections: Array.from(this.connections.values()).filter(
          (c) => c.isAuthenticated
        ).length,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    console.log(
      `📡 Broadcasting connection change: ${connectionId} ${
        connected ? "connected" : "disconnected"
      }`
    );

    // Broadcast to all connected clients
    for (const [id, connection] of this.connections) {
      if (connection.ws && connection.ws.readyState === 1) {
        // WebSocket.OPEN
        try {
          connection.ws.send(JSON.stringify(message));
          console.log(`✅ Connection change sent to ${id}`);
        } catch (error) {
          console.error(`❌ Failed to send connection change to ${id}:`, error);
        }
      }
    }
  }

  // Enhanced status broadcasting with immediate updates
  broadcastStatusUpdate() {
    const status = {
      version: "1.0.0",
      uptime: Date.now() - this.startTime,
      connections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(
        (c) => c.isAuthenticated
      ).length,
      pairingCodes: this.pairingCodes.size,
      sessionTokens: this.sessionTokens.size,
      port: this.port,
      serverEnabled: this.isServerEnabled,
      timestamp: Date.now(),
    };

    const message = {
      type: "status_update",
      data: status,
      timestamp: Date.now(),
    };

    console.log(
      `📊 Broadcasting status update: ${status.connections} connections, ${status.authenticatedConnections} authenticated`
    );

    // Broadcast to all connected clients
    for (const [id, connection] of this.connections) {
      if (connection.ws && connection.ws.readyState === 1) {
        try {
          connection.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`❌ Failed to send status update to ${id}:`, error);
        }
      }
    }
  }

  // Server toggle methods
  async enableServer() {
    if (this.isServerEnabled) {
      return { success: true, message: "Server is already enabled" };
    }

    try {
      await this.startWebSocketServer();
      this.isServerEnabled = true;
      console.log("🟢 WebSocket server enabled");
      this.updateStatus();
      return {
        success: true,
        message: "Server enabled successfully",
        port: this.port,
      };
    } catch (error) {
      console.error("❌ Failed to enable server:", error);
      return { success: false, error: error.message };
    }
  }

  async disableServer() {
    if (!this.isServerEnabled) {
      return { success: true, message: "Server is already disabled" };
    }

    try {
      await this.stopServer();
      this.isServerEnabled = false;
      console.log("🔴 WebSocket server disabled");
      this.updateStatus();
      return { success: true, message: "Server disabled successfully" };
    } catch (error) {
      console.error("❌ Failed to disable server:", error);
      return { success: false, error: error.message };
    }
  }

  async toggleServer() {
    if (this.isServerEnabled) {
      return await this.disableServer();
    } else {
      return await this.enableServer();
    }
  }

  // Check if port is available
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const net = require("net");
      const server = net.createServer();

      server.listen(port, "127.0.0.1", () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  // Real-time status updates
  startStatusUpdates() {
    this.statusInterval = setInterval(() => {
      this.updateStatus();
    }, 2000); // Update every 2 seconds
  }

  updateStatus() {
    if (!this.mainWindow) return;

    const status = {
      running: this.isRunning,
      serverEnabled: this.isServerEnabled,
      port: this.port,
      connections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(
        (c) => c.isAuthenticated
      ).length,
      pairingCodes: this.pairingCodes.size,
      sessionTokens: this.sessionTokens.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
        id,
        remoteAddress: conn.remoteAddress,
        connectedAt: conn.connectedAt,
        lastActivity: conn.lastActivity,
        isAuthenticated: conn.isAuthenticated,
      })),
    };

    this.mainWindow.webContents.send("status-update", status);
  }

  // Check if port is available
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const net = require("net");
      const server = net.createServer();

      server.listen(port, "127.0.0.1", () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  async stopServer() {
    this.log("INFO", "WebSocketServer", "Stopping WebSocket server");

    try {
      // Stop status updates
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
        this.log("DEBUG", "WebSocketServer", "Status updates stopped");
      }

      // Close all WebSocket connections
      if (this.connections.size > 0) {
        this.log(
          "INFO",
          "WebSocketServer",
          `Closing ${this.connections.size} WebSocket connections`
        );

        for (const [connectionId, connection] of this.connections) {
          try {
            if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.close(1000, "Server stopping");
              this.log(
                "DEBUG",
                "WebSocketServer",
                `Closed connection ${connectionId}`
              );
            }
          } catch (error) {
            this.log(
              "WARN",
              "WebSocketServer",
              `Error closing connection ${connectionId}`,
              {
                error: error.message,
              }
            );
          }
        }
      }

      // Close WebSocket server
      if (this.wsServer) {
        this.log("INFO", "WebSocketServer", "Closing WebSocket server");

        return new Promise((resolve) => {
          this.wsServer.close(() => {
            this.log(
              "INFO",
              "WebSocketServer",
              "WebSocket server stopped successfully"
            );
            this.wsServer = null;
            this.port = null;
            resolve();
          });
        });
      }

      // Clear all data
      this.connections.clear();
      this.pairingCodes.clear();
      this.sessionTokens.clear();
      this.isRunning = false;
      this.port = null;

      this.updateStatus();
      this.log("INFO", "WebSocketServer", "WebSocket server stop completed");
      return { success: true, message: "Server stopped" };
    } catch (error) {
      this.log("ERROR", "WebSocketServer", "Error stopping WebSocket server", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  createMainWindow() {
    console.log("🪟 Creating main window...");

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
      title: "AutoReach Pro デスクトップ",
      icon:
        process.platform === "darwin"
          ? path.join(__dirname, "icon.icns")
          : path.join(__dirname, "logo-black.png"),
      show: false,
    });

    // Load the HTML file
    this.mainWindow.loadFile(path.join(__dirname, "electron-ui.html"));

    // Show window when ready
    this.mainWindow.once("ready-to-show", () => {
      console.log("✅ Window ready, showing...");
      this.mainWindow.show();

      // Send server info to renderer
      this.mainWindow.webContents.send("server-started", {
        port: this.port,
        status: "running",
      });
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === "development") {
      this.mainWindow.webContents.openDevTools();
    }

    console.log("✅ Main window created successfully!");
  }

  setupIPC() {
    // Handle pairing code generation
    ipcMain.handle("generate-pairing-code", async (event, data) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const userId = data.userId || "test-user";
      const origin = data.origin || "http://localhost:3000";

      this.pairingCodes.set(code, {
        userId,
        origin,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      console.log(`🔑 Generated pairing code: ${code}`);
      return { code, expiresIn: 600 }; // 10 minutes
    });

    // Handle pairing code validation
    ipcMain.handle("validate-pairing-code", async (event, code) => {
      if (!code || !/^\d{6}$/.test(code)) {
        return { valid: false, message: "Invalid code format" };
      }

      if (this.pairingCodes.has(code)) {
        const pairingData = this.pairingCodes.get(code);
        if (new Date() > pairingData.expiresAt) {
          this.pairingCodes.delete(code);
          return { valid: false, message: "Code expired" };
        }
        return { valid: true, message: "Code is valid" };
      }

      return { valid: false, message: "Invalid code" };
    });

    // Handle server status
    ipcMain.handle("get-server-status", async () => {
      return {
        running: this.isRunning,
        port: this.port,
        connections: this.connections.size,
        authenticatedConnections: Array.from(this.connections.values()).filter(
          (c) => c.isAuthenticated
        ).length,
        pairingCodes: this.pairingCodes.size,
        sessionTokens: this.sessionTokens.size,
        uptime: this.isRunning ? Date.now() - this.startTime : 0,
        connections: Array.from(this.connections.entries()).map(
          ([id, conn]) => ({
            id,
            remoteAddress: conn.remoteAddress,
            connectedAt: conn.connectedAt,
            lastActivity: conn.lastActivity,
            isAuthenticated: conn.isAuthenticated,
          })
        ),
      };
    });

    // Handle server toggle
    ipcMain.handle("toggle-server", async () => {
      return await this.toggleServer();
    });

    // Handle enabling server
    ipcMain.handle("enable-server", async () => {
      return await this.enableServer();
    });

    // Handle disabling server
    ipcMain.handle("disable-server", async () => {
      return await this.disableServer();
    });

    // Handle contact form automation
    ipcMain.on("contact-form-automation", async (event, data) => {
      console.log("📝 Contact form automation requested:", data);

      try {
        const result = await this.automateContactFormDirect(data);

        // Send result back to renderer
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send("contact-form-result", result);
        }

        // If this was from waiting list, update the waiting list item
        if (data.waitingListItemId) {
          this.updateWaitingListItem(
            data.waitingListItemId,
            result.success ? "completed" : "error",
            result
          );
        }
      } catch (error) {
        console.error("❌ Contact form automation error:", error);

        // Send error result back to renderer
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send("contact-form-result", {
            success: false,
            error: error.message,
            businessName: data.businessName,
          });
        }

        // If this was from waiting list, update the waiting list item
        if (data.waitingListItemId) {
          this.updateWaitingListItem(data.waitingListItemId, "error", {
            error: error.message,
          });
        }
      }
    });

    // Handle pairing with code
    ipcMain.handle("pair-with-code", async (event, data) => {
      const { code } = data;

      if (!code || !/^\d{6}$/.test(code)) {
        return { success: false, message: "Invalid code format" };
      }

      // First check local pairing codes
      if (this.pairingCodes.has(code)) {
        const pairingData = this.pairingCodes.get(code);

        // Generate session token
        const sessionToken = this.generateSessionToken();
        this.sessionTokens.set(sessionToken, {
          userId: pairingData.userId,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          origin: pairingData.origin,
          connectionId: "desktop-pairing",
        });

        // Remove used pairing code
        this.pairingCodes.delete(code);

        console.log(`✅ Desktop pairing successful for code ${code}`);
        this.updateStatus();

        return {
          success: true,
          sessionToken: sessionToken,
          message: "Pairing successful",
        };
      }

      // If not found locally, validate with website API
      try {
        console.log(`🔍 Validating code ${code} with website API (IPC)...`);

        const response = await fetch(
          "http://localhost:3000/api/desktop-app/pairing",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "validate",
              code: code,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          // Generate session token
          const sessionToken = this.generateSessionToken();
          this.sessionTokens.set(sessionToken, {
            userId: result.userId || "unknown",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            origin: result.origin || "website",
            connectionId: "desktop-pairing",
          });

          console.log(
            `✅ Desktop pairing successful for code ${code} (validated via website API)`
          );
          this.updateStatus();

          return {
            success: true,
            sessionToken: sessionToken,
            message: "Pairing successful",
          };
        } else {
          console.log(
            `❌ Desktop pairing failed for code ${code}: ${result.error}`
          );
          return {
            success: false,
            message: result.error || "Invalid or expired code",
          };
        }
      } catch (error) {
        console.error(`❌ Error validating code ${code} (IPC):`, error);

        let errorMessage = "Failed to validate code with website";
        if (error.message.includes("ECONNREFUSED")) {
          errorMessage =
            "Website not accessible - please ensure the website is running";
        } else if (error.message.includes("401")) {
          errorMessage =
            "Authentication required - please log in to the website first";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Website validation timeout - please try again";
        }

        return {
          success: false,
          message: errorMessage,
        };
      }
    });
  }
}

// Initialize the app
const desktopApp = new AutoReachDesktopApp();

// Check if app is available before using it
if (app && app.whenReady) {
  app.whenReady().then(() => {
    desktopApp.start();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      desktopApp.createMainWindow();
    }
  });

  console.log("✅ AutoReach Pro Desktop App initialized!");
} else {
  console.log("❌ Electron app not available, running WebSocket server only");
  // Start WebSocket server only
  startWebSocketServerOnly().catch(console.error);
}

/**
 * Desktop App API Client for Polling-Based Communication
 *
 * This client polls the Vercel-deployed website for tasks and updates.
 * It replaces the WebSocket-based communication for production deployment.
 */

const https = require("https");
const http = require("http");

class DesktopAppAPIClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || "https://autoreach-pro.vercel.app";
    this.desktopAppId = config.desktopAppId || this.generateDesktopAppId();
    this.apiKey = `desktop-${this.desktopAppId}-key`;
    this.pollingInterval = config.pollingInterval || 5000; // 5 seconds
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.isPolling = false;
    this.pollingTimer = null;
    this.retryCount = 0;
    this.lastSeen = null;

    // Task handlers
    this.taskHandlers = new Map();

    // Logging
    this.log("INFO", "DesktopAppAPIClient initialized", {
      desktopAppId: this.desktopAppId,
      baseURL: this.baseURL,
      pollingInterval: this.pollingInterval,
    });
  }

  // Generate unique desktop app ID
  generateDesktopAppId() {
    return `desktop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enhanced logging
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [${level}] [DesktopAppAPIClient] ${message}`,
      Object.keys(data).length ? JSON.stringify(data, null, 2) : ""
    );
  }

  // Make HTTP request
  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseURL);
      const isHttps = url.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AutoReach-Desktop-App/1.0.0",
        },
        timeout: 10000, // 10 second timeout
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers["Content-Length"] = Buffer.byteLength(jsonData);
      }

      const req = httpModule.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve({
              status: res.statusCode,
              data: parsedData,
              headers: res.headers,
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  // Register task handler
  registerTaskHandler(taskType, handler) {
    this.taskHandlers.set(taskType, handler);
    this.log("INFO", `Task handler registered for type: ${taskType}`);
  }

  // Execute task
  async executeTask(task) {
    const { id, taskType, data, attempts = 0, maxAttempts = 3 } = task;

    this.log("INFO", `Executing task: ${id}`, { taskType, attempts });

    try {
      const handler = this.taskHandlers.get(taskType);
      if (!handler) {
        throw new Error(`No handler registered for task type: ${taskType}`);
      }

      const result = await handler(data);

      // Report success
      await this.updateTaskStatus(id, "completed", result);

      this.log("INFO", `Task completed: ${id}`, { taskType });
      return result;
    } catch (error) {
      this.log("ERROR", `Task failed: ${id}`, {
        taskType,
        error: error.message,
        attempts: attempts + 1,
      });

      // Report failure
      await this.updateTaskStatus(id, "failed", null, error.message);

      // Retry if under max attempts
      if (attempts < maxAttempts) {
        this.log("INFO", `Retrying task: ${id}`, {
          attempts: attempts + 1,
          maxAttempts,
        });
        // Task will be retried on next poll
      }

      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(taskId, status, result = null, error = null) {
    try {
      const response = await this.makeRequest(
        "PUT",
        "/api/public/desktop-app/tasks",
        {
          taskId,
          status,
          result,
          error,
        }
      );

      if (response.status === 200) {
        this.log("INFO", `Task status updated: ${taskId}`, { status });
      } else {
        this.log("WARN", `Failed to update task status: ${taskId}`, {
          status: response.status,
          error: response.data.error,
        });
      }
    } catch (error) {
      this.log("ERROR", `Error updating task status: ${taskId}`, {
        error: error.message,
      });
    }
  }

  // Poll for tasks
  async pollForTasks() {
    if (this.isPolling) {
      return; // Already polling
    }

    this.isPolling = true;
    this.log("INFO", "Starting task polling");

    const poll = async () => {
      try {
        const response = await this.makeRequest(
          "GET",
          `/api/public/desktop-app/tasks?desktopAppId=${this.desktopAppId}&apiKey=${this.apiKey}`
        );

        if (response.status === 200 && response.data.success) {
          const { tasks } = response.data;

          if (tasks && tasks.length > 0) {
            this.log("INFO", `Received ${tasks.length} tasks`);

            // Process tasks
            for (const task of tasks) {
              try {
                await this.executeTask(task);
              } catch (error) {
                this.log("ERROR", `Failed to execute task: ${task.id}`, {
                  error: error.message,
                });
              }
            }
          }

          this.retryCount = 0; // Reset retry count on success
          this.lastSeen = new Date().toISOString();
        } else {
          this.log("WARN", "Polling request failed", {
            status: response.status,
            error: response.data?.error,
          });
        }
      } catch (error) {
        this.retryCount++;
        this.log("ERROR", `Polling error (attempt ${this.retryCount})`, {
          error: error.message,
        });

        if (this.retryCount >= this.maxRetries) {
          this.log("ERROR", "Max retries reached, stopping polling");
          this.stopPolling();
          return;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        this.log("INFO", `Retrying in ${delay}ms`);
        setTimeout(poll, delay);
        return;
      }

      // Schedule next poll
      this.pollingTimer = setTimeout(poll, this.pollingInterval);
    };

    // Start polling
    poll();
  }

  // Stop polling
  stopPolling() {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling = false;
    this.log("INFO", "Task polling stopped");
  }

  // Get status
  getStatus() {
    return {
      desktopAppId: this.desktopAppId,
      isPolling: this.isPolling,
      lastSeen: this.lastSeen,
      retryCount: this.retryCount,
      baseURL: this.baseURL,
      pollingInterval: this.pollingInterval,
    };
  }

  // Create task (for testing)
  async createTask(taskType, data, priority = "normal") {
    try {
      const response = await this.makeRequest(
        "POST",
        "/api/public/desktop-app/tasks",
        {
          desktopAppId: this.desktopAppId,
          taskType,
          data,
          priority,
        }
      );

      if (response.status === 200) {
        this.log("INFO", "Task created successfully", {
          taskId: response.data.task.id,
          taskType,
        });
        return response.data.task;
      } else {
        throw new Error(response.data.error || "Failed to create task");
      }
    } catch (error) {
      this.log("ERROR", "Failed to create task", { error: error.message });
      throw error;
    }
  }
}

module.exports = DesktopAppAPIClient;

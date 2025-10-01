import puppeteer, { Browser, Page } from "puppeteer";

export interface PuppeteerCommand {
  type: "OPEN" | "FILL" | "SCREENSHOT" | "CLOSE" | "PAUSE" | "RESUME";
  data?: any;
}

export interface PuppeteerResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
}

export class PuppeteerHandler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isPaused: boolean = false;
  private pauseMessage: string = "";

  constructor() {
    console.log("🤖 Puppeteer handler initialized");
  }

  async executeCommand(command: PuppeteerCommand): Promise<PuppeteerResult> {
    try {
      switch (command.type) {
        case "OPEN":
          return await this.openPage(command.data?.url);
        case "FILL":
          return await this.fillForm(command.data?.fields || []);
        case "SCREENSHOT":
          return await this.takeScreenshot();
        case "CLOSE":
          return await this.closePage();
        case "PAUSE":
          return await this.pause(command.data?.message);
        case "RESUME":
          return await this.resume();
        default:
          return {
            success: false,
            error: `Unknown command type: ${command.type}`,
          };
      }
    } catch (error) {
      console.error(
        `Error executing Puppeteer command ${command.type}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async openPage(url: string): Promise<PuppeteerResult> {
    try {
      if (!this.browser) {
        console.log("🚀 Launching browser...");
        this.browser = await puppeteer.launch({
          headless: false, // Show browser window
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--window-size=1366,768",
            "--disable-features=VizDisplayCompositor",
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-ipc-flooding-protection",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ],
        });
      }

      this.page = await this.browser.newPage();

      // Set user agent
      await this.page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set viewport
      await this.page.setViewport({ width: 1366, height: 768 });

      console.log(`🌐 Navigating to: ${url}`);
      await this.page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      return {
        success: true,
        data: {
          url,
          title: await this.page.title(),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Failed to open page:", error);
      return {
        success: false,
        error: `Failed to open page: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async fillForm(
    fields: Array<{ selector: string; value: string }>
  ): Promise<PuppeteerResult> {
    try {
      if (!this.page) {
        return {
          success: false,
          error: "No page open. Call OPEN command first.",
        };
      }

      if (this.isPaused) {
        return {
          success: false,
          error: `Paused: ${this.pauseMessage}`,
        };
      }

      console.log(`📝 Filling form with ${fields.length} fields`);

      for (const field of fields) {
        try {
          // Wait for element to be available
          await this.page.waitForSelector(field.selector, { timeout: 5000 });

          // Clear existing value
          await this.page.evaluate((selector) => {
            const element = document.querySelector(
              selector
            ) as HTMLInputElement;
            if (element) {
              element.value = "";
            }
          }, field.selector);

          // Type the value with human-like delays
          await this.page.type(field.selector, field.value, { delay: 100 });

          console.log(`✅ Filled field: ${field.selector} = ${field.value}`);
        } catch (error) {
          console.warn(
            `⚠️ Failed to fill field ${field.selector}:`,
            error instanceof Error ? error.message : "Unknown error"
          );
          // Continue with other fields
        }
      }

      return {
        success: true,
        data: {
          fieldsFilled: fields.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Failed to fill form:", error);
      return {
        success: false,
        error: `Failed to fill form: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async takeScreenshot(): Promise<PuppeteerResult> {
    try {
      if (!this.page) {
        return {
          success: false,
          error: "No page open. Call OPEN command first.",
        };
      }

      console.log("📸 Taking screenshot...");
      const screenshot = await this.page.screenshot({
        encoding: "base64",
        fullPage: true,
      });

      return {
        success: true,
        screenshot,
        data: {
          timestamp: new Date().toISOString(),
          size: screenshot.length,
        },
      };
    } catch (error) {
      console.error("Failed to take screenshot:", error);
      return {
        success: false,
        error: `Failed to take screenshot: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async closePage(): Promise<PuppeteerResult> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
        console.log("🔒 Page closed");
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        console.log("🔒 Browser closed");
      }

      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Failed to close page:", error);
      return {
        success: false,
        error: `Failed to close page: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async pause(message: string): Promise<PuppeteerResult> {
    this.isPaused = true;
    this.pauseMessage = message || "Paused for user input";

    console.log(`⏸️ Paused: ${this.pauseMessage}`);

    return {
      success: true,
      data: {
        message: this.pauseMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async resume(): Promise<PuppeteerResult> {
    this.isPaused = false;
    this.pauseMessage = "";

    console.log("▶️ Resumed");

    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up Puppeteer handler...");

    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      console.log("✅ Puppeteer cleanup completed");
    } catch (error) {
      console.error("Error during Puppeteer cleanup:", error);
    }
  }

  isPageOpen(): boolean {
    return this.page !== null;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  getPauseMessage(): string {
    return this.pauseMessage;
  }
}

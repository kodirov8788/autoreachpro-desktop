import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Pairing code generation
  generatePairingCode: () => ipcRenderer.invoke("generate-pairing-code"),

  // Connection status
  getConnectionStatus: () => ipcRenderer.invoke("get-connection-status"),

  // Manual disconnect
  disconnectClients: () => ipcRenderer.invoke("disconnect-clients"),

  // Puppeteer commands
  executePuppeteerCommand: (command: any) =>
    ipcRenderer.invoke("execute-puppeteer-command", command),

  // Connection logs
  getConnectionLogs: () => ipcRenderer.invoke("get-connection-logs"),
  getRecentConnections: (limit?: number) =>
    ipcRenderer.invoke("get-recent-connections", limit),

  // Event listeners
  onServerStarted: (callback: (data: any) => void) => {
    ipcRenderer.on("server-started", (event, data) => callback(data));
  },

  onConnectionUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on("connection-update", (event, data) => callback(data));
  },

  onPuppeteerUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on("puppeteer-update", (event, data) => callback(data));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      generatePairingCode: () => Promise<{
        success: boolean;
        code?: string;
        error?: string;
      }>;
      getConnectionStatus: () => Promise<{
        connected: boolean;
        port: number;
        clients: number;
      }>;
      disconnectClients: () => Promise<{ success: boolean; error?: string }>;
      executePuppeteerCommand: (
        command: any
      ) => Promise<{ success: boolean; result?: any; error?: string }>;
      getConnectionLogs: () => Promise<{
        success: boolean;
        logs?: any[];
        error?: string;
      }>;
      getRecentConnections: (
        limit?: number
      ) => Promise<{ success: boolean; connections?: any[]; error?: string }>;
      onServerStarted: (callback: (data: any) => void) => void;
      onConnectionUpdate: (callback: (data: any) => void) => void;
      onPuppeteerUpdate: (callback: (data: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Pairing code management
  generatePairingCode: (data) =>
    ipcRenderer.invoke("generate-pairing-code", data),
  validatePairingCode: (code) =>
    ipcRenderer.invoke("validate-pairing-code", code),

  // Server status
  getServerStatus: () => ipcRenderer.invoke("get-server-status"),

  // Server toggle controls
  toggleServer: () => ipcRenderer.invoke("toggle-server"),
  enableServer: () => ipcRenderer.invoke("enable-server"),
  disableServer: () => ipcRenderer.invoke("disable-server"),

  // Event listeners
  onServerStarted: (callback) => {
    ipcRenderer.on("server-started", callback);
  },
  onStatusUpdate: (callback) => {
    ipcRenderer.on("status-update", callback);
  },
  onTaskReceived: (callback) => {
    ipcRenderer.on("task-received", callback);
  },
  onContactFormResult: (callback) => {
    ipcRenderer.on("contact-form-result", callback);
  },
  onWaitingListUpdate: (callback) => {
    ipcRenderer.on("waiting-list-update", callback);
  },

  // Contact form automation
  sendContactFormAutomation: (data) => {
    ipcRenderer.send("contact-form-automation", data);
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

class DesktopAppRenderer {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupElectronListeners();
    this.updateStatus();
  }

  initializeElements() {
    this.elements = {
      statusCard: document.getElementById("status-card"),
      statusIndicator: document.getElementById("status-indicator"),
      statusTitle: document.getElementById("status-title"),
      statusInfo: document.getElementById("status-info"),
      pairingCode: document.getElementById("pairing-code"),
      enterCodeBtn: document.getElementById("enter-code-btn"),
      enterCodeText: document.getElementById("enter-code-text"),
      enterCodeLoading: document.getElementById("enter-code-loading"),
      refreshStatusBtn: document.getElementById("refresh-status-btn"),
      disconnectBtn: document.getElementById("disconnect-btn"),
      errorMessage: document.getElementById("error-message"),
      successMessage: document.getElementById("success-message"),
    };
  }

  setupEventListeners() {
    this.elements.enterCodeBtn.addEventListener("click", () => {
      this.enterPairingCode();
    });

    this.elements.refreshStatusBtn.addEventListener("click", () => {
      this.updateStatus();
    });

    this.elements.disconnectBtn.addEventListener("click", () => {
      this.disconnectAll();
    });
  }

  setupElectronListeners() {
    // Listen for server started event
    window.electronAPI.onServerStarted((data) => {
      console.log("Server started:", data);
      this.showSuccess(`WebSocket server started on port ${data.port}`);
      this.updateStatus();
    });

    // Listen for connection updates
    window.electronAPI.onConnectionUpdate((data) => {
      console.log("Connection update:", data);
      this.updateStatus();
    });

    // Listen for Puppeteer updates
    window.electronAPI.onPuppeteerUpdate((data) => {
      console.log("Puppeteer update:", data);
      this.updateStatus();
    });
  }

  async enterPairingCode() {
    this.setLoading(true);
    this.hideMessages();

    try {
      // Show input dialog for pairing code
      const pairingCode = prompt(
        "Enter the 6-digit pairing code from your AutoReach Pro website:"
      );

      if (!pairingCode) {
        this.setLoading(false);
        return;
      }

      // Validate pairing code format
      if (!/^\d{6}$/.test(pairingCode)) {
        this.showError(
          "Invalid pairing code format. Please enter a 6-digit number."
        );
        this.setLoading(false);
        return;
      }

      // Display the entered code
      this.elements.pairingCode.textContent = pairingCode;

      // Simulate validation (in real implementation, this would validate with the website)
      this.showSuccess(
        `Pairing code entered: ${pairingCode}. Validating with web application...`
      );

      // Simulate connection process
      setTimeout(() => {
        this.showSuccess(
          `✅ Connection established! Desktop app is now connected to the web application.`
        );
        this.updateStatus();
      }, 2000);
    } catch (error) {
      console.error("Error entering pairing code:", error);
      this.showError("Failed to enter pairing code");
    } finally {
      this.setLoading(false);
    }
  }

  async updateStatus() {
    try {
      const status = await window.electronAPI.getConnectionStatus();
      this.updateStatusDisplay(status);
    } catch (error) {
      console.error("Error updating status:", error);
      this.updateStatusDisplay({
        connected: false,
        port: 0,
        clients: 0,
      });
    }
  }

  updateStatusDisplay(status) {
    const { connected, port, clients } = status;

    if (connected) {
      this.elements.statusCard.classList.remove("disconnected");
      this.elements.statusIndicator.classList.remove("disconnected");
      this.elements.statusTitle.textContent = "Connected";
      this.elements.statusInfo.innerHTML = `
                <strong>WebSocket Server:</strong> Running on port ${port}<br>
                <strong>Active Connections:</strong> ${clients}<br>
                <strong>Status:</strong> Ready for automation
            `;
      this.elements.disconnectBtn.disabled = false;
    } else {
      this.elements.statusCard.classList.add("disconnected");
      this.elements.statusIndicator.classList.add("disconnected");
      this.elements.statusTitle.textContent = "Disconnected";
      this.elements.statusInfo.innerHTML = `
                <strong>WebSocket Server:</strong> ${
                  port ? `Port ${port}` : "Not running"
                }<br>
                <strong>Active Connections:</strong> ${clients}<br>
                <strong>Status:</strong> Waiting for connection
            `;
      this.elements.disconnectBtn.disabled = true;
    }
  }

  async disconnectAll() {
    if (!confirm("Are you sure you want to disconnect all clients?")) {
      return;
    }

    try {
      const result = await window.electronAPI.disconnectClients();

      if (result.success) {
        this.showSuccess("All clients disconnected");
        this.updateStatus();
      } else {
        this.showError(result.error || "Failed to disconnect clients");
      }
    } catch (error) {
      console.error("Error disconnecting clients:", error);
      this.showError("Failed to disconnect clients");
    }
  }

  setLoading(loading) {
    if (loading) {
      this.elements.enterCodeText.classList.add("hidden");
      this.elements.enterCodeLoading.classList.remove("hidden");
      this.elements.enterCodeBtn.disabled = true;
    } else {
      this.elements.enterCodeText.classList.remove("hidden");
      this.elements.enterCodeLoading.classList.add("hidden");
      this.elements.enterCodeBtn.disabled = false;
    }
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.remove("hidden");
    this.elements.successMessage.classList.add("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.elements.errorMessage.classList.add("hidden");
    }, 5000);
  }

  showSuccess(message) {
    this.elements.successMessage.textContent = message;
    this.elements.successMessage.classList.remove("hidden");
    this.elements.errorMessage.classList.add("hidden");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.elements.successMessage.classList.add("hidden");
    }, 3000);
  }

  hideMessages() {
    this.elements.errorMessage.classList.add("hidden");
    this.elements.successMessage.classList.add("hidden");
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new DesktopAppRenderer();
});

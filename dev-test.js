#!/usr/bin/env node

// Development testing script that bypasses packaging issues
const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting AutoReach Pro Desktop App in Development Mode...");
console.log("📁 Working directory:", process.cwd());

// Run the app directly with electron
const electronPath = path.join(__dirname, "node_modules", ".bin", "electron");
const mainPath = path.join(__dirname, "main.js");

console.log("🔧 Electron path:", electronPath);
console.log("📄 Main file:", mainPath);

const child = spawn(electronPath, [mainPath], {
  stdio: "inherit",
  cwd: __dirname,
});

child.on("error", (error) => {
  console.error("❌ Failed to start app:", error);
});

child.on("close", (code) => {
  console.log(`✅ App exited with code ${code}`);
});

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  child.kill("SIGINT");
  process.exit(0);
});

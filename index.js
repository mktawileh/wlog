#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const homeDir = os.homedir();
const appDir = path.join(homeDir, ".waddlog");
const logFile = path.join(appDir, "log.txt");

// Ensure the directory exists
if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
}

// CLI logic
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Usage:");
    console.log("  waddlog add 'your message'   # Add a log entry");
    console.log("  waddlog show                 # Show all logs");
    process.exit(0);
}

const command = args[0];

if (command === "add") {
    const message = args.slice(1).join(" ");
    if (!message) {
        console.error("Error: Please provide a message to log.");
        process.exit(1);
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(logFile, logEntry);
    console.log("Log added successfully.");
} else if (command === "show") {
    if (!fs.existsSync(logFile)) {
        console.log("No logs found.");
        process.exit(0);
    }

    const logs = fs.readFileSync(logFile, "utf8");
    console.log("Logs:\n" + logs);
} else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}

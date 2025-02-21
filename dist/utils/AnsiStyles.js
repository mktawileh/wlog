"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A collection of ANSI escape codes for styling text and controlling the terminal cursor.
 * These codes are used to add colors, styles (e.g., bold), and cursor movements to terminal output.
 */
const AnsiStyles = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bgGrey: "\x1b[48;5;234m",
    get error() { return this.bold + this.red; },
    get success() { return this.bold + this.green; },
    get info() { return this.bold + this.yellow; },
    // Cursor control
    saveCursor: "\x1b[s", // Save cursor position
    restoreCursor: "\x1b[u", // Restore cursor position
    hideCursor: "\x1b[?25l", // Hide cursor
    showCursor: "\x1b[?25h", // Show cursor
    clearLine: "\x1b[K", // Clear the current line
    moveUp: (lines = 1) => `\x1b[${lines}A`, // Move cursor up by `lines`
    moveDown: (lines = 1) => `\x1b[${lines}B`, // Move cursor down by `lines`
};
exports.default = AnsiStyles;

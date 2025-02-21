"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = stringTable;
const AnsiStyles_1 = __importDefault(require("./AnsiStyles"));
const stringTableSettingsDefault = {
    noColors: false,
    maxWidth: undefined
};
/**
 * Prints a formatted table to the terminal based on the provided data and column configurations.
 * The table dynamically adjusts to the terminal width and supports text wrapping for long content.
 *
 * @param data - An array of objects representing the rows of the table.
 * @param columns - An array of column configurations defining the table structure.
 * @returns A string containing the formatted table.
 */
function stringTable(data, columns, settings) {
    const { noColors, maxWidth } = Object.assign(Object.assign({}, stringTableSettingsDefault), settings);
    // Determine the terminal width, defaulting to 80 if not available.
    let terminalWidth = process.stdout.columns || 80;
    if (maxWidth) {
        terminalWidth = Math.min(maxWidth, terminalWidth);
    }
    // Calculate the table width, ensuring it doesn't exceed 80% of the terminal width or 150 characters.
    const tableWidth = terminalWidth <= 150 ? terminalWidth - 3 : Math.floor(terminalWidth * 0.80);
    // Calculate the total weight of all columns for proportional width distribution.
    const totalWeight = columns.reduce((sum, col) => sum + col.width, 0);
    // Calculate the actual width of each column based on its proportional weight.
    const colWidths = columns.map((col) => Math.floor((col.width / totalWeight) * tableWidth));
    /**
     * Wraps text to fit within a specified width, breaking words with hyphens if necessary.
     *
     * @param text - The text to wrap.
     * @param width - The maximum width of each line.
     * @returns An array of lines, each no longer than the specified width.
     */
    function wrapText(text, width) {
        let lines = [];
        let currentLine = '';
        for (let i = 0; i < text.length; i++) {
            currentLine += text[i];
            // If the current line reaches the maximum width, wrap it.
            if (currentLine.length === width) {
                // Add a hyphen if wrapping mid-word.
                if (i + 1 < text.length && /\w/.test(text[i]) && /\w/.test(text[i + 1])) {
                    currentLine = currentLine.slice(0, -1) + '-';
                    i--; // Re-process the current character.
                }
                lines.push(currentLine);
                currentLine = '';
            }
        }
        // Add any remaining text as a new line.
        if (currentLine)
            lines.push(currentLine);
        return lines;
    }
    /**
     * Processes text by splitting it into segments and wrapping each segment to fit the column width.
     *
     * @param text - The text to process.
     * @param width - The maximum width of each line.
     * @returns An array of lines, each no longer than the specified width.
     */
    function processText(text, width) {
        return text.split('\n').flatMap((segment) => wrapText(segment, width));
    }
    // Generate the header row.
    let headerRow = columns.map((col, i) => col.name.padEnd(colWidths[i])).join(' ');
    let output = "\n " + headerRow + "\n";
    // Generate the separator row.
    output += " " + columns.map((_, i) => '-'.repeat(colWidths[i])).join(' ') + "\n";
    // Process each row of data.
    data.forEach((row, index) => {
        // Process each column's text to fit the column width.
        const processedColumns = columns.map((col, i) => processText(String(row[col.key] || ''), colWidths[i]));
        // Determine the maximum number of lines needed for this row.
        const maxLines = Math.max(...processedColumns.map((col) => col.length));
        // Generate each line of the row.
        for (let i = 0; i < maxLines; i++) {
            let rowText = columns
                .map((_, j) => (processedColumns[j][i] || '').padEnd(colWidths[j]))
                .join(' ');
            // Apply alternating background color for better readability.
            output += " " + ((index % 2 == 1) && !noColors ? AnsiStyles_1.default.bgGrey + rowText + AnsiStyles_1.default.reset : rowText) + "\n";
        }
    });
    output += "\n";
    return output;
}

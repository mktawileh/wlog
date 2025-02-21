"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AnsiStyles_1 = __importDefault(require("../utils/AnsiStyles"));
const MostSimilar_1 = __importDefault(require("../utils/MostSimilar"));
const selectFromListSettingsDefault = {
    optionPrefix: ">",
    selected: t => t,
};
const askQuestionSettingsDefault = {
    validate: _ => true,
    errorMessage: _ => "Invalid input",
};
/**
 * A base class for creating command-line interfaces (CLI).
 * Provides methods for handling subcommands, options, and user interactions.
 */
class CliBase {
    /**
     * Gets the currently selected subcommand.
     * @throws Error if accessed outside of a subcommand's run function.
     */
    get subcommand() {
        if (this._subcommand === undefined) {
            throw new Error("You can only access the subcommand property from the subcommand run function");
        }
        return this._subcommand;
    }
    /**
     * Initializes a new instance of the CliBase class.
     * @param name - The name of the CLI application.
     * @param synopsis - A brief description of the CLI usage.
     */
    constructor(name, synopsis) {
        this.subcommands = {}; // Map of available subcommands.
        this.options = {}; // Map of available options.
        this.name = name;
        this.synopsis = synopsis;
        this.textStyle = new Proxy(AnsiStyles_1.default, {
            get: (target, prop) => (text) => {
                if (this.options.noColors.value === "1" || !this.isRawModeSupported)
                    return text;
                if (target.hasOwnProperty(prop))
                    return target[prop] + text + target.reset;
                return text;
            }
        });
        const constructor = this.constructor;
        if (constructor.subcommands) {
            this.subcommands = Object.assign(Object.assign({}, this.subcommands), constructor.subcommands);
        }
        if (constructor.options) {
            this.options = Object.assign(Object.assign({}, this.options), constructor.options);
        }
        this.stdin = process.stdin;
        this.stdout = process.stdout;
        this.isRawModeSupported = this.stdin.isTTY;
    }
    /**
     * Logs a message with a specified level (e.g., error, info, success).
     * @param level - The log level.
     * @param message - The message to log.
     */
    log(level, ...message) {
        let msg = message.join(" ").trim();
        let lvl = level.toLowerCase();
        if (msg === "")
            msg = level, level = "";
        if (["error", "info", "success"].includes(lvl)) {
            level = level[0].toUpperCase() + level.slice(1).toLowerCase();
            level = '[' + this.textStyle[lvl](level) + '] ';
        }
        this.print(level + msg, "\n");
    }
    /**
     * Hook method called before the CLI starts running.
     */
    onRunStart() { }
    /**
     * Hook method called after the CLI finishes running.
     */
    onRunFinish() { }
    /**
     * Runs the CLI with the provided arguments.
     * @param args - The command-line arguments.
     * @returns A promise that resolves to the exit code.
     */
    run(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let [code, _args] = this.parseOptionsAndApply(args, this.options);
            if (code !== 0)
                return code;
            if (this.onRunStart !== undefined)
                this.onRunStart();
            const subcmd = _args.shift();
            if (subcmd === undefined) {
                this.log("error", "No subcommand was provided\n");
                this.usage();
                code = 1;
            }
            if (subcmd !== undefined && !this.subcommands.hasOwnProperty(subcmd)) {
                this.log("error", `Unknown subcommand '${subcmd}'\n`);
                const possible = (0, MostSimilar_1.default)(subcmd, Object.keys(this.subcommands));
                if (possible.length > 0)
                    this.log("info", `Did you mean${possible.length > 1 ? " one of" : ''}: ${possible.join(", ")}\n`);
                this.usage();
                code = 1;
            }
            if (subcmd !== undefined && code === 0) {
                this._subcommand = this.subcommands[subcmd];
                code = yield this._subcommand.run.call(this, _args);
            }
            if (this.onRunFinish !== undefined)
                this.onRunFinish();
            return code;
        });
    }
    /**
     * Parses command-line options and applies them.
     * @param args - The command-line arguments.
     * @param options - The options to parse.
     * @param subcommand - The subcommand being executed (optional).
     * @returns The exit code (0 for success, 1 for failure).
     */
    parseOptionsAndApply(args, options, subcommand) {
        const _args = args.slice();
        const remaning = [];
        while (_args.length > 0) {
            if (!_args[0].startsWith("-")) {
                remaning.push(_args.shift());
                continue;
            }
            const arg = _args.shift();
            let option;
            for (const opt in options) {
                if (options[opt].aliases.includes(arg !== null && arg !== void 0 ? arg : "")) {
                    option = options[opt];
                }
            }
            if (option === undefined) {
                remaning.push(arg);
                continue;
            }
            if (option.isBool) {
                option.value = "1";
                continue;
            }
            let value = _args.shift();
            if (value === undefined) {
                this.log("error", `Expected a one value for option '${arg}' but got nothing!\n`);
                this.usage(subcommand);
                return [1, []];
            }
            option.value = value;
            if (option.effect !== undefined)
                option.effect();
        }
        return [0, remaning];
    }
    /**
     * Displays usage information for the CLI or a specific subcommand.
     * @param subcommand - The subcommand to display usage for (optional).
     */
    usage(subcommand) {
        const { yellow, bold } = this.textStyle;
        if (subcommand) {
            this.print(yellow("Usage:  "), this.name, subcommand, this.subcommands[subcommand].synopsis, "\n");
            return;
        }
        this.print(yellow("Usage:  "), this.name, this.synopsis, "\n");
        const padding = Math.min(Math.max(...Object.keys(this.subcommands)
            .map(k => k.length)) + 2, this.stdout.columns);
        this.print(yellow("Subcommands:  \n"));
        for (subcommand in this.subcommands) {
            this.print("    ", bold(subcommand.padEnd(padding)), this.subcommands[subcommand].description, "\n");
        }
    }
    /**
     * Prints text to the standard output.
     * @param text - The text to print.
     */
    print(...text) {
        this.stdout.write(text.join(" "));
    }
    /**
     * Enables raw mode for the terminal.
     */
    enableRawMode() {
        if (this.isRawModeSupported && this.options.noColors.value !== "1") {
            this.stdin.setRawMode(true);
            this.stdin.resume();
            this.stdin.setEncoding('utf-8');
        }
    }
    /**
     * Disables raw mode for the terminal.
     */
    disableRawMode() {
        if (this.isRawModeSupported && this.options.noColors.value !== "1") {
            this.stdin.setRawMode(false);
            this.stdin.pause();
        }
    }
    /**
     * Asks a question and waits for user input.
     * @param question - The question to ask.
     * @param settings - Settings for validation and error messages.
     * @returns A promise that resolves to the user's input.
     */
    askQuestion(question_1) {
        return __awaiter(this, arguments, void 0, function* (question, settings = askQuestionSettingsDefault) {
            return new Promise((resolve) => {
                const { validate, errorMessage } = Object.assign(Object.assign({}, askQuestionSettingsDefault), settings);
                this.stdout.write(question);
                const onData = (data) => {
                    const input = data.toString().trim();
                    this.stdin.removeListener('data', onData);
                    if (validate(input))
                        resolve(input);
                    else
                        this.stdout.write(errorMessage(input));
                };
                this.stdin.on('data', onData);
            });
        });
    }
    /**
     * Selects an option from a list using arrow keys.
     * @param question - The question to display.
     * @param options - The list of options.
     * @param settings - Settings for the selection UI.
     * @returns A promise that resolves to the selected option.
     */
    selectFromList(question_1, options_1) {
        return __awaiter(this, arguments, void 0, function* (question, options, settings = selectFromListSettingsDefault) {
            const { optionPrefix, selected } = Object.assign(Object.assign({}, selectFromListSettingsDefault), settings);
            if (!this.isRawModeSupported || this.options.noColors.value === "1") {
                return this.fallbackSelectFromList(question, options);
            }
            return new Promise((resolve) => {
                let selectedIndex = 0;
                // Split the question into lines
                const questionLines = question.split('\n');
                const totalQuestionLines = questionLines.length;
                // Store the initial cursor position
                this.stdout.write(AnsiStyles_1.default.saveCursor);
                // Render the list of options
                const render = () => {
                    this.stdout.write(AnsiStyles_1.default.hideCursor);
                    this.stdout.write(AnsiStyles_1.default.restoreCursor);
                    this.stdout.write(question + '\n');
                    options.forEach((option, index) => {
                        if (index === selectedIndex) {
                            this.stdout.write(selected(`${optionPrefix} ${option}${AnsiStyles_1.default.clearLine}\n`));
                        }
                        else {
                            this.stdout.write(`  ${option}${AnsiStyles_1.default.clearLine}\n`);
                        }
                    });
                    this.stdout.write(AnsiStyles_1.default.showCursor);
                };
                const clearAndDisplaySelection = (selectedOption) => {
                    this.stdout.write(AnsiStyles_1.default.restoreCursor);
                    // Calculate the total number of lines to clear
                    const totalLines = totalQuestionLines + options.length + 1;
                    // Clear all lines
                    for (let i = 0; i < totalLines; i++) {
                        this.stdout.write(AnsiStyles_1.default.clearLine);
                        if (i < totalLines - 1) {
                            this.stdout.write(AnsiStyles_1.default.moveDown());
                        }
                    }
                    this.stdout.write(AnsiStyles_1.default.moveUp(totalLines));
                    this.stdout.write('\n');
                    this.stdout.write(`${question} ${selectedOption}\n`);
                };
                this.enableRawMode();
                render();
                const onData = (data) => {
                    const input = data.toString();
                    if (input === '\x1B[A') { // Up arrow
                        selectedIndex = Math.max(0, selectedIndex - 1);
                        render();
                    }
                    else if (input === '\x1B[B') { // Down arrow
                        selectedIndex = Math.min(options.length - 1, selectedIndex + 1);
                        render();
                    }
                    else if (input === '\r' || input === '\n') { // Enter key
                        this.disableRawMode();
                        this.stdin.removeListener('data', onData);
                        const selectedOption = options[selectedIndex];
                        clearAndDisplaySelection(selectedOption);
                        resolve(selectedOption);
                    }
                };
                this.stdin.on('data', onData);
            });
        });
    }
    /**
     * Fallback method for selecting from a list when raw mode is not supported.
     * @param question - The question to display.
     * @param options - The list of options.
     * @returns A promise that resolves to the selected option.
     */
    fallbackSelectFromList(question, options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stdout.write(question + '\n');
            options.forEach((option, index) => {
                this.stdout.write(`${index + 1}. ${option}\n`);
            });
            return new Promise((resolve) => {
                const onData = (data) => {
                    const input = data.toString().trim();
                    const selectedIndex = parseInt(input, 10) - 1;
                    if (selectedIndex >= 0 && selectedIndex < options.length) {
                        this.stdin.removeListener('data', onData);
                        this.stdout.write(`${question} ${options[selectedIndex]}\n`);
                        resolve(options[selectedIndex]);
                    }
                    else {
                        this.stdout.write('Invalid selection. Please try again.\n');
                    }
                };
                this.stdin.on('data', onData);
            });
        });
    }
}
exports.default = CliBase;

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a subcommand in a CLI application.
 * Each subcommand has a name, synopsis, description, and optional options.
 */
class CliSubcommand {
    /**
     * Creates a new instance of the `CliSubcommand` class.
     * @param name - The name of the subcommand.
     * @param synopsis - A brief description of how to use the subcommand.
     * @param description - A detailed description of the subcommand's purpose.
     * @param run - An optional function to execute when the subcommand is run.
     */
    constructor(name, synopsis, description, run) {
        this.options = {}; // A map of options available for this subcommand.
        this.name = name;
        this.synopsis = synopsis;
        this.description = description;
        if (run)
            this.run = run; // Override the default `run` method if provided.
    }
    /**
     * A placeholder log method that can be overridden by the parent CLI instance.
     * @param _ - Messages to log.
     */
    log(..._) { }
    /**
     * The default implementation of the `run` method.
     * This method should be overridden by subclasses or provided in the constructor.
     * @param _args - The arguments passed to the subcommand.
     * @returns A promise that resolves to an exit code (0 for success).
     */
    run(_args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("error", `${this.name}'s run method is not implemented`);
            return 0;
        });
    }
    ;
}
exports.default = CliSubcommand;

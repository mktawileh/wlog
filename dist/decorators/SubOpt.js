"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SubOpt;
/**
 * A decorator function for defining options specific to a subcommand in a CLI application.
 * This decorator is used to dynamically add options to a subcommand and ensure they are parsed before the subcommand's logic is executed.
 *
 * @param name - The name of the option.
 * @param aliases - A comma-separated string of aliases for the option (e.g., `-h, --help`).
 * @param defaultValue - The default value for the option (optional).
 * @param isBool - Whether the option is a boolean flag (defaults to `false`).
 * @returns A decorator function that configures the method to handle subcommand-specific options.
 */
function SubOpt(name, aliases, defaultValue, isBool = false) {
    return function (_target, _propertyKey, descriptor) {
        // Store the original method for later invocation.
        const originalMethod = descriptor.value;
        // Override the method to add subcommand-specific options and parse them.
        descriptor.value = function (...args) {
            // Ensure the `options` object exists on the subcommand.
            if (!this.subcommand.options) {
                this.subcommand.options = {};
            }
            // Add the option to the subcommand's `options` object.
            this.subcommand.options[name] = {
                aliases: aliases.split(',').map(alias => alias.trim()), // Split aliases into an array.
                value: defaultValue, // Set the default value (if provided).
                isBool, // Indicate whether the option is a boolean flag.
            };
            // Parse the options and apply their effects.
            const [code, argsRest] = this.parseOptionsAndApply(args[0], // The arguments passed to the subcommand.
            this.subcommand.options, // The subcommand's options.
            this.subcommand.name);
            // If parsing fails (non-zero exit code), return the error code.
            if (code !== 0)
                return code;
            // Otherwise, call the original method with the provided arguments.
            return originalMethod.call(this, argsRest);
        };
        // Return the modified descriptor.
        return descriptor;
    };
}

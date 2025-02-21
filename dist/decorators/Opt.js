"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Opt;
/**
 * A decorator function for defining command-line options in a CLI application.
 * This decorator is used to dynamically add options to a class instance.
 *
 * @template T - The type of the option's value (defaults to `string`).
 * @param aliases - A comma-separated string of aliases for the option (e.g., `-h, --help`).
 * @param isBool - Whether the option is a boolean flag (defaults to `false`).
 * @returns A decorator function that configures the property as a CLI option.
 */
function Opt(aliases, isBool = false) {
    return function (target, propertyKey) {
        // Define a property on the target class instance.
        Object.defineProperty(target, propertyKey, {
            // Getter always returns `undefined` to prevent direct access.
            get() {
                return undefined;
            },
            // Setter assigns the option to the `options` object of the instance.
            set(value) {
                // Ensure the `options` object exists on the instance.
                if (!this.options) {
                    this.options = {};
                }
                // Add the option to the `options` object.
                this.options[propertyKey] = {
                    aliases: aliases.split(',').map(alias => alias.trim()), // Split aliases into an array.
                    value: value.toString(), // Convert the value to a string.
                    isBool, // Indicate whether the option is a boolean flag.
                };
            },
            enumerable: true, // Make the property visible during enumeration.
            configurable: true, // Allow redefining the property in the future.
        });
    };
}

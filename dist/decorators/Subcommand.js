"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Subcommand;
const CliSubcommand_1 = __importDefault(require("../core/CliSubcommand"));
/**
 * A decorator function for defining subcommands in a CLI application.
 * This decorator is used to dynamically add subcommands to a class constructor.
 *
 * @param synopsis - A brief description of how to use the subcommand.
 * @param description - A detailed description of the subcommand's purpose.
 * @returns A decorator function that configures the method as a CLI subcommand.
 */
function Subcommand(synopsis, description) {
    return function (target, propertyKey, descriptor) {
        // Ensure the `subcommands` object exists on the constructor.
        if (!target.constructor.subcommands) {
            target.constructor.subcommands = {};
        }
        // Create a new `CliSubcommand` instance and add it to the `subcommands` object.
        target.constructor.subcommands[propertyKey] = new CliSubcommand_1.default(propertyKey, // Use the method name as the subcommand name.
        synopsis, // Pass the synopsis for the subcommand.
        description, // Pass the description for the subcommand.
        descriptor.value // Use the decorated method as the `run` function.
        );
    };
}

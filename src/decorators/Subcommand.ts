import CliSubcommand from "../core/CliSubcommand";

/**
 * A decorator function for defining subcommands in a CLI application.
 * This decorator is used to dynamically add subcommands to a class constructor.
 *
 * @param synopsis - A brief description of how to use the subcommand.
 * @param description - A detailed description of the subcommand's purpose.
 * @returns A decorator function that configures the method as a CLI subcommand.
 */
export default function Subcommand(synopsis: string, description: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<(args: string[]) => Promise<number>>
    ) {
        // Ensure the `subcommands` object exists on the constructor.
        if (!target.constructor.subcommands) {
            target.constructor.subcommands = {};
        }

        // Create a new `CliSubcommand` instance and add it to the `subcommands` object.
        target.constructor.subcommands[propertyKey] = new CliSubcommand(
            propertyKey, // Use the method name as the subcommand name.
            synopsis, // Pass the synopsis for the subcommand.
            description, // Pass the description for the subcommand.
            descriptor.value! // Use the decorated method as the `run` function.
        );
    };
}

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
export default function SubOpt(name: string, aliases: string, defaultValue?: string, isBool: boolean = false) {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        // Store the original method for later invocation.
        const originalMethod = descriptor.value;

        // Override the method to add subcommand-specific options and parse them.
        descriptor.value = function (...args: any[]) {
            // Ensure the `options` object exists on the subcommand.
            if (!(this as any).subcommand.options) {
                (this as any).subcommand.options = {};
            }

            // Add the option to the subcommand's `options` object.
            (this as any).subcommand.options[name] = {
                aliases: aliases.split(',').map(alias => alias.trim()), // Split aliases into an array.
                value: defaultValue, // Set the default value (if provided).
                isBool, // Indicate whether the option is a boolean flag.
            };
            // Parse the options and apply their effects.
            const [code, argsRest] = (this as any).parseOptionsAndApply(
                args[0], // The arguments passed to the subcommand.
                (this as any).subcommand.options, // The subcommand's options.
                (this as any).subcommand.name, // The subcommand's name.
            );

            // If parsing fails (non-zero exit code), return the error code.
            if (code !== 0) return code;

            // Otherwise, call the original method with the provided arguments.
            return originalMethod.call(this, argsRest);
        };

        // Return the modified descriptor.
        return descriptor;
    };
}

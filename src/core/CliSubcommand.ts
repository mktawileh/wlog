import { CliOptionMap } from "./CliOption";

/**
 * A map of subcommands where the key is the subcommand name and the value is a `CliSubcommand` instance.
 */
export type CliSubcommandMap = {
    [name: string]: CliSubcommand;
}

/**
 * Represents a subcommand in a CLI application.
 * Each subcommand has a name, synopsis, description, and optional options.
 */
export default class CliSubcommand {
    name: string; // The name of the subcommand.
    synopsis: string; // A brief description of how to use the subcommand.
    description: string; // A detailed description of the subcommand's purpose.
    options: CliOptionMap = {}; // A map of options available for this subcommand.

    /**
     * Creates a new instance of the `CliSubcommand` class.
     * @param name - The name of the subcommand.
     * @param synopsis - A brief description of how to use the subcommand.
     * @param description - A detailed description of the subcommand's purpose.
     * @param run - An optional function to execute when the subcommand is run.
     */
    constructor(
        name: string,
        synopsis: string,
        description: string,
        run?: (args: string[]) => Promise<number>
    ) {
        this.name = name;
        this.synopsis = synopsis;
        this.description = description;
        if (run) this.run = run; // Override the default `run` method if provided.
    }

    /**
     * A placeholder log method that can be overridden by the parent CLI instance.
     * @param _ - Messages to log.
     */
    log(..._: string[]): void {}

    /**
     * The default implementation of the `run` method.
     * This method should be overridden by subclasses or provided in the constructor.
     * @param _args - The arguments passed to the subcommand.
     * @returns A promise that resolves to an exit code (0 for success).
     */
    async run(_args: string[]): Promise<number> {
        this.log("error", `${this.name}'s run method is not implemented`);
        return 0;
    };
}

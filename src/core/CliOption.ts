/**
 * A map of options where the key is the option name and the value is a `CliOption` instance.
 */
export type CliOptionMap = {
    [name: string]: CliOption;
}

/**
 * Represents a command-line option.
 */
export default interface CliOption {
    aliases: string[]; // The aliases for the option (e.g., `-h`, `--help`).
    value?: string; // The value assigned to the option (if any).
    isBool: boolean; // Whether the option is a boolean flag (true) or requires a value (false).
    effect?: () => {}; // An optional function to execute when the option is applied.
}

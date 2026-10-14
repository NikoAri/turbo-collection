import console from "node:console";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import { init } from "./init.ts";

const HELP_TEXT = `Turbo-Collection

Usage:
  turbo-collection init [<directory>] [-n <name>] [--description <text>]

Commands:
  init [<directory>]  Make <directory> a copy, creating it where it does not
                      exist. Without <directory>, the current directory.

Options:
  -n, --name <name>         Name the new copy, in lower case letters, digits
                            and hyphens. Without it, the copy takes the name
                            of its directory, in lower case, with a hyphen
                            where it holds anything but a letter or a digit.
      --description <text>  Describe the new copy. Optional.
  -h, --help                Show this help and exit.
`;

async function runTurboCollection(): Promise<void> {
  console.log("Turbo-Collection");
}

type TcCliArgs = {
  help: boolean;
  name: string | undefined; // -n, --name: what a new copy is called
  description: string | undefined; // --description: text describing a new copy
  command: string | undefined; // The first argument that is not an option: `init`
  commandArgs: string[]; // What follows the command: the directory init is given
};

export function parseCliArgs(args: readonly string[]): TcCliArgs {
  const { values, positionals } = parseArgs({
    args: [...args],
    options: {
      help: { type: "boolean", short: "h", default: false },
      name: { type: "string", short: "n" },
      description: { type: "string" },
    },
    allowPositionals: true,
  });
  const [command, ...commandArgs] = positionals;

  return {
    help: values.help,
    name: values.name,
    description: values.description,
    command,
    commandArgs,
  };
}

// Reports an error in the command line, and has the run exit with a non-zero status
// (turbo-collection-core-spec.md R-CLI-1).
function reportUsageError(message: string): void {
  console.error(`${message}\n\n${HELP_TEXT}`);
  process.exitCode = 1;
}

async function main(args: readonly string[]): Promise<void> {
  const tcCliArgs = parseCliArgs(args);

  if (tcCliArgs.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (tcCliArgs.command === undefined) {
    await runTurboCollection();
    return;
  }

  if (tcCliArgs.command !== "init") {
    reportUsageError(`Unknown command: ${tcCliArgs.command}`);
    return;
  }

  // Given no directory, init acts on the current one (R-CLI-11).
  const [directory = ".", ...unexpected] = tcCliArgs.commandArgs;
  if (unexpected.length > 0) {
    reportUsageError(
      `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
    return;
  }

  const name = init(directory, tcCliArgs.name, tcCliArgs.description);
  console.log(`Made "${path.resolve(directory)}" a copy named "${name}".`);
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}

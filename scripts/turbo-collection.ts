import console from "node:console";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import { initializeTc } from "./init.ts";

const HELP_TEXT = `Turbo-Collection

Usage:
  turbo-collection init [<directory>] [-n <name>] [--copy <name>]

Commands:
  init [<directory>]  Make <directory> the first copy of a new collection,
                      creating it where it does not exist. Without
                      <directory>, the current directory.

Options:
  -n, --name <name>  Name the new collection. Without it, the collection
                     takes the name of its directory.
      --copy <name>  Name the new copy. Without it, the copy is "main".
  -h, --help         Show this help and exit.
`;

async function runTurboCollection(): Promise<void> {
  console.log("Turbo-Collection");
}

type TcCliArgs = {
  help: boolean;
  name: string | undefined; // -n, --name: what a new collection is called
  copy: string | undefined; // --copy: what a new copy is called
  command: string | undefined; // The first argument that is not an option: `init`
  commandArgs: string[]; // What follows the command: the directory init is given
};

export function parseCliArgs(args: readonly string[]): TcCliArgs {
  const { values, positionals } = parseArgs({
    args: [...args],
    options: {
      help: { type: "boolean", short: "h", default: false },
      name: { type: "string", short: "n" },
      copy: { type: "string" },
    },
    allowPositionals: true,
  });
  const [command, ...commandArgs] = positionals;

  return {
    help: values.help,
    name: values.name,
    copy: values.copy,
    command,
    commandArgs,
  };
}

// Reports an error in the command line, and has the run exit with a non-zero status
// (turbo-collection-core-spec.md R-CLI-1).
function reportCliUsageError(message: string): void {
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
    reportCliUsageError(`Unknown command: ${tcCliArgs.command}`);
    return;
  }

  // Given no directory, init acts on the current one (R-CLI-11).
  const [directory = ".", ...unexpected] = tcCliArgs.commandArgs;
  if (unexpected.length > 0) {
    reportCliUsageError(
      `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
    return;
  }

  const tcConfig = initializeTc(directory, tcCliArgs.name, tcCliArgs.copy);
  console.log(
    `Made "${path.resolve(directory)}" a copy named "${tcConfig.copyName}", of a new collection named "${tcConfig.collectionName}".`,
  );
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}

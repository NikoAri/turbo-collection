import "node:console";
import { parseArgs } from "node:util";

const HELP_TEXT = `Turbo-Collection

Usage:
  turbo-collection [options]

Options:
  -h, --help    Show this help and exit.
`;

async function runTurboCollection(): Promise<void> {
  console.log("Turbo-Collection");
}

async function main(args: readonly string[]): Promise<void> {
  const { values } = parseArgs({
    args: [...args],
    options: {
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  await runTurboCollection();
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}

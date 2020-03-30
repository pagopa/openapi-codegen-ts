import { ensureDir } from "fs-extra";
import { generateApi } from "italia-utils";

const DEFAULT_OUTPUT_DIR = `${__dirname}/generated`;

if (!process.env.OUTPUT_DIR) {
  process.env.OUTPUT_DIR = DEFAULT_OUTPUT_DIR;
}
let OUTPUT_DIR: string = process.env.OUTPUT_DIR;

console.log("OUTPUT_DIR set as ", process.env.OUTPUT_DIR);

export default async () => {
  await ensureDir(OUTPUT_DIR);
  await generateApi(
    `${process.cwd()}/api.yaml`,
    OUTPUT_DIR,
    "",
    true,
    true,
    true,
    "undefined",
    "undefined",
    true
  );
};

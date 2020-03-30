import { ensureDir } from "fs-extra";
import { generateApi } from "italia-utils";

const OUTPUT_DIR = `${__dirname}/generated`;

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

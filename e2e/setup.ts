import { ensureDir } from "fs-extra";
import { generateApi } from "italia-utils";

const OUTPUT_DIR = `${__dirname}/generated`;

console.log("OUTPUT_DIR set as ", OUTPUT_DIR);

export default async () => {
  await ensureDir(OUTPUT_DIR);
  await generateApi({
    specFilePath: `${process.cwd()}/api.yaml`,
    definitionsDirPath: OUTPUT_DIR,
    strictInterfaces: true,
    generateClient: true
  });
};

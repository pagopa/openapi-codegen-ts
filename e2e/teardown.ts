import { remove } from "fs-extra";
import config from "./src/config";
const OUTPUT_DIR = `${__dirname}/generated`;

export default async () => {
  await remove(config.generatedFilesBaseDir);
};

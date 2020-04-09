import { remove } from "fs-extra";

const OUTPUT_DIR = `${__dirname}/generated`;

export default async () => {
  await remove(OUTPUT_DIR);
};

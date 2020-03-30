import { remove } from "fs-extra";

export default async () => {
  if (process.env.OUTPUT_DIR) {
    await remove(process.env.OUTPUT_DIR);
  }
};

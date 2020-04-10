import { remove } from "fs-extra";
import config from "./config";
import { stopAllServers } from "./server";

export default stopAllServers;
  await stopAllServers();
 // await remove(config.generatedFilesBaseDir);
};

import { isLeft } from "fp-ts/lib/Either";
import fetch from "node-fetch";
import config from "../../config";

// @ts-ignore
import * as leaked from "leaked-handles";

leaked.set({ debugSockets: true });

const { generatedFilesDir, mockPort } = config.specs.testapi;

describe("Http client generated from Test API spec", () => {
  const MODULE_PATH = generatedFilesDir;
  const loadModule = () =>
    import(`${MODULE_PATH}/client.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${MODULE_PATH}/client.ts`);
      }
      return mod;
    });

  it("should be a valid module", async () => {
    const { Client } = await loadModule();

    expect(Client).toBeDefined();
    expect(Client).toEqual(expect.any(Function));
  });

  it("should make a call", async () => {
    const { Client } = await loadModule();
    const client = Client(`http://localhost:${mockPort}`, fetch);

    expect(client.testAuthBearer).toEqual(expect.any(Function));
    const result = await client.testAuthBearer({});
    expect(isLeft(result)).toBe(true);
  });
});

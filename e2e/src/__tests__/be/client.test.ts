import { isLeft, Either } from "fp-ts/lib/Either";
import fetch from "node-fetch";
import config from "../../config";

const { skipClient } = config;
const { generatedFilesDir, mockPort, enabled } = config.specs.be;

const describeSuite = skipClient || !enabled ? describe.skip : describe;

describeSuite("Http client generated from BE API spec", () => {
  const loadModule = () =>
    import(`${generatedFilesDir}/client.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${generatedFilesDir}/client.ts`);
      }
      return mod;
    });

  it("should be a valid module", async () => {
    const { Client } = await loadModule();

    expect(Client).toBeDefined();
    expect(Client).toEqual(expect.any(Function));
  });
});

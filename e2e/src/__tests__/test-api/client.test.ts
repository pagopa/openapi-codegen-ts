import { isRight, Either } from "fp-ts/lib/Either";
import fetch from "node-fetch";
import config from "../../config";

// @ts-ignore
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

const { skipClient } = config;
const { generatedFilesDir, mockPort, enabled } = config.specs.testapi;

const describeSuite = skipClient || !enabled ? describe.skip : describe;

describeSuite("Http client generated from Test API spec", () => {
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

  it("should make a call", async () => {
    const { Client } = await loadModule();
    const client = Client(`http://localhost:${mockPort}`, fetch);

    expect(client.testAuthBearer).toEqual(expect.any(Function));
    const result = await client.testAuthBearer({});
    expect(isLeft(result)).toBe(true);
  });

  it("should make a call", async () => {
    const { Client } = await loadModule();
    const client = Client(`http://localhost:${mockPort}`, fetch, "");

    expect(client.testAuthBearer).toEqual(expect.any(Function));
    const result: Either<Error, any> = await client.testAuthBearer({
      bearerToken: "Bearer 123",
      qr: "any"
    });
    expect(isRight(result)).toBe(true);
  });
});

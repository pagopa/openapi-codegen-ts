import { Client } from "../../generated/testapi/client";
import { isRight, Either } from "fp-ts/lib/Either";
import nodeFetch from "node-fetch";
import config from "../../config";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

const { skipClient } = config;
const { generatedFilesDir, mockPort, isSpecEnabled } = config.specs.testapi;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = skipClient || !isSpecEnabled ? describe.skip : describe;

describeSuite("Http client generated from Test API spec", () => {
  
  it("should be a valid module", async () => {
    expect(Client).toBeDefined();
    expect(Client).toEqual(expect.any(Function));
  });

  it("should make a call", async () => {
    const client = Client(
      `http://localhost:${mockPort}`,
      (nodeFetch as any) as typeof fetch
    );

    expect(client.testAuthBearer).toEqual(expect.any(Function));
    // @ts-ignore because testAuthBearer has different signature but still I want to check this behavior
    const result = await client.testAuthBearer({});
    expect(isRight(result)).toBe(false);
  });
});

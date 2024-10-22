import nodeFetch from "node-fetch";

import * as E from "fp-ts/Either";

import config from "../../config";
import { createClient } from "../../generated/testapiWithDefaults/client";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

// Use same config as
const { skipClient } = config;
const { isSpecEnabled, mockPort } = config.specs.testapiWithDefaults;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = skipClient || !isSpecEnabled ? describe.skip : describe;

describeSuite("Http client generated from Test API spec", () => {
  it("should be a valid module", async () => {
    expect(createClient).toBeDefined();
    expect(createClient).toEqual(expect.any(Function));
  });

  it("should make a call, with default parameters", async () => {
    const client = createClient<"bearerToken">({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: "",
      // cast op to any to make it compile
      withDefaults: op => params => op({ ...params, bearerToken: "abc123" })
    });

    expect(client.test1).toEqual(expect.any(Function));

    const result = await client.test1({
      qo: "acb123"
    });
    expect(result).toMatchObject(E.right({ status: 200 }));
  });
});

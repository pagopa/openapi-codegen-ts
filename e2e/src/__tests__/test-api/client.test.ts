import { Either, isRight } from "fp-ts/lib/Either";
import nodeFetch from "node-fetch";
import config from "../../config";
import { createClient } from "../../generated/testapi/client";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

const { skipClient } = config;
const { generatedFilesDir, mockPort, isSpecEnabled } = config.specs.testapi;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = skipClient || !isSpecEnabled ? describe.skip : describe;

describeSuite("Http client generated from Test API spec", () => {
  it("should be a valid module", async () => {
    expect(createClient).toBeDefined();
    expect(createClient).toEqual(expect.any(Function));
  });

  it("should make a call", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    expect(client.testAuthBearer).toEqual(expect.any(Function));

    const result = await client.testAuthBearer({
      bearerToken: "acb123",
      qr: "acb123"
    });
    expect(isRight(result)).toBe(true);
  });

  it("should make a call, with default parameters", async () => {
    const client = createClient<"bearerToken">({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: "",
      withDefaults: (op: any) => (params: any) =>
        op({ ...params, bearerToken: "abc123" })
    });

    expect(client.testAuthBearer).toEqual(expect.any(Function));

    const result = await client.testAuthBearer({
      qr: "acb123"
    });
    expect(isRight(result)).toBe(true);
  });

  it("should handle parameter with dashes", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    expect(client.testParameterWithDash).toEqual(expect.any(Function));

    const result = await client.testParameterWithDash({
      "foo-bar": "value",
      headerInlineParam: "value",
      "path-param": "value",
      "request-id": "value",
      "x-header-param": "value"
    });
    expect(isRight(result)).toBe(true);
  });
});

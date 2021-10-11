import * as url from "url";
import { isRight } from "fp-ts/lib/Either";
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

// given a spied fetch call, check if the request has been made using the provided parameter in querystring
const hasQueryParam = (paramName: string) => ([input]: Parameters<
  typeof fetch
>) => {
  const inputUrl = typeof input === "string" ? input : input.url;
  const parsedUrl = url.parse(inputUrl);
  return parsedUrl.query && ~parsedUrl.query.indexOf(paramName);
};

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

  it("should handle both parameter with dashes and underscores", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    expect(client.testParameterWithDashAnUnderscore).toEqual(
      expect.any(Function)
    );

    const result = await client.testParameterWithDashAnUnderscore({
      foo_bar: "value",
      headerInlineParam: "value",
      "path-param": "value",
      "request-id": "value",
      "x-header-param": "value"
    });
    expect(isRight(result)).toBe(true);
  });

  it("should not edit parameter names", async () => {
    // given a spied fetch call, check if the request has been made using the provided header parameter
    const hasHeaderParam = (paramName: string) => ([, init]: Parameters<
      typeof fetch
    >) => {
      return init && init.headers && paramName in init.headers;
    };

    const spiedFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >((nodeFetch as any) as typeof fetch);

    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: spiedFetch,
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

    expect(spiedFetch).toHaveBeenCalledTimes(1);
    // Because of a bug, we used to edit parameter names into camelCased ones, but they must be uses as they are named in the
    // The following ensures we're doing the right thing now
    expect(hasQueryParam("foo-bar")(spiedFetch.mock.calls[0])).toBeTruthy();
    expect(hasQueryParam("fooBar")(spiedFetch.mock.calls[0])).toBeFalsy();
    expect(hasQueryParam("request-id")(spiedFetch.mock.calls[0])).toBeTruthy();
    expect(hasQueryParam("requestId")(spiedFetch.mock.calls[0])).toBeFalsy();
    expect(
      hasHeaderParam("x-header-param")(spiedFetch.mock.calls[0])
    ).toBeTruthy();
    expect(
      hasHeaderParam("xHeaderParam")(spiedFetch.mock.calls[0])
    ).toBeFalsy();
    expect(
      hasHeaderParam("headerInlineParam")(spiedFetch.mock.calls[0])
    ).toBeTruthy();
  });

  it("should strip out undefined query params", async () => {
    const spiedFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >((nodeFetch as any) as typeof fetch);

    const client = createClient<"bearerToken">({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: spiedFetch,
      basePath: "",
      withDefaults: (op: any) => (params: any) =>
        op({ ...params, bearerToken: "abc123" })
    });

    expect(client.testAuthBearer).toEqual(expect.any(Function));

    const result = await client.testAuthBearer({
      qr: "string",
      qo: undefined
    });

    expect(spiedFetch).toHaveBeenCalledTimes(1);
    expect(hasQueryParam("qr")(spiedFetch.mock.calls[0])).toBeTruthy();
    expect(hasQueryParam("qo")(spiedFetch.mock.calls[0])).toBeFalsy();
  });

  it("should handle parameters at path level", async () => {
    const spiedFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >((nodeFetch as any) as typeof fetch);

    const client = createClient<"bearerToken">({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: spiedFetch,
      basePath: "",
      withDefaults: (op: any) => (params: any) =>
        op({ ...params, bearerToken: "abc123" })
    });

    expect(client.testParametersAtPathLevel).toEqual(expect.any(Function));

    // It can be called with expected query parameters
    const resultWithCursor = await client.testParametersAtPathLevel({
      "request-id": "an id",
      cursor: "a cursor"
    });

    // It can be called without optional parameters
    const result = await client.testParametersAtPathLevel({
      "request-id": "an id"
    });
    
    // It cannot be called without optional parameters
    // @ts-expect-error
    await client.testParametersAtPathLevel({
      cursor: "a cursor"
    });
  });
});

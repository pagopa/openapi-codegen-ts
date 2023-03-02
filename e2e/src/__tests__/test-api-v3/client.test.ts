import * as url from "url";
import { isRight, right } from "fp-ts/lib/Either";
import nodeFetch from "node-fetch";
import config from "../../config";
import { createClient } from "../../generated/testapiV3/client";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
import { NewModel } from "../../generated/testapiV3/NewModel";
import { Readable } from "stream";
import { closeServer, startServer } from "../../server";
import { IncomingMessage, ServerResponse } from "http";
leaked.set({ debugSockets: true });

// Use same config as
const { skipClient } = config;
const { generatedFilesDir, mockPort, isSpecEnabled } = config.specs.testapiV3;

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

  it("should raise an exception when calling file upload from ode runtime environment", async () => {
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

    expect(client.testBinaryFileUpload).toEqual(expect.any(Function));

    const base64File =
      "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";

    var blob = Buffer.from(base64File, "base64");

    expect.assertions(2);
    try {
      await client.testBinaryFileUpload({
        body: {} as File
      });
    } catch (e) {
      expect(e).toEqual(
        Error(
          "File upload is only support inside a browser runtime envoronment"
        )
      );
    }
  });

  it("should make patch http request", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    expect(client.testParameterWithDash).toEqual(expect.any(Function));

    const result = await client.testSimplePatch({
      "foo-bar": "value",
      headerInlineParam: "value",
      "path-param": "value",
      "request-id": "value",
      "x-header-param": "value"
    });
    expect(isRight(result)).toBe(true);
  });

  it("should handle buffer as response", async () => {
    const base64File =
      "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";
    var buffer = Buffer.from(base64File);

    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    expect(client.testBinaryFileDownload).toEqual(expect.any(Function));

    const result = await client.testBinaryFileDownload({});

    expect(result).toMatchObject(
      right({
        status: 200,
        value: buffer
      })
    );
  });

  it("should allow any custom header", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    expect(client.testCustomTokenHeader).toEqual(expect.any(Function));

    const result = await client.testCustomTokenHeader({
      customToken: "anystring"
    });
    expect(isRight(result)).toBe(true);
  });

  it("should handle model ref model in body", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    const aData: NewModel = {
      id: "anId",
      name: "aName"
    };

    expect(client.testParameterWithBodyReference).toEqual(expect.any(Function));
    client.testParameterWithBodyReference({ body: aData });
    // @ts-expect-error
    client.testParameterWithBodyReference({ body: "" });
  });

  it("should handle model ref model in body for put operation", async () => {
    const client = createClient({
      baseUrl: `http://localhost:${mockPort}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    const aData: NewModel = {
      id: "anId",
      name: "aName"
    };

    expect(client.putTestParameterWithBodyReference).toEqual(
      expect.any(Function)
    );
    client.putTestParameterWithBodyReference({ body: aData });
    // @ts-expect-error
    client.putTestParameterWithBodyReference({ body: "" });
  });
  

  it("should handle model ref model in body as readablestream", async () => {
    const aData: NewModel = {
      id: "anId",
      name: "aName"
    };

    const mockTestEndpoint = jest.fn((request: IncomingMessage, response: ServerResponse) => {
      let data = "";
      request.on("data", chunk => data += chunk)
      request.on("end", () => {
        expect(JSON.parse(data)).toEqual(aData);
        response.statusCode = 201;
        response.end();
      })
      
  } );
    const server = await startServer(mockPort+10, mockTestEndpoint);

    const client = createClient({
      baseUrl: `http://localhost:${mockPort+10}`,
      fetchApi: (nodeFetch as any) as typeof fetch,
      basePath: ""
    });

    const aDataAsBuffer = Readable.from(Buffer.from(JSON.stringify(aData))) as unknown as ReadableStream<Uint8Array>;

    expect(client.testParameterWithBodyReference).toEqual(expect.any(Function));
    const response = await client.testParameterWithBodyReference({ body: aDataAsBuffer });

    expect(mockTestEndpoint).toHaveBeenCalledTimes(1);
    

    await closeServer(server);
  });
});

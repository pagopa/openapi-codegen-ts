/* tslint:disable:no-duplicate-string */

import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import { getAuthHeaders, parseOperation } from "../parse";

let spec: OpenAPIV2.Document;
beforeAll(
  async () =>
    (spec = (await SwaggerParser.bundle(
      `${process.cwd()}/__mocks__/api.yaml`
    )) as OpenAPIV2.Document)
);

describe("getAuthHeaders", () => {
  it("should parse a security definition with bearer token", () => {
    // basically, this tell which security defintion we select
    const security = [
      {
        bearerToken: []
      }
    ];
    const parsed = getAuthHeaders(spec.securityDefinitions, security);

    expect(parsed).toEqual([
      expect.objectContaining({
        authScheme: "bearer",
        headerName: "Authorization",
        in: "header",
        name: "bearerToken",
        tokenType: "apiKey",
        type: "string"
      })
    ]);
  });
});
describe("parseOperation", () => {
  it("should parse an operation with external parameter", () => {
    const parsed = parseOperation(
      spec,
      "/test-auth-bearer",
      [],
      "undefined",
      "undefined"
    )("get");

    expect(parsed).toEqual(
      expect.objectContaining({
        method: "get",
        path: "/test-auth-bearer",
        parameters: expect.arrayContaining([
          { name: "qo?", in: "query", type: "string" },
          { name: "qr", in: "query", type: "string" },
          // cursor is defined as external parameter
          { name: "cursor?", in: "query", type: "string" }
        ])
      })
    );
  });

  it("should parse an operation which parameter has schema reference", () => {
    const parsed = parseOperation(
      spec,
      "/test-parameter-with-reference",
      [],
      "undefined",
      "undefined"
    )("post");

    expect(parsed).toEqual(
      expect.objectContaining({
        method: "post",
        path: "/test-parameter-with-reference",
        parameters: expect.arrayContaining([
          { name: "createdMessage?", in: "body", type: "Message" }
        ])
      })
    );
  });
});

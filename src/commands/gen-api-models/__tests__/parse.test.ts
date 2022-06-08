/* eslint-disable sonarjs/no-duplicate-string */

import { OpenAPIV2, OpenAPIV3 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import { isOpenAPIV2 } from "../index";

import { getDefinitionOrFail, getParser } from "./_parser.utils";

let spec: OpenAPIV2.Document | OpenAPIV3.Document;

describe.each`
  version | specPath
  ${2}    | ${`${process.cwd()}/__mocks__/api.yaml`}
  ${3}    | ${`${process.cwd()}/__mocks__/openapi_v3/api.yaml`}
`("Openapi V$version |> getAuthHeaders", ({ version, specPath }) => {
  beforeAll(async () => {
    spec = (await SwaggerParser.bundle(specPath)) as
      | OpenAPIV2.Document
      | OpenAPIV3.Document;
  });

  it("should parse a security definition with bearer token", () => {
    // basically, this tell which security defintion we select
    const security = [
      {
        bearerToken: []
      }
    ];
    const parsed = isOpenAPIV2(spec)
      ? getParser(spec).getAuthHeaders(spec.securityDefinitions, security)
      : getParser(spec).getAuthHeaders(
          spec?.components?.securitySchemes,
          security
        );

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

  it("should parse a security definition with no auth schema", () => {
    // basically, this tell which security defintion we select
    const security = [
      {
        simpleToken: []
      }
    ];
    const parsed = isOpenAPIV2(spec)
      ? getParser(spec).getAuthHeaders(spec.securityDefinitions, security)
      : getParser(spec).getAuthHeaders(
          spec?.components?.securitySchemes,
          security
        );

    expect(parsed).toEqual([
      expect.objectContaining({
        authScheme: "none",
        headerName: "X-Functions-Key",
        in: "header",
        name: "simpleToken",
        tokenType: "apiKey",
        type: "string"
      })
    ]);
  });
});

describe.each`
  version | specPath
  ${2}    | ${`${process.cwd()}/__mocks__/api.yaml`}
  ${3}    | ${`${process.cwd()}/__mocks__/openapi_v3/api.yaml`}
`("Openapi V$version |> parseOperation", ({ specPath }) => {
  beforeAll(async () => {
    spec = (await SwaggerParser.bundle(specPath)) as
      | OpenAPIV2.Document
      | OpenAPIV3.Document;
  });

  it("should parse an operation with external parameter", () => {
    const parsed = getParser(spec).parseOperation(
      // @ts-ignore
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
    const parsed = getParser(spec).parseOperation(
      //@ts-ignore
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
          { name: "request-id?", in: "query", type: "string" }
        ])
      })
    );
  });

  it("should parse an operation with body as ref", () => {
    const parsed = getParser(spec).parseOperation(
      //@ts-ignore
      spec,
      "/test-parameter-with-body-ref",
      [],
      "undefined",
      "undefined"
    )("post");

    expect(parsed).toEqual(
      expect.objectContaining({
        method: "post",
        path: "/test-parameter-with-body-ref",
        parameters: expect.arrayContaining([
          {
            name: "body?",
            in: "body",
            type: "Message"
          }
        ])
      })
    );
  });

  it("should parse an operation with header parameters", () => {
    const parsed = getParser(spec).parseOperation(
      //@ts-ignore
      spec,
      "/test-parameter-with-dash/{path-param}",
      [],
      "undefined",
      "undefined"
    )("get");

    expect(parsed).toEqual(
      expect.objectContaining({
        method: "get",
        path: "/test-parameter-with-dash/{path-param}",
        parameters: expect.arrayContaining([
          { name: "path-param?", in: "path", type: "string" },
          { name: "foo-bar?", in: "query", type: "string" },
          { name: "request-id?", in: "query", type: "string" },
          {
            headerName: "x-header-param",
            in: "header",
            name: "x-header-param",
            type: "string"
          }
        ])
      })
    );
  });
});

describe.each`
  version | specPath
  ${2}    | ${`${process.cwd()}/__mocks__/api.yaml`}
  ${3}    | ${`${process.cwd()}/__mocks__/openapi_v3/api.yaml`}
`("Openapi V$version |> parseDefinition", ({ version, specPath }) => {
  beforeAll(async () => {
    spec = (await SwaggerParser.bundle(specPath)) as
      | OpenAPIV2.Document
      | OpenAPIV3.Document;
  });

  it("should parse a oneOf definition (allOf and x-one-of for V2)", () => {
    // since oneOf does not exist in V2, we faked it using custom "x-one-of: true" property over allOf
    const definitionName = version === 2 ? "AllOfOneOfTest" : "OneOfTest";
    const definition = getDefinitionOrFail(spec, definitionName);

    const parsed = getParser(spec).parseDefinition(
      // @ts-ignore
      definition
    );

    expect(parsed.allOf).not.toBeDefined();
    expect(parsed.oneOf).toBeDefined();
  });

  it("should parse a definition with allOf", () => {
    const definition = getDefinitionOrFail(spec, "AllOfTest");

    const parsed = getParser(spec).parseDefinition(
      // @ts-ignore
      definition
    );

    expect(parsed.allOf).toBeDefined();
    expect(parsed.oneOf).not.toBeDefined();
  });

  it("should parse a definition with x-extensible-enum", () => {
    const definition = getDefinitionOrFail(spec, "PreferredLanguage");

    const parsed = getParser(spec).parseDefinition(
      // @ts-ignore
      definition
    );

    expect(parsed.enum).toEqual(expect.any(Array));
  });

  it("should handle AnObjectWithAnItemsField", async () => {
    const definition = getDefinitionOrFail(spec, "AnObjectWithAnItemsField");

    const parsed = getParser(spec).parseDefinition(
      // @ts-ignore
      definition
    );

    //expect(parsed).toEqual({});
    expect(parsed.type).toBe("object");
    expect(parsed.properties?.items).toEqual(expect.any(Object));

    if (parsed.properties?.items && "type" in parsed.properties?.items) {
      expect(parsed.properties?.items.type).toBe("array");
      expect(parsed.properties?.items.items).toEqual(
        expect.objectContaining({
          $ref: expect.stringMatching(
            "^#/(definitions|components/schemas)/DefinitionFieldWithDash$"
          )
        })
      );
    } else {
      fail("a type should be specified");
    }
  });
});

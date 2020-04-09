/* tslint:disable:no-duplicate-string */

import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import {
  getAuthHeaders,
  initNunJucksEnvironment,
  parseAllOperations,
  parseOperation,
  renderDefinitionCode,
  renderOperation,
} from "../gen-api-models";

const env = initNunJucksEnvironment();

let spec: OpenAPIV2.Document;
beforeAll(
  async () =>
    (spec = (await SwaggerParser.bundle(
      `${__dirname}/api.yaml`
    )) as OpenAPIV2.Document)
);

describe("gen-api-models", () => {
  it("should not generate duplicate imports", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const profileDefinition = spec.definitions.Profile;
    expect(profileDefinition).toBeDefined();
    const code = await renderDefinitionCode(
      env,
      "Profile",
      profileDefinition,
      false
    );
    expect(code).toBeDefined();
    expect(code).toMatchSnapshot("dup-imports");
  });

  it("should handle WithinRangeStrings", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }

    const definition = spec.definitions.WithinRangeStringTest;
    const code = await renderDefinitionCode(
      env,
      "WithinRangeStringTest",
      definition,
      false
    );
    expect(code).toContain("WithinRangeString(10, 11)");
    expect(code).toMatchSnapshot("within-range-strings");
  });

  it("should handle NonNegativeNumbers", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }

    const definition = spec.definitions.NonNegativeNumberTest;
    const code = await renderDefinitionCode(
      env,
      "NonNegativeNumberTest",
      definition,
      false
    );
    expect(code).toContain("NonNegativeNumber");
    expect(code).toMatchSnapshot("non-negative-numbers");
  });

  it("should handle NonNegativeIntegers", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }

    const definition = spec.definitions.NonNegativeIntegerTest;
    const code = await renderDefinitionCode(
      env,
      "NonNegativeIntegerTest",
      definition,
      false
    );
    expect(code).toContain("NonNegativeInteger");
    expect(code).toMatchSnapshot("non-negative-integer");
  });

  it("should handle WithinRangeNumbers", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.WithinRangeNumberTest;
    const code = await renderDefinitionCode(
      env,
      "WithinRangeNumberTest",
      definition,
      false
    );
    expect(code).toContain("WithinRangeNumber");
    expect(code).toMatchSnapshot("within-range-numbers");
  });

  it("should handle WithinRangeIntegers", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.WithinRangeIntegerTest;
    const code = await renderDefinitionCode(
      env,
      "WithinRangeIntegerTest",
      definition,
      false
    );
    expect(code).toContain("WithinRangeInteger");
    expect(code).toMatchSnapshot("within-range-integer");
  });

  it("should handle CustomStringFormats", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.CustomStringFormatTest;
    const code = await renderDefinitionCode(
      env,
      "CustomStringFormatTest",
      definition,
      false
    );
    expect(code).toContain(
      "import { SomeCustomStringType as SomeCustomStringTypeT }"
    );
    expect(code).toMatchSnapshot("custom-string-format");
  });

  it("should handle enums", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.EnumTest;
    const code = await renderDefinitionCode(env, "EnumTest", definition, false);
    expect(code).toMatchSnapshot("enum-simple");
  });

  it("should generate a dictionary from additionalProperties", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.AdditionalPropsTest;
    const code = await renderDefinitionCode(
      env,
      "AdditionalPropsTest",
      definition,
      false
    );
    expect(code).toContain("t.dictionary");
    expect(code).toMatchSnapshot("additional-properties");
  });

  it("should generate a dictionary from additionalProperties: true", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.AdditionalPropsTrueTest;
    const code = await renderDefinitionCode(
      env,
      "AdditionalPropsTrueTest",
      definition,
      false
    );
    expect(code).toContain("t.dictionary");
    expect(code).toContain("t.any");
    expect(code).toMatchSnapshot("additional-properties-true");
  });

  it("should support additionalProperties default value", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.AdditionalpropsDefault;
    const code = await renderDefinitionCode(
      env,
      "AdditionalpropsDefault",
      definition,
      false
    );
    expect(code).toContain("t.dictionary");
    expect(code).toContain("withDefault");
    expect(code).toMatchSnapshot("additional-properties-default");
  });

  it("should generate a type intersection from allOf", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.AllOfTest;
    const code = await renderDefinitionCode(
      env,
      "AllOfTest",
      definition,
      false
    );
    expect(code).toContain("t.intersection");
    expect(code).toContain("PaginationResponse");
    expect(code).toMatchSnapshot("all-of-test");
  });

  it("should generate a type union from oneOf", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.OneOfTest;
    const code = await renderDefinitionCode(
      env,
      "OneOfTest",
      definition,
      false
    );
    expect(code).toContain("t.union");
    expect(code).toMatchSnapshot("oneof-test");
  });

  it("should generate a type union from allOf when x-one-of is used", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.AllOfOneOfTest;
    const code = await renderDefinitionCode(
      env,
      "AllOfOneOfTest",
      definition,
      false
    );
    expect(code).toContain("t.union");
    expect(code).toContain("PaginationResponse");
    expect(code).toMatchSnapshot("allofoneof-test");
  });

  it("should parse custom inline properties", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.InlinePropertyTest;
    const code = await renderDefinitionCode(
      env,
      "InlinePropertyTest",
      definition,
      false
    );
    expect(code).toContain("PatternString");
    expect(code).toMatchSnapshot("inline-property");
  });

  it("should parse nested objects", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.NestedObjectTest;
    const code = await renderDefinitionCode(
      env,
      "NestedObjectTest",
      definition,
      false
    );
    expect(code).toContain("t.TypeOf<typeof NestedObjectTest>");
    expect(code).toMatchSnapshot("nested-object");
  });

  it("should include aliases for types already defined elsewhere if they have the same name", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.OrganizationFiscalCode;
    const code = await renderDefinitionCode(
      env,
      "OrganizationFiscalCode",
      definition,
      false
    );
    expect(code).toContain(
      "import { OrganizationFiscalCode as OrganizationFiscalCodeT }"
    );
  });

  it("should include aliases for types already defined elsewhere if they have a different name", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.OrganizationFiscalCodeTest;
    const code = await renderDefinitionCode(
      env,
      "OrganizationFiscalCodeTest",
      definition,
      false
    );
    expect(code).toContain("OrganizationFiscalCodeTest");
    expect(code).toMatchSnapshot("defined-type");
  });

  it("should generate the operator definition", async () => {
    const operationInfo = parseOperation(
      spec,
      "/test-auth-bearer",
      [],
      "undefined",
      "undefined"
    )("get");

    if (operationInfo) {
      const code = renderOperation(operationInfo, true);
      expect(code.e1).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should support file uploads", async () => {
    const operationInfo = parseOperation(
      spec,
      "/test-file-upload",
      [],
      "undefined",
      "undefined"
    )("post");

    if (operationInfo) {
      const code = renderOperation(operationInfo, true);
      expect(code.e1).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should parse operations", () => {
    const expected = [
      {
        path: "/api/v1/test-auth-bearer",
        headers: ["Authorization"],
        importedTypes: new Set(),
        method: "get",
        operationId: "testAuthBearer",
        parameters: [
          {
            name: "bearerToken",
            type: "string",
            in: "header",
            headerName: "Authorization",
            tokenType: "apiKey"
          },
          {
            name: "qo?",
            type: "string",
            in: "query"
          },
          {
            name: "qr",
            type: "string",
            in: "query"
          }
        ],
        responses: [
          { e1: "200", e2: "undefined" },
          { e1: "403", e2: "undefined" }
        ],
        produces: "application/json"
      },
      {
        path: "/api/v1/test-file-upload",
        headers: ["Content-Type"],
        importedTypes: new Set(),
        method: "post",
        operationId: "testFileUpload",
        parameters: [
          {
            name: "file",
            type: "{ uri: string, name: string, type: string }",
            in: "formData"
          }
        ],
        responses: [{ e1: "200", e2: "undefined" }],
        consumes: "multipart/form-data",
        produces: "application/json"
      }
    ];

    const allOperations = parseAllOperations(spec, "undefined", "undefined");

    expect(allOperations).toEqual(expected);
  });
});

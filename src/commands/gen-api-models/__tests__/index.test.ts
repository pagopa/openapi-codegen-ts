import { object } from "io-ts";
/* tslint:disable:no-duplicate-string */

import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import {
  parseAllOperations,
  parseOperation,
} from "../parse";
import {
  renderClientCode,
  renderDefinitionCode,
  renderOperation,
  renderAllOperations
} from "../render";

let spec: OpenAPIV2.Document;
beforeAll(
  async () =>
    (spec = (await SwaggerParser.bundle(
      `${process.cwd()}/__mocks__/api.yaml`
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
      "Profile",
      profileDefinition,
      false,
      false
    );
    expect(code).toBeDefined();
    expect(code).toMatchSnapshot("dup-imports");
  });

  it("should not camel-case properties by default", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }

    const definition = spec.definitions.PaginationResponse;
    expect(definition).toBeDefined();
    const code = await renderDefinitionCode(
      "PaginationResponse",
      definition,
      false
    );
    expect(code).toContain("page_size");
    expect(code).not.toContain("pageSize");
  });

  it("should handle camel-cased props", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }

    const definition = spec.definitions.PaginationResponse;
    expect(definition).toBeDefined();
    const code = await renderDefinitionCode(
      "PaginationResponse",
      definition,
      false,
      true
    );
    expect(code).toContain("pageSize");
    expect(code).not.toContain("page_size");
  });

  it("should handle WithinRangeStrings", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }

    const definition = spec.definitions.WithinRangeStringTest;
    const code = await renderDefinitionCode(
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
    const code = await renderDefinitionCode("EnumTest", definition, false);
    expect(code).toMatchSnapshot("enum-simple");
  });

  it("should generate a dictionary from additionalProperties", async () => {
    if (!spec.definitions) {
      fail("no definitions in the spec");
      return;
    }
    const definition = spec.definitions.AdditionalPropsTest;
    const code = await renderDefinitionCode(
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
    const code = await renderDefinitionCode("AllOfTest", definition, false);
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
    const code = await renderDefinitionCode("OneOfTest", definition, false);
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
      expect(code).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should generate a module with all definitions", async () => {
    const operationInfo1 = parseOperation(
      spec,
      "/test-auth-bearer",
      [],
      "undefined",
      "undefined"
    )("get");
    const operationInfo2 = parseOperation(
      spec,
      "/test-file-upload",
      [],
      "undefined",
      "undefined"
    )("post");

    if (operationInfo1 && operationInfo2) {
      const code = renderAllOperations([operationInfo1, operationInfo2], true)
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should support multiple success cases", async () => {
    const operationInfo = parseOperation(
      spec,
      "/test-multiple-success",
      [],
      "undefined",
      "undefined"
    )("get");

    if (operationInfo) {
      const code = renderOperation(operationInfo, true);
      expect(code).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should support headers in response", async () => {
    const operationInfo = parseOperation(
      spec,
      "/test-response-header",
      [],
      "undefined",
      "undefined"
    )("get");

    if (operationInfo) {
      const code = renderOperation(operationInfo, true);
      expect(code).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should parse operations", () => {
    const expected = [
      {
        path: "/test-auth-bearer",
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
          },
          {
            name: "cursor?",
            type: "string",
            in: "query"
          }
        ],
        responses: [
          { e1: "200", e2: "undefined", e3: [] },
          { e1: "403", e2: "undefined", e3: [] }
        ],
        produces: "application/json"
      },
      {
        path: "/test-multiple-success",
        headers: [],
        importedTypes: new Set(["Message", "OneOfTest"]),
        method: "get",
        operationId: "testMultipleSuccess",
        parameters: [],
        responses: [
          { e1: "200", e2: "Message", e3: [] },
          { e1: "202", e2: "undefined", e3: [] },
          { e1: "403", e2: "OneOfTest", e3: [] },
          { e1: "404", e2: "undefined", e3: [] }
        ],
        produces: "application/json"
      },
      {
        path: "/test-file-upload",
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
        responses: [{ e1: "200", e2: "undefined", e3: [] }],
        consumes: "multipart/form-data",
        produces: "application/json"
      },
      {
        path: "/test-response-header",
        headers: [],
        importedTypes: new Set(["Message"]),
        method: "get",
        operationId: "testResponseHeader",
        parameters: [],
        responses: [
          { e1: "201", e2: "Message", e3: ["Location", "Id"] },
          { e1: "500", e2: "undefined", e3: [] }
        ],
        produces: "application/json"
      }
    ];

    const allOperations = parseAllOperations(spec, "undefined", "undefined");

    expect(allOperations).toEqual(expected);
  });

  it("should render a client", async () => {
    const allOperations = parseAllOperations(spec, "undefined", "undefined");
    const code = await renderClientCode(spec, allOperations);

    expect(code).toMatchSnapshot();
  });

  it("should parse external definitions and their dependencies when they are NOT referenced in the spec", async () => {
    // Person, Address and ZipCode are defined in an external defintion file
    const { Person, Address, ZipCode } = spec.definitions || {};
    
    // Person is referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    expect(Person).toEqual({
      type: "object",
      properties:  expect.any(Object)
    });

    // address is defined by Address, which is not referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    // There's no reference to "Address" definition name anymore
    expect(Person?.properties?.address).toEqual({
      type: "object",
      properties: {
        location: expect.any(Object),
        city: expect.any(Object),
        zipCode: expect.any(Object)
      }
    });
    // there's no definition for Address
    expect(Address).not.toBeDefined();

    // zipCode is defined by ZipCode, which is not referenced by the spec
    // ZipCode is a dependency of Address and it's local to it in the external definition file
    // It's resolved by including its properties as literal value of the parsed definition object
    // There's no reference to "ZipCode" definition name anymore
    expect(Person?.properties?.address?.properties?.zipCode).toEqual(
      expect.objectContaining({
        pattern: expect.any(String),
        type: "string"
      })
    );
    // there's no definition for ZipCode
    expect(ZipCode).not.toBeDefined();
  });

  it("should parse external definitions and their dependencies when they are referenced in the spec", async () => {
    // Book, Author and Person are defined in an external defintion file
    const { Book, Author, Person } = spec.definitions || {};
    
    // Book is referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    expect(Book).toEqual({
      type: "object",
      properties: expect.any(Object)
    });

    // author is defined by Author which is not referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    // There's no reference to "Author" definition name anymore
    expect(Book?.properties?.author).toEqual({
      type: "object",
      properties: {
        isDead: expect.any(Object),
        // Person is a dependency of Author which is already referenced by the spec
        info: {
          $ref: "#/definitions/Person"
        }
      }
    });
    // there's no definition for Author
    expect(Author).not.toBeDefined();
    // there's a definition for Person
    expect(Person).toBeDefined();
  });
});

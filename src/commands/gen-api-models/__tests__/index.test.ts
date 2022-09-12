/* eslint-disable sonarjs/no-duplicate-string */

import { OpenAPIV2, OpenAPIV3 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";
import { isOpenAPIV2 } from "../parse.v2";

import {
  renderClientCode,
  renderDefinitionCode,
  renderOperation,
  renderAllOperations
} from "../render";
import { ISpecMetaInfo } from "../types";

import { getDefinitionOrFail, getParser } from "./utils/parser.utils";

let spec: OpenAPIV2.Document | OpenAPIV3.Document;

describe.each`
  version | specPath
  ${2}    | ${`${process.cwd()}/__mocks__/api.yaml`}
  ${3}    | ${`${process.cwd()}/__mocks__/openapi_v3/api.yaml`}
`("Openapi V$version |> gen-api-models", ({ version, specPath }) => {
  beforeAll(async () => {
    spec = (await SwaggerParser.bundle(specPath)) as
      | OpenAPIV2.Document
      | OpenAPIV3.Document;
  });

  it("should not generate duplicate imports", async () => {
    const definition = getDefinitionOrFail(spec, "Profile");

    expect(definition).toBeDefined();
    const code = await renderDefinitionCode(
      "Profile",
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false,
      false
    );
    expect(code).toBeDefined();
    expect(code).toMatchSnapshot("dup-imports");
  });

  it("should not camel-case properties by default", async () => {
    const definition = getDefinitionOrFail(spec, "PaginationResponse");

    expect(definition).toBeDefined();
    const code = await renderDefinitionCode(
      "PaginationResponse",
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );
    expect(code).toContain("page_size");
    expect(code).not.toContain("pageSize");
  });

  it("should handle camel-cased props", async () => {
    const definition = getDefinitionOrFail(spec, "PaginationResponse");

    const code = await renderDefinitionCode(
      "PaginationResponse",
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false,
      true
    );
    expect(code).toContain("pageSize");
    expect(code).not.toContain("page_size");
  });

  it("should handle WithinRangeStrings", async () => {
    const definitonName = "WithinRangeStringTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );
    expect(code).toContain("WithinRangeString(8, 11)");
    expect(code).toMatchSnapshot("within-range-strings");
  });

  it("should handle NonNegativeNumbers", async () => {
    const definitonName = "NonNegativeNumberTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );
    expect(code).toContain("NonNegativeNumber");
    expect(code).toMatchSnapshot("non-negative-numbers");
  });

  it("should handle NonNegativeIntegers", async () => {
    const definitonName = "NonNegativeIntegerTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("NonNegativeInteger");
    expect(code).toMatchSnapshot("non-negative-integer");
  });

  it("should handle WithinRangeNumbers", async () => {
    const definitonName = "WithinRangeNumberTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("WithinRangeNumber");
    expect(code).toMatchSnapshot("within-range-numbers");
  });

  it("should handle WithinRangeIntegers", async () => {
    const definitonName = "WithinRangeIntegerTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("WithinRangeInteger");
    expect(code).toMatchSnapshot("within-range-integer");
  });

  it("should handle CustomStringFormats", async () => {
    const definitonName = "CustomStringFormatTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain(
      "import { SomeCustomStringType as SomeCustomStringTypeT }"
    );
    expect(code).toMatchSnapshot("custom-string-format");
  });

  it("should handle enums", async () => {
    const definitonName = "EnumTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toMatchSnapshot("enum-simple");
  });

  it("should generate a record from additionalProperties", async () => {
    const definitonName = "AdditionalPropsTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("t.record");
    expect(code).not.toContain("t.dictionary");
    expect(code).toMatchSnapshot("additional-properties");
  });

  it("should generate a record from additionalProperties: true", async () => {
    const definitonName = "AdditionalPropsTrueTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("t.record");
    expect(code).not.toContain("t.dictionary");
    expect(code).toContain("t.any");
    expect(code).toMatchSnapshot("additional-properties-true");
  });

  it("should support additionalProperties default value", async () => {
    const definitonName = "AdditionalpropsDefault";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("t.record");
    expect(code).not.toContain("t.dictionary");
    expect(code).toContain("withDefault");
    expect(code).toMatchSnapshot("additional-properties-default");
  });

  it("should generate a type intersection from allOf", async () => {
    const definitonName = "AllOfTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("t.intersection");
    expect(code).toContain("PaginationResponse");
    expect(code).toMatchSnapshot("all-of-test");
  });

  it("should not generate a type intersection from allOf with one element", async () => {
    const definitonName = "AllOfWithOneElementTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toMatchSnapshot("all-of-test");
  });

  it("should not generate a type intersection from allOf with one ref element", async () => {
    const definitonName = "AllOfWithOneRefElementTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toMatchSnapshot("all-of-test");
  });

  it("should not contain a t.string but an enum", async () => {
    const definitonName = "AllOfWithXExtensibleEnum";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).not.toContain("t.string");
    expect(code).toContain("enumType");
    expect(code).toMatchSnapshot("all-of-test");
  });

  it("should generate a type union from oneOf", async () => {
    const definitonName = "OneOfTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("t.union");
    expect(code).toMatchSnapshot("oneof-test");
  });

  it("should generate a type union from allOf when x-one-of is used", async () => {
    if (version === 2) {
      const definitonName = "AllOfOneOfTest";
      const definition = getDefinitionOrFail(spec, definitonName);

      const code = await renderDefinitionCode(
        definitonName,
        getParser(spec).parseDefinition(
          // @ts-ignore
          definition
        ),
        false
      );

      expect(code).toContain("t.union");
      expect(code).toContain("PaginationResponse");
      expect(code).toMatchSnapshot("allofoneof-test");
    } else {
      expect(true).toBeTruthy();
    }
  });

  it("should parse custom inline properties", async () => {
    const definitonName = "InlinePropertyTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("PatternString");
    expect(code).toMatchSnapshot("inline-property");
  });

  it("should parse nested objects", async () => {
    const definitonName = "NestedObjectTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("t.TypeOf<typeof NestedObjectTest>");
    expect(code).toMatchSnapshot("nested-object");
  });

  it("should include aliases for types already defined elsewhere if they have the same name", async () => {
    const definitonName = "OrganizationFiscalCode";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain(
      "import { OrganizationFiscalCode as OrganizationFiscalCodeT }"
    );
  });

  it("should include aliases for types already defined elsewhere if they have a different name", async () => {
    const definitonName = "OrganizationFiscalCodeTest";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toContain("OrganizationFiscalCodeTest");
    expect(code).toMatchSnapshot("defined-type");
  });

  it("should handle list of defintions", async () => {
    const definitonName = "ListOfDefinitions";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toMatchSnapshot();
  });

  it("should handle list of references", async () => {
    const definitonName = "ListOfReferences";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toMatchSnapshot();
  });

  it("should handle AnObjectWithAnItemsField", async () => {
    const definitonName = "AnObjectWithAnItemsField";
    const definition = getDefinitionOrFail(spec, definitonName);

    const code = await renderDefinitionCode(
      definitonName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      false
    );

    expect(code).toMatchSnapshot();
  });

  it.each`
    path                                        | method
    ${"/test-auth-bearer"}                      | ${"get"}
    ${"/test-parameter-with-dash/{path-param}"} | ${"get"}
  `(
    "should generate decoder definitions for ($method, $path) ",
    async ({ method, path }) => {
      const operationInfo = getParser(spec).parseOperation(
        // @ts-ignore
        spec,
        path,
        [],
        "undefined",
        "undefined"
      )(method);

      if (operationInfo) {
        const code = renderOperation(operationInfo, true);
        expect(code).toMatchSnapshot();
      } else {
        fail("failed to parse operation");
      }
    }
  );

  it("should generate a module with all definitions", async () => {
    const operationInfo1 = getParser(spec).parseOperation(
      // @ts-ignore
      spec,
      "/test-auth-bearer",
      [],
      "undefined",
      "undefined"
    )("get");
    const operationInfo2 = getParser(spec).parseOperation(
      // @ts-ignore
      spec,
      "/test-file-upload",
      [],
      "undefined",
      "undefined"
    )("post");

    if (operationInfo1 && operationInfo2) {
      const code = renderAllOperations([operationInfo1, operationInfo2], true);
      expect(code).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should support file uploads", async () => {
    const operationInfo = getParser(spec).parseOperation(
      // @ts-ignore
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
    const operationInfo = getParser(spec).parseOperation(
      // @ts-ignore
      spec,
      "/test-multiple-success",
      [],
      "undefined",
      "undefined"
    )("get");

    if (operationInfo) {
      const code = renderOperation(operationInfo, true);
      expect(code).toContain("200: Message");
      expect(code).toMatchSnapshot();
    } else {
      fail("failed to parse operation");
    }
  });

  it("should support headers in response", async () => {
    const operationInfo = getParser(spec).parseOperation(
      // @ts-ignore
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
            tokenType: "apiKey",
            authScheme: "bearer"
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
            name: version === 2 ? "file" : "body",
            type:
              version === 2
                ? `{ "uri": string, "name": string, "type": string }`
                : "File",
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
      },
      {
        path: "/test-binary-file-upload",
        headers: ["Content-Type"],
        importedTypes: new Set(),
        method: "post",
        operationId: "testBinaryFileUpload",
        parameters: [
          {
            name: version === 2 ? "logo" : "body",
            type: `File`,
            in: "formData"
          }
        ],
        responses: [{ e1: "200", e2: "undefined", e3: [] }],
        consumes: "multipart/form-data",
        produces: "application/json"
      }
    ];

    const allOperations = getParser(spec).parseAllOperations(
      // @ts-ignore
      spec,
      "undefined",
      "undefined"
    );

    expected.forEach(op =>
      expect(
        allOperations.find(e => e?.operationId === op?.operationId)
      ).toMatchObject(op)
    );
    expect(allOperations).toEqual(expect.arrayContaining(expected));
  });

  it("should render a client", async () => {
    const allOperations = getParser(spec).parseAllOperations(
      // @ts-ignore
      spec,
      "undefined",
      "undefined"
    );
    const code = await renderClientCode(spec as ISpecMetaInfo, allOperations);

    expect(code).toMatchSnapshot();
  });

  it("should parse external definitions and their dependencies when they are NOT referenced in the spec", async () => {
    // @ts-ignore
    const { Person, Address, ZipCode } = isOpenAPIV2(spec)
      ? spec.definitions
      : spec.components?.schemas || {};

    // Person is referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    expect(Person).toEqual({
      type: "object",
      properties: expect.any(Object)
    });

    // address is defined by Address, which is not referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    // There's no reference to "Address" definition name anymore
    // @ts-ignore
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
    // @ts-ignore
    expect(Person?.properties?.address?.properties?.zipCode).toEqual(
      expect.objectContaining({
        pattern: "^\\d{5}$",
        type: "string"
      })
    );
    // there's no definition for ZipCode
    expect(ZipCode).not.toBeDefined();
  });

  it("should parse external definitions and their dependencies when they are referenced in the spec", async () => {
    // Book, Author and Person are defined in an external defintion file
    // @ts-ignore
    const { Book, Author, Person } = isOpenAPIV2(spec)
      ? spec.definitions
      : spec.components?.schemas || {};

    // Book is referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    expect(Book).toEqual({
      type: "object",
      properties: expect.any(Object)
    });

    // author is defined by Author which is not referenced by the spec
    // It's resolved by including its properties as literal value of the parsed definition object
    // There's no reference to "Author" definition name anymore
    // @ts-ignore
    expect(Book?.properties?.author).toMatchObject({
      type: "object",
      properties: {
        isDead: expect.any(Object),
        // Person is a dependency of Author which is already referenced by the spec
        info: {
          $ref: expect.stringContaining("/Person")
        }
      }
    });
    // there's no definition for Author
    expect(Author).not.toBeDefined();
    // there's a definition for Person
    expect(Person).toBeDefined();
  });
});

/* tslint:disable:no-duplicate-string */

import * as SwaggerParser from "swagger-parser";

import {
  detectVersion,
  initNunJucksEnvironment,
  renderDefinitionCode,
  renderOperation
} from "../gen-api-models";

const env = initNunJucksEnvironment();

let spec: any;
beforeAll(
  async () => (spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`))
);

describe("gen-api-models", () => {
  env.addGlobal("schemas_path", "#/definitions/");

  it("should not generate duplicate imports", async () => {
    expect(spec.definitions).toBeDefined();
    if (spec.definitions === undefined) {
      fail("unexpected specs");
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

  it("should handle version of specification", async () => {
    const code = detectVersion(spec);
    expect(code.version).toContain("2");
  });

  it("should handle WithinRangeStrings", async () => {
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
    const definition = spec.definitions.EnumTest;
    const code = await renderDefinitionCode(env, "EnumTest", definition, false);
    expect(code).toMatchSnapshot("enum-simple");
  });

  it("should generate a dictionary from additionalProperties", async () => {
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
    const operation = spec.paths["/test-auth-bearer"].get;

    const code = await renderOperation(
      "get",
      operation.operationId,
      operation,
      spec.parameters,
      spec.securityDefinitions,
      [],
      {},
      "undefined",
      "undefined",
      true
    );

    expect(code.e1).toMatchSnapshot();
  });

  it("should support file uploads", async () => {
    const operation = spec.paths["/test-file-upload"].post;

    const code = await renderOperation(
      "post",
      operation.operationId,
      operation,
      spec.parameters,
      spec.securityDefinitions,
      [],
      {},
      "undefined",
      "undefined",
      true
    );

    expect(code.e1).toMatchSnapshot();
  });
});

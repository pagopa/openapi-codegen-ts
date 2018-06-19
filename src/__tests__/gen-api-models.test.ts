import * as SwaggerParser from "swagger-parser";
import { Schema, Spec } from "swagger-schema-official";

import {
  initNunJucksEnvironment,
  renderDefinitionCode
} from "../gen-api-models";

const env = initNunJucksEnvironment();

describe("gen-api-models", () => {
  it("should not generate duplicate imports", async () => {
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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

  it("should handle NonNegativeNumbers", async () => {
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
    const profileDefinition = spec.definitions.NonNegativeNumberTest;
    const code = await renderDefinitionCode(
      env,
      "NonNegativeNumberTest",
      profileDefinition,
      false
    );
    expect(code).toContain("NonNegativeNumber");
    expect(code).toMatchSnapshot("non-negative-numbers");
  });

  it("should handle WithinRangeNumbers", async () => {
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
    const profileDefinition = spec.definitions.WithinRangeNumberTest;
    const code = await renderDefinitionCode(
      env,
      "WithinRangeNumberTest",
      profileDefinition,
      false
    );
    expect(code).toContain("WithinRangeNumber");
    expect(code).toMatchSnapshot("within-range-numbers");
  });

  it("should generate a dictionary from additionalProperties", async () => {
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
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
});

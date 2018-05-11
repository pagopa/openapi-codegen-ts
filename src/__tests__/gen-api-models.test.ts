import * as SwaggerParser from "swagger-parser";
import { Spec, Schema } from "swagger-schema-official";

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
    const profileDefinition = spec.definitions["Profile"];
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
    const profileDefinition = spec.definitions["NonNegativeNumberTest"];
    const code = await renderDefinitionCode(
      env,
      "NonNegativeNumberTest",
      profileDefinition,
      false
    );
    expect(code).toMatchSnapshot("non-negative-numbers");
  });

  it("should generate a dictionary from additionalProperties", async () => {
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
    const definition = spec.definitions["AdditionalPropsTest"];
    const code = await renderDefinitionCode(
      env,
      "AdditionalPropsTest",
      definition,
      false
    );
    expect(code).toContain("t.dictionary");
    expect(code).toMatchSnapshot("additional-properties");
  });
});

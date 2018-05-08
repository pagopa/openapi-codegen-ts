import * as SwaggerParser from "swagger-parser";
import { Spec, Schema } from "swagger-schema-official";

import { initNunJucksEnvironment, renderDefinitionCode } from "../gen-api-models";

const env = initNunJucksEnvironment();

describe("gen-api-models", () => {

  it("should not generate duplicate imports", async () => {
    const spec: Spec = await SwaggerParser.bundle(`${__dirname}/api.yaml`);
    expect(spec.definitions).toBeDefined();
    if(spec.definitions === undefined) {
      fail("unexpected specs");
      return;
    }
    const profileDefinition = spec.definitions["Profile"];
    expect(profileDefinition).toBeDefined();
    const code = await renderDefinitionCode(env, "Profile", profileDefinition);
    expect(code).toBeDefined();
    expect(code).toMatchSnapshot();
  })

})
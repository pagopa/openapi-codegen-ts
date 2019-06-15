/* tslint:disable:no-duplicate-string */

import * as SwaggerParser from "swagger-parser";
import { Schema, Spec } from "swagger-schema-official";

import {
  initNunJucksEnvironment,
  renderDefinitionCode,
  renderOperation
} from "../gen-api-models";

const env = initNunJucksEnvironment();

let spec;
beforeAll(
  async () => (spec = await SwaggerParser.bundle(`${__dirname}/api-ref.yaml`))
);

describe("gen-api-models", () => {
  it("shoulds handle dependency", async () => {
    expect(spec.definitions).toBeDefined();
    if (spec.definitions === undefined) {
      fail("unexpected specs");
      return;
    }
    const definition = spec.definitions.MessageResponseWithContent;
    const code = await renderDefinitionCode(env, "MessageResponseWithContent", definition, false);
    expect(code).toBeDefined();
  });
});

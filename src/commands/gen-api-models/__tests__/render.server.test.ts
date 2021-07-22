import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import { parseAllOperations } from "../parse";
import { renderServerCode } from "../render";
describe("gen-api-models - server", () => {
  let spec: OpenAPIV2.Document;
  beforeAll(
    async () =>
      (spec = (await SwaggerParser.bundle(
        `${process.cwd()}/__mocks__/api.yaml`
      )) as OpenAPIV2.Document)
  );

  it("should render a client", async () => {
    const allOperations = parseAllOperations(spec, "undefined", "undefined");

    const definitions = spec.definitions;
    const code = await renderServerCode(spec, allOperations);

    expect(code).toMatchSnapshot();
  });
});

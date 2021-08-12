/* eslint-disable sonarjs/no-duplicate-string */

import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";
import { parseDefinition } from "../parse";

import { renderDefinitionCode } from "../render";

let spec: OpenAPIV2.Document;
beforeAll(
  async () =>
    (spec = (await SwaggerParser.bundle(
      `${process.cwd()}/__mocks__/api.yaml`
    )) as OpenAPIV2.Document)
);

describe("renderDefinitionCode", () => {
  it.each`
    case   | definitionName
    ${"1"} | ${"Message"}
    ${"2"} | ${"DefinitionFieldWithDash"}
  `("should render $case", async ({ definitionName }) => {
    if (!spec.definitions) {
      fail("dadsasa");
    }
    const code = await renderDefinitionCode(
      definitionName,
      parseDefinition(spec.definitions[definitionName]),
      true,
      false
    );
    expect(code).toMatchSnapshot();
  });
});

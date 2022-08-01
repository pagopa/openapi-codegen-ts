/* eslint-disable sonarjs/no-duplicate-string */

import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import { renderDefinitionCode, renderAllOperations } from "../render";
import { getDefinitionOrFail, getParser } from "./utils/parser.utils";

let spec: OpenAPIV2.Document;

describe.each`
  version | specPath
  ${2}    | ${`${process.cwd()}/__mocks__/api.yaml`}
  ${3}    | ${`${process.cwd()}/__mocks__/openapi_v3/api.yaml`}
`("Openapi V$version |> renderDefinitionCode", ({ version, specPath }) => {
  beforeAll(
    async () =>
      (spec = (await SwaggerParser.bundle(specPath)) as OpenAPIV2.Document)
  );

  it.each`
    case   | definitionName
    ${"1"} | ${"Message"}
    ${"2"} | ${"DefinitionFieldWithDash"}
  `("should render $case", async ({ definitionName }) => {
    const definition = getDefinitionOrFail(spec, definitionName);

    const code = await renderDefinitionCode(
      definitionName,
      getParser(spec).parseDefinition(
        // @ts-ignore
        definition
      ),
      true,
      false
    );

    expect(code).toMatchSnapshot();
  });

  it("should render RequestTypes for octet-stream", () => {
      const operationInfo1 = getParser(spec).parseOperation(
        // @ts-ignore
        spec,
        "/test-binary-file-download",
        [],
        "undefined",
        "undefined"
      )("get");
      const code = renderAllOperations([operationInfo1], true)
      expect(code).toMatchSnapshot();
    })

});

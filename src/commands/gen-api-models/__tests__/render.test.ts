/* eslint-disable sonarjs/no-duplicate-string */

import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";

import { renderDefinitionCode, renderAllOperations } from "../render";
import { getDefinitionOrFail, getParser } from "./utils/parser.utils";

import { getfirstSuccessType } from "../render";

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

describe("getfirstSuccessType", () => {
  it("should return the first successful response", () => {
    const responses = [
      { e1: "200", e2: "SuccessType", e3: [] },
      { e1: "301", e2: "RedirectType", e3: [] }
    ];
    const result = getfirstSuccessType(responses);
    expect(result).toEqual({ e1: "200", e2: "SuccessType", e3: [] });
  });

  it("should return the first redirection response if no successful response is found", () => {
    const responses = [
      { e1: "301", e2: "RedirectType", e3: [] },
      { e1: "302", e2: "AnotherRedirectType", e3: [] }
    ];
    const result = getfirstSuccessType(responses);
    expect(result).toEqual({ e1: "301", e2: "RedirectType", e3: [] });
  });

  it("should return undefined if no successful or redirection responses are found", () => {
    const responses = [
      { e1: "400", e2: "ClientErrorType", e3: [] },
      { e1: "500", e2: "ServerErrorType", e3: [] }
    ];
    const result = getfirstSuccessType(responses);
    expect(result).toBeUndefined();
  });
});
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";

import { isOpenAPIV2 } from "..";
import * as ParseOpenapiV2 from "../parse";
import * as ParseOpenapiV3 from "../parse.v3";

const parserV2 = {
  getAuthHeaders: ParseOpenapiV2.getAuthHeaders,
  parseOperation: ParseOpenapiV2.parseOperation,
  parseAllOperations: ParseOpenapiV2.parseAllOperations,
  parseDefinition: ParseOpenapiV2.parseDefinition,
  parseSpecMeta: ParseOpenapiV2.parseSpecMeta
};
const parserV3 = {
  getAuthHeaders: ParseOpenapiV3.getAuthHeaders,
  parseOperation: ParseOpenapiV3.parseOperation,
  parseAllOperations: ParseOpenapiV3.parseAllOperations,
  parseDefinition: ParseOpenapiV3.parseDefinition,
  parseSpecMeta: ParseOpenapiV3.parseSpecMeta
};

export const getParser = <D extends OpenAPIV2.Document | OpenAPIV3.Document>(
  spec: D
): D extends OpenAPIV2.Document ? typeof parserV2 : typeof parserV3 =>
  isOpenAPIV2(spec)
    ? <D extends OpenAPIV2.Document ? typeof parserV2 : typeof parserV3>parserV2
    : <D extends OpenAPIV2.Document ? typeof parserV2 : typeof parserV3>(
        parserV3
      );

// util to ensure a defintion is defined
export const getDefinitionOrFail = (
  spec: OpenAPIV2.Document | OpenAPIV3.Document,
  definitionName: string
) => {
  const definition = isOpenAPIV2(spec)
    ? spec.definitions?.[definitionName]
    : spec.components?.schemas?.[definitionName];
  if (typeof definition === "undefined") {
    fail(`Unable to find definition ${definitionName}`);
  }
  return definition;
};

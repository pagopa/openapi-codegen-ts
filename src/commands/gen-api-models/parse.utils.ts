import { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";

import * as ParseOpenapiV2 from "./parse";
import * as ParseOpenapiV3 from "./parse.v3";
import {
  IAuthHeaderParameterInfo,
  IDefinition,
  IOperationInfo,
  ISpecMetaInfo
} from "./types";
import { isOpenAPIV2 } from ".";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Parser<D extends OpenAPI.Document> = {
  readonly getAuthHeaders: (
    spec: D,
    security?: D["security"]
  ) => ReadonlyArray<IAuthHeaderParameterInfo>;
  readonly parseAllOperations: (
    spec: D,
    defaultSuccessType: string,
    defaultErrorType: string
  ) => ReadonlyArray<IOperationInfo | undefined>;
  readonly parseDefinition: (
    source:
      | OpenAPIV2.SchemaObject
      | OpenAPIV3.SchemaObject
      | OpenAPIV3.ReferenceObject
  ) => IDefinition;
  readonly parseSpecMeta: (api: OpenAPI.Document) => ISpecMetaInfo;
  readonly getAllDefinitions: (
    api: OpenAPI.Document
  ) => Record<string, IDefinition>;
};

const parserV2: Parser<OpenAPI.Document> = {
  getAllDefinitions: api => {
    const apiV2 = api as OpenAPIV2.Document;
    const definitions = apiV2.definitions ?? {};

    return Object.keys(definitions).reduce((prev, definitionName: string) => {
      // eslint-disable-next-line functional/immutable-data
      prev[definitionName] = ParseOpenapiV2.parseDefinition(
        definitions[definitionName]
      );
      return prev;
    }, {} as Record<string, IDefinition>);
  },
  getAuthHeaders: (spec, security) =>
    ParseOpenapiV2.getAuthHeaders(
      // We expect spec to be an OpenAPI V3 document
      // since it's retrieved from `getParser` factory
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      spec.securityDefinitions,
      security
    ),
  parseAllOperations: (spec, defaultSuccessType, defaultErrorType) =>
    ParseOpenapiV2.parseAllOperations(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      spec,
      defaultSuccessType,
      defaultErrorType
    ),
  parseDefinition: source =>
    ParseOpenapiV2.parseDefinition(source as OpenAPIV2.SchemaObject),
  parseSpecMeta: api =>
    ParseOpenapiV2.parseSpecMeta(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      api
    )
};

const parserV3: Parser<OpenAPI.Document> = {
  getAllDefinitions: api => {
    const apiV3 = api as OpenAPIV3.Document;
    const definitions = apiV3.components?.schemas ?? {};

    return Object.keys(definitions).reduce((prev, definitionName: string) => {
      // eslint-disable-next-line functional/immutable-data
      prev[definitionName] = ParseOpenapiV3.parseDefinition(
        definitions[definitionName]
      );
      return prev;
    }, {} as Record<string, IDefinition>);
  },
  getAuthHeaders: (spec, security) =>
    ParseOpenapiV3.getAuthHeaders(
      // We expect spec to be an OpenAPI V3 document
      // since it's retrieved from `getParser` factory
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      spec.components?.securitySchemes,
      security
    ),
  parseAllOperations: (spec, defaultSuccessType, defaultErrorType) =>
    ParseOpenapiV3.parseAllOperations(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      spec,
      defaultSuccessType,
      defaultErrorType
    ),
  parseDefinition: source =>
    ParseOpenapiV3.parseDefinition(
      source as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
    ),
  parseSpecMeta: api =>
    ParseOpenapiV3.parseSpecMeta(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      api
    )
};

export const getParser = <D extends OpenAPI.Document>(
  spec: D
): Parser<OpenAPI.Document> => (isOpenAPIV2(spec) ? parserV2 : parserV3);

import { IJsonSchema, OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";

import * as E from "fp-ts/Either";

import * as ParseOpenapiV2 from "./parse.v2";
import * as ParseOpenapiV3 from "./parse.v3";
import {
  IAuthHeaderParameterInfo,
  IDefinition,
  IOperationInfo,
  ISpecMetaInfo
} from "./types";

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
): E.Either<Error, Parser<OpenAPI.Document>> =>
  ParseOpenapiV2.isOpenAPIV2(spec)
    ? E.of(parserV2)
    : ParseOpenapiV3.isOpenAPIV3(spec)
    ? E.of(parserV3)
    : E.left(Error("The specification must be of type OpenAPI 2 or 3"));

export const inferDefinitionType = (source: IJsonSchema): string => {
  const invalidTypeError = (receivedType: string): Error =>
    new Error(
      `Value MUST be a string. Multiple types via an array are not supported. Received: ${receivedType}`
    );

  // We expect type to be a single string
  if (typeof source.type === "string") {
    return source.type;
  }
  // As for JSON Schema, "type" might be an array of string
  // Anyway, this is not permitted by OpenAPI
  // https://swagger.io/specification/#schema-object
  else if (Array.isArray(source.type)) {
    throw invalidTypeError("Array");
  }
  // If source contains a "property" or "additionalProperties" field, we assume is an object even if "type" is not defined
  // This to be allow specification to work even when they are less then perfect
  else if ("properties" in source || "additionalProperties" in source) {
    return "object";
  }
  // For unknown cases, we throw
  else {
    throw invalidTypeError("undefined");
  }
};

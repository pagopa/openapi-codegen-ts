import { ITuple3 } from "italia-ts-commons/lib/tuples";
import { OpenAPIV2 } from "openapi-types";

/**
 * Defines the set of parameters for the code generation
 */
export interface IGenerateApiOptions {
  specFilePath: string | OpenAPIV2.Document;
  definitionsDirPath: string;
  tsSpecFilePath?: string;
  strictInterfaces?: boolean;
  generateRequestTypes?: boolean;
  generateResponseDecoders?: boolean;
  generateClient?: boolean;
  defaultSuccessType?: string;
  defaultErrorType?: string;
  camelCasedPropNames: boolean;
}

/**
 * Supported http methods
 */
export type SupportedMethod = "get" | "post" | "put" | "delete";

/**
 * Define the shape of a parsed parameter
 */
export interface IParameterInfo {
  name: string;
  type: string;
  in: string;
  headerName?: string;
}
/**
 * Define the shape of a parameter of type header
 */
export interface IHeaderParameterInfo extends IParameterInfo {
  in: "header";
  headerName: string;
}

/**
 * Define the shape of a parameter of type header which is also an auth parameter
 */
export interface IAuthHeaderParameterInfo extends IHeaderParameterInfo {
  tokenType: "basic" | "apiKey" | "oauth2";
}

/**
 * Define the shape of a parsed operation
 */
export interface IOperationInfo {
  method: SupportedMethod;
  operationId: string;
  parameters: IParameterInfo[];
  responses: Array<ITuple3<string, string, string[]>>;
  headers: string[];
  importedTypes: Set<string>;
  path: string;
  consumes?: string;
  produces?: string;
}

/**
 * Define the shape of an object containing the specification meta info
 */
export interface ISpecMetaInfo {
  basePath?: string;
  version?: string;
  title?: string;
}

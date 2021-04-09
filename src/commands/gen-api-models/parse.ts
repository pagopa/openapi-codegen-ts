/**
 * This module collects pure utility functions that convert a OpenAPI specification object into a shape which is convenient for code generation
 */

import { ITuple2, Tuple2, Tuple3 } from "@pagopa/ts-commons/lib/tuples";
import { OpenAPIV2 } from "openapi-types";
import { uncapitalize } from "../../lib/utils";
import {
  ExtendedOpenAPIV2SecuritySchemeApiKey,
  IAuthHeaderParameterInfo,
  IHeaderParameterInfo,
  IOperationInfo,
  IParameterInfo,
  ISpecMetaInfo,
  SupportedMethod
} from "./types";
/**
 * Extracts meta info in a convenient object
 *
 * @param api
 */
export function parseSpecMeta(api: OpenAPIV2.Document): ISpecMetaInfo {
  return {
    basePath: api.basePath,
    version: api.info?.version,
    title: api.info?.title
  };
}

/**
 * Iterates over all operations in the specifications and returns a list of IOperationInfo struct describing them.
 * It also flattens global parameters and definitions by place them in each operation
 *
 * @param api
 * @param defaultSuccessType
 * @param defaultErrorType
 *
 * @returns a list with all operation parsed
 */
export function parseAllOperations(
  api: OpenAPIV2.Document,
  defaultSuccessType: string,
  defaultErrorType: string
) {
  // map global auth headers only if global security is defined
  const globalAuthHeaders = api.security
    ? getAuthHeaders(api.securityDefinitions, api.security)
    : [];

  return Object.keys(api.paths)
    .map(path => {
      const pathSpec = api.paths[path];
      const extraParameters = [
        ...parseExtraParameters(pathSpec),
        ...globalAuthHeaders
      ];
      return Object.keys(pathSpec)
        .map(
          parseOperation(
            api,
            path,
            extraParameters,
            defaultSuccessType,
            defaultErrorType
          )
        )
        .filter(Boolean);
    })
    .reduce((flatten, elems) => flatten.concat(elems), []);
}

/**
 * It extracts global parameters from a path definition. Parameters in body, path, query and form are of type IParameterInfo, while header parameters are of type IHeaderParameterInfo
 *
 * @param pathSpec a pat definition
 *
 * @returns a list of parameters that applies to all methods of a path. Header parameters ship a more complete structure.
 */
const parseExtraParameters = (
  pathSpec: OpenAPIV2.PathsObject
): ReadonlyArray<IParameterInfo | IHeaderParameterInfo> =>
  typeof pathSpec.parameters !== "undefined"
    ? pathSpec.parameters.reduce(
        (
          prev: ReadonlyArray<IParameterInfo | IHeaderParameterInfo>,
          param: {
            readonly name: string;
            readonly type: string | undefined;
            readonly required: boolean;
            readonly in: string;
          }
        ) => {
          if (param && param.type) {
            const paramName = `${param.name}${
              param.required === true ? "" : "?"
            }`;
            return [
              ...prev,
              {
                headerName: param.in === "header" ? paramName : undefined,
                in: param.in,
                name: paramName,
                type: specTypeToTs(param.type)
              }
            ];
          }
          return prev;
        },
        []
      )
    : [];

/**
 * Extracts all the info referring to a single operation and returns a IOperationInfo struct.
 * It may return undefined in case of unhandled specification or bad specification format
 *
 * @param api the whole spec
 * @param path the path of the current operation
 * @param extraParameters global parameters specified ad api-level
 * @param defaultSuccessType
 * @param defaultErrorType
 * @param operationKey identifies the operation for a path, correspond to a http method
 *
 * @returns a IOperationInfo struct if correct, undefined otherwise
 */
export const parseOperation = (
  api: OpenAPIV2.Document,
  path: string,
  extraParameters: ReadonlyArray<IParameterInfo | IHeaderParameterInfo>,
  defaultSuccessType: string,
  defaultErrorType: string
) => (operationKey: string): IOperationInfo | undefined => {
  const { parameters: specParameters, securityDefinitions } = api;
  const pathSpec: OpenAPIV2.PathsObject = api.paths[path];

  const method = operationKey.toLowerCase() as SupportedMethod;
  const operation: OpenAPIV2.OperationObject =
    method === "get"
      ? pathSpec.get
      : method === "post"
      ? pathSpec.post
      : method === "put"
      ? pathSpec.put
      : method === "delete"
      ? pathSpec.delete
      : undefined;

  if (operation === undefined) {
    console.warn(`Skipping unsupported method [${method}]`);
    return;
  }
  const operationId = operation.operationId;
  if (typeof operationId === "undefined") {
    console.warn(`Skipping method with missing operationId [${method}]`);
    return;
  }

  const importedTypes = getImportedTypes(operation.parameters);

  const operationParams =
    typeof operation.parameters !== "undefined"
      ? (operation.parameters as ReadonlyArray<OpenAPIV2.ParameterObject>)
          .map(parseParameter(specParameters, operationId))
          .filter((e): e is IParameterInfo => typeof e !== "undefined")
      : [];

  const authHeadersAndParams = operation.security
    ? getAuthHeaders(securityDefinitions, operation.security)
    : [];

  const authParams = authHeadersAndParams;

  const parameters = [...extraParameters, ...authParams, ...operationParams];

  const contentTypeHeaders =
    (method === "post" || method === "put") &&
    Object.keys(operationParams).length > 0
      ? ["Content-Type"]
      : [];

  const authHeaders = authHeadersAndParams.map(pick("headerName"));

  const extraHeaders = extraParameters
    .filter((p): p is IHeaderParameterInfo => p.in === "header")
    .map(pick("headerName"));

  const headers = [...contentTypeHeaders, ...authHeaders, ...extraHeaders];

  const responses = Object.keys(operation.responses).map(responseStatus => {
    const response = operation.responses[responseStatus];
    const typeRef = response.schema ? response.schema.$ref : undefined;
    const responseHeaders = Object.keys(response.headers || {});
    const parsedRef = typeRef ? typeFromRef(typeRef) : undefined;
    if (parsedRef !== undefined) {
      importedTypes.add(parsedRef.e2);
    }
    const responseType = parsedRef
      ? parsedRef.e2
      : responseStatus === "200"
      ? defaultSuccessType
      : defaultErrorType;
    return Tuple3(responseStatus, responseType, responseHeaders);
  });

  const consumes =
    method === "get"
      ? undefined // get doesn't need content type as it does not ships a body
      : operation.consumes && operation.consumes.length
      ? operation.consumes[0]
      : api.consumes && api.consumes.length
      ? api.consumes[0]
      : "application/json"; // use json as default for methods that requires a Content-Type header

  const produces =
    operation.produces && operation.produces.length
      ? operation.produces[0]
      : api.produces && api.produces.length
      ? api.produces[0]
      : undefined;

  return {
    method,
    operationId,
    headers,
    parameters,
    responses,
    importedTypes,
    path,
    consumes,
    produces
  };
};

/**
 * Parse a request parameter into an IParameterInfo structure.
 * The function has the curried form (specParameters, operationId) -> (param) -> IParameterInfo
 *
 * @param specParameters spec's global parameters
 * @param operationId the identifier for the operation. Used for logging purpose
 * @param param the request parameter to parse
 *
 * @returns a struct describing the parameter
 *
 * @example
 * // The param is defined inline in the operation
 * ({}, 'myOperationId') ->
 *   ({ name: 'qo', in: 'query', required: false, type: 'string' }) ->
 *    { name: 'qo?', in: 'query', type: 'string' }
 * @example
 * // The param is defined as a reference to a global definition
 * ({}, 'myOperationId') ->
 *   ({
 *     in: 'body',
 *     name: 'body',
 *     schema: { '$ref': '#/definitions/MySchema' },
 *     required: true
 *   }) ->
 *    { name: 'MySchema', type: 'MySchema', in: 'body' }
 * @example
 * // The param is a reference to a global parameter
 * (
 *  { PaginationRequest: { name: 'cursor', in: 'query', type: 'string' } },
 *  'myOperationId'
 * ) ->
 *   ({ '$ref': '#/parameters/PaginationRequest' }) ->
 *    { name: 'cursor?', type: 'string', in: 'query' }
 */
const parseParameter = (
  specParameters: OpenAPIV2.ParametersDefinitionsObject | undefined,
  operationId: string
) => (param: OpenAPIV2.ParameterObject): IParameterInfo | undefined =>
  param.name && param.type
    ? parseInlineParam(param)
    : parseParamWithReference(specParameters, operationId, param);

const parseInlineParam = (
  param: OpenAPIV2.ParameterObject
): IParameterInfo => ({
  in: param.in,
  name: `${param.name}${param.required ? "" : "?"}`,
  type: specTypeToTs(param.type),
  ...(param.in === "header" ? { headerName: param.name } : {})
});

const parseParamWithReference = (
  specParameters: OpenAPIV2.ParametersDefinitionsObject | undefined,
  operationId: string,
  param: OpenAPIV2.ParameterObject
): IParameterInfo | undefined => {
  const refInParam: string | undefined =
    param.$ref || (param.schema ? param.schema.$ref : undefined);

  if (refInParam === undefined) {
    console.warn(
      `Skipping param without ref in operation [${operationId}] [${param.name}]`
    );
    return undefined;
  }
  const parsedRef = typeFromRef(refInParam);
  if (parsedRef === undefined) {
    console.warn(`Cannot extract type from ref [${refInParam}]`);
    return undefined;
  }
  const refType = parsedRef.e1;
  if (refType === "other") {
    console.warn(`Unrecognized ref type [${refInParam}]`);
    return undefined;
  }

  const paramType: string | undefined =
    refType === "definition"
      ? parsedRef.e2
      : specParameters
      ? specTypeToTs(specParameters[parsedRef.e2].type)
      : undefined;

  if (paramType === undefined) {
    console.warn(`Cannot resolve parameter ${parsedRef.e2}`);
    return undefined;
  }

  const isParamRequired =
    refType === "definition"
      ? param.required === true
      : specParameters
      ? specParameters[parsedRef.e2].required
      : false;

  const paramName = uncapitalize(
    specParameters && specParameters[parsedRef.e2]
      ? specParameters[parsedRef.e2].name
      : param.name
  );

  const paramIn =
    specParameters && specParameters[parsedRef.e2]
      ? specParameters[parsedRef.e2].in
      : param.in;

  return {
    in: paramIn,
    name: `${paramName}${isParamRequired ? "" : "?"}`,
    type: paramType,
    ...(paramIn === "header" ? { headerName: paramName } : {})
  };
};

/**
 * Parse security along with security definitions to obtain a collection of tuples in the form (keyName, headerName).
 * It works with security object both global and operation-specific.
 * see: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityRequirementObject
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject
 *
 * @param securityDefinitions global security definition objects
 * @param security global or specific security requirements
 *
 * @returns Array of tuples in the form (keyName, headerName). Example: [{ e1: 'token', e2: 'Authorization'}]
 */
export function getAuthHeaders(
  securityDefinitions: OpenAPIV2.Document["securityDefinitions"],
  security?: ReadonlyArray<OpenAPIV2.SecurityRequirementObject>
): ReadonlyArray<IAuthHeaderParameterInfo> {
  const securityKeys: ReadonlyArray<string> | undefined =
    security && security.length
      ? security
          .map((_: OpenAPIV2.SecurityRequirementObject) => Object.keys(_)[0])
          .filter(_ => _ !== undefined)
      : undefined;

  const securityDefs =
    securityKeys !== undefined && securityDefinitions !== undefined
      ? // If we have both security and securityDefinitions defined, we extract
        // security items mapped to their securityDefinitions definitions.
        securityKeys.map(k => Tuple2(k, securityDefinitions[k]))
      : securityDefinitions !== undefined
      ? Object.keys(securityDefinitions).map(k =>
          Tuple2(k, securityDefinitions[k])
        )
      : [];

  return securityDefs
    .filter(_ => _.e2 !== undefined)
    .filter(_ => (_.e2 as OpenAPIV2.SecuritySchemeApiKey).in === "header")
    .map(_ => {
      const {
        name: headerName,
        type: tokenType,
        ["x-auth-scheme"]: authScheme = "none"
      } = _.e2 as ExtendedOpenAPIV2SecuritySchemeApiKey; // Because _.e2 is of type OpenAPIV2.SecuritySchemeObject which is the super type of OpenAPIV2.SecuritySchemeApiKey. In the previous step of the chain we filtered so we're pretty sure _.e2 is of type OpenAPIV2.SecuritySchemeApiKey, but the compiler fails at it. I can add an explicit guard to the filter above, but I think the result is the same.
      return {
        authScheme,
        headerName,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        in: "header" as const, // this cast is needed otherwise "in" property will be recognize as string
        name: _.e1,
        tokenType,
        type: "string"
      };
    });
}

/**
 * Takes an array of parameters and collect each definition referenced.
 * Those will correspond to types to be imported in typescript
 *
 * @param parameters
 *
 * @returns a set of definitions to be imported
 *
 * @example
 * ([
 *  {"in":"body","name":"body","schema":{"$ref":"#/definitions/MySchema"},"required":true},
 *  {"$ref":"#/parameters/MyParam"}
 * ]) -> Set { 'MySchema' }
 */
const getImportedTypes = (parameters?: OpenAPIV2.Parameters) =>
  new Set(
    typeof parameters !== "undefined"
      ? (parameters as ReadonlyArray<OpenAPIV2.ParameterObject>)
          .map(paramParsedRef)
          .reduce(
            (
              prev: ReadonlyArray<string>,
              parsed:
                | ITuple2<"definition" | "parameter" | "other", string>
                | undefined
            ) => {
              if (typeof parsed === "undefined") {
                return prev;
              }
              const { e1: refType, e2 } = parsed;
              return refType === "definition" && typeof e2 !== "undefined"
                ? prev.concat(e2)
                : prev;
            },
            []
          )
      : []
  );

/**
 * Given a request param, parses its schema reference, if any
 *
 * @param param a request parameter
 *
 * @returns an ITuple<refType, refName> if the parameter has a reference, undefined otherwise
 */
const paramParsedRef = (param?: OpenAPIV2.ParameterObject) => {
  if (typeof param === "undefined") {
    return undefined;
  }
  const refInParam: string | undefined =
    param.$ref || (param.schema ? param.schema.$ref : undefined);
  if (typeof refInParam === "undefined") {
    return undefined;
  }
  return typeFromRef(refInParam);
};

/**
 * Given a string in the form "#/<refType>/<refName>/, it returns a tuple in the form (refType, refName)"
 *
 * @param s
 *
 * @returns an ITuple object with { e1: refType, e2: refName }, undefined if the string is not the the correct form
 */
function typeFromRef(
  s: string
): ITuple2<"definition" | "parameter" | "other", string> | undefined {
  const parts = s.split("/");
  if (parts && parts.length === 3) {
    const refType: "definition" | "parameter" | "other" =
      parts[1] === "definitions"
        ? "definition"
        : parts[1] === "parameters"
        ? "parameter"
        : "other";
    return Tuple2(refType, parts[2]);
  }
  return undefined;
}

/**
 * Given an OpenAPI param type, it returns its Typescript correspondent
 *
 * @param t
 *
 * @returns a Typescript type
 */
function specTypeToTs(t: string): string {
  switch (t) {
    case "integer":
      return "number";
    case "file":
      return `{ "uri": string, "name": string, "type": string }`;
    default:
      return t;
  }
}

/**
 * Pick a field from an object
 *
 * @param field field to pick
 * @param elem the base object
 */
const pick = <K extends string, T extends Record<K, any>>(field: K) => (
  elem: T
) => elem[field];

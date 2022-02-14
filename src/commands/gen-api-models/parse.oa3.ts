/**
 * This module collects pure utility functions that convert a OpenAPI specification object into a shape which is convenient for code generation
 */

import {ITuple2, Tuple2, Tuple3} from "@pagopa/ts-commons/lib/tuples";
import {OpenAPIV3} from "openapi-types";
import {uncapitalize} from "../../lib/utils";
import {
  ExtendedOpenAPIV2SecuritySchemeApiKey,
  IAuthHeaderParameterInfo,
  IDefinition,
  IHeaderParameterInfo,
  IOperationInfo,
  IParameterInfo,
  ISpecMetaInfo,
  SupportedMethod
} from "./types";

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function parseInnerDefinition(source: any): IDefinition {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const looselySource = source;

  if (looselySource.$ref) {
    return looselySource;
  }

  // OAS2 does not support disjointed unions with oneOf,
  //  so we introduced "x-one-of" custom field in association with allOf
  const {oneOf, allOf} =
    typeof looselySource.oneOf === "undefined" &&
    "x-one-of" in looselySource &&
    looselySource["x-one-of"]
      ? {allOf: undefined, oneOf: looselySource.allOf}
      : {
        allOf: looselySource.allOf,
        oneOf: looselySource.oneOf
      };

  // enum used to be defined with "x-extensible-enum" custom field
  const enumm = looselySource.enum
    ? looselySource.enum
    : "x-extensible-enum" in looselySource
      ? looselySource["x-extensible-enum"]
      : undefined;

  const format = "format" in looselySource ? looselySource.format : undefined;

  const additionalProperties =
    typeof source.additionalProperties === "undefined" ||
    typeof source.additionalProperties === "boolean"
      ? source.additionalProperties
      : parseInnerDefinition(source.additionalProperties);

  const items = !("items" in source)
    ? undefined
    : !source.items
      ? undefined
      : Array.isArray(source.items)
        ? // We don't support multiple array item definitions, should we?
          // Use oneOf instead
        parseInnerDefinition(source.items[0])
        : parseInnerDefinition(source.items);

  return {
    additionalProperties,
    allOf,
    description: source.description,
    enum: enumm,
    exclusiveMaximum: source.exclusiveMaximum,
    exclusiveMinimum: source.exclusiveMinimum,
    format,
    items,
    maxLength: source.maxLength,
    maximum: source.maximum,
    minLength: source.minLength,
    minimum: source.minimum,
    oneOf,
    pattern: source.pattern,
    required: source.required,
    title: source.title,
    type: source.type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ["x-import"]: source["x-import"]
  };
}

/**
 * Parse a schema object into a common definition, regardless of the version of the spec
 *
 * @param source the definition as it comes from the specification
 * @returns a parsed definition
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function parseDefinition(
  source: OpenAPIV3.SchemaObject
): IDefinition {
  const base = parseInnerDefinition(source);

  // recursively parse properties
  const properties = source.properties
    ? Object.entries(source.properties)
      .map(([k, v]) => [k, parseDefinition(v as OpenAPIV3.SchemaObject)])
      .reduce((p, [k, v]) => ({...p, [k as string]: v}), {})
    : undefined;

  const defaultt = "default" in source ? source.default : undefined;

  return {
    ...base,
    default: defaultt,
    properties,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ["x-import"]: (source as any)["x-import"]
  };
}

/**
 * Extracts meta info in a convenient object
 *
 * @param api
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function parseSpecMeta(
  api: OpenAPIV3.Document
): ISpecMetaInfo {
  let basePath = api.servers?.[0].url ?? "";
  basePath = basePath.replace(new RegExp("((http[s]?):)\\/\\/(\\w*\\.?:?\\d*)*"), "");
  return {
    basePath,
    version: api.info?.version,
    // eslint-disable-next-line sort-keys
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
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions, @typescript-eslint/explicit-function-return-type
export function parseAllOperations(
  api: OpenAPIV3.Document,
  defaultSuccessType: string,
  defaultErrorType: string
) {
  let securityDefinitions;

  securityDefinitions = api.components?.securitySchemes;

  // map global auth headers only if global security is defined
  const globalAuthHeaders = api.security
    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getAuthHeaders(securityDefinitions, api.security)
    : [];

  return Object.keys(api.paths)
    .map(path => {
      const pathSpec = api.paths[path];
      const extraParameters = [
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        ...parseExtraParameters(api, path, pathSpec),
        ...globalAuthHeaders
      ];
      return Object.keys(pathSpec)
        .map(
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
 * @param pathSpec      The api spec object
 * @param apiSpec
 * @param operationPath The path of the operation
 * @param pathSpec      A path definition
 *
 * @returns a list of parameters that applies to all methods of a path. Header parameters ship a more complete structure.
 */
const parseExtraParameters = (
  apiSpec: OpenAPIV3.Document,
  operationPath: string,
  pathSpec: any
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
          readonly $ref: string | undefined;
          readonly schema: any | undefined
        }
      ) => {
        if (param?.schema.type) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          return [...prev, parseInlineParam(param)];
        } else if (param?.$ref) {
          let specParameters = apiSpec.components?.parameters;
          return [
            ...prev,
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            parseParamWithReference(
              specParameters,
              operationPath,
              param
            )
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
 *
 * @returns a IOperationInfo struct if correct, undefined otherwise
 */
export const parseOperation = (
  api: any,
  path: string,
  extraParameters: ReadonlyArray<IParameterInfo | IHeaderParameterInfo>,
  defaultSuccessType: string,
  defaultErrorType: string
  // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
) => (operationKey: string): IOperationInfo | undefined => {
  const specParameters = api.components?.parameters
  const securityDefinitions = api.components.securitySchemes;

  const pathSpec: OpenAPIV3.PathsObject =
    api.paths[path];

  const method = operationKey.toLowerCase() as SupportedMethod;
  const operation: OpenAPIV3.OperationObject | any =
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
    // eslint-disable-next-line no-console
    console.warn(`Skipping unsupported method [${method}]`);
    return;
  }
  const operationId = operation.operationId;
  if (typeof operationId === "undefined") {
    // eslint-disable-next-line no-console
    console.warn(`Skipping method with missing operationId [${method}]`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const importedTypes = getImportedTypes(operation.parameters);

  const operationParams =
    typeof operation.parameters !== "undefined"
      ? (operation.parameters as ReadonlyArray<OpenAPIV3.ParameterObject>)
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        .map(parseParameter(specParameters, operationId))
        .filter((e): e is IParameterInfo => typeof e !== "undefined")
      : [];

  if (typeof operation.requestBody !== "undefined") {
    const body = operation.requestBody as OpenAPIV3.RequestBodyObject;
    for (let key in body.content) {
      let param = body.content[key] as OpenAPIV3.ParameterObject;
      const type = param.schema?.type;
      param.name && type
        ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
        parseInlineParam(param)
        : // eslint-disable-next-line @typescript-eslint/no-use-before-define
        parseParamWithReference(specParameters, operationId, param);
    }
  }


  const authHeadersAndParams = operation.security
    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getAuthHeaders(securityDefinitions, operation.security)
    : [];

  const parameters = [...extraParameters, ...(authHeadersAndParams), ...operationParams];

  const contentTypeHeaders =
    (method === "post" || method === "put") &&
    Object.keys(operationParams).length > 0
      ? ["Content-Type"]
      : [];

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const authHeaders = authHeadersAndParams.map(pick("headerName"));

  const extraHeaders = extraParameters
    .filter((p): p is IHeaderParameterInfo => p.in === "header")
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    .map(pick("headerName"));

  const headers = [...contentTypeHeaders, ...authHeaders, ...extraHeaders];

  const responses = Object.keys(operation.responses).map(responseStatus => {
    const response = operation.responses[responseStatus];
    const typeRef = response.schema ? response.schema.$ref : undefined;
    const responseHeaders = Object.keys(response.headers || {});
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
      ? undefined // get doesn't need content type as it does not ship a body
      : // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      operation.consumes && operation.consumes.length
        ? operation.consumes[0]
        : // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        api.consumes && api.consumes.length
          ? api.consumes[0]
          : "application/json"; // use json as default for methods that requires a Content-Type header

  const produces =
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    operation.produces && operation.produces.length
      ? operation.produces[0]
      : // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      api.produces && api.produces.length
        ? api.produces[0]
        : undefined;

  return {
    method,
    operationId,
    // eslint-disable-next-line sort-keys
    headers,
    parameters,
    responses,
    // eslint-disable-next-line sort-keys
    importedTypes,
    path,
    // eslint-disable-next-line sort-keys
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
  specParameters: OpenAPIV3.ParameterObject | undefined,
  operationId: string,
) => (param: OpenAPIV3.ParameterObject): IParameterInfo | undefined => {
  // @ts-ignore
  const type = param.schema?.type;
  return param.name && type
    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
    parseInlineParam(param)
    : // eslint-disable-next-line @typescript-eslint/no-use-before-define
    parseParamWithReference(specParameters, operationId, param);
};


const parseInlineParam = (
  param: OpenAPIV3.ParameterObject,
): IParameterInfo => ({
  in: param.in,
  name: `${param.name}${param.required ? "" : "?"}`,
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  type: specTypeToTs(param),
  ...(param.in === "header" ? {headerName: param.name} : {})
});

const parseParamWithReference = (
  specParameters:
    | {
    readonly [key: string]:
      | OpenAPIV3.ReferenceObject
      | OpenAPIV3.ParameterObject;
  }
    | any
    | undefined,
  operationId: string,
  param: OpenAPIV3.ParameterObject | any,
): IParameterInfo | undefined => {
  const refInParam: string | undefined =
    param.$ref || (param.schema ? param.schema.$ref : undefined);

  if (refInParam === undefined) {
    // eslint-disable-next-line no-console
    console.warn(
      `Skipping param without ref in operation [${operationId}] [${param.name}]`
    );
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const parsedRef = typeFromRef(refInParam);
  if (parsedRef === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`Cannot extract type from ref [${refInParam}]`);
    return undefined;
  }
  const refType = parsedRef.e1;
  if (refType === "other") {
    // eslint-disable-next-line no-console
    console.warn(`Unrecognized ref type [${refInParam}]`);
    return undefined;
  }

  const paramType: string | undefined =
    refType === "definition"
      ? parsedRef.e2
      : specParameters
        ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
        specTypeToTs(specParameters[parsedRef.e2])
        : undefined;

  if (paramType === undefined) {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    specParameters && specParameters[parsedRef.e2]
      ? specParameters[parsedRef.e2].name
      : param.name
  );

  const paramIn =
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    specParameters && specParameters[parsedRef.e2]
      ? specParameters[parsedRef.e2].in
      : param.in;

  return {
    in: paramIn,
    name: `${paramName}${isParamRequired ? "" : "?"}`,
    type: paramType,
    ...(paramIn === "header" ? {headerName: paramName} : {})
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
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function getAuthHeaders(
  securityDefinitions: any,
  security?: ReadonlyArray<OpenAPIV3.SecurityRequirementObject>
): ReadonlyArray<IAuthHeaderParameterInfo> {
  let securityKeys: ReadonlyArray<string> | undefined =
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    security && security.length
      ? security
        .map((_: OpenAPIV3.SecurityRequirementObject) => Object.keys(_)[0])
        .filter(_ => _ !== undefined)
      : undefined;

  // workaround to put bearer token in header
  Object.keys(securityDefinitions).forEach(k => {
    if (securityDefinitions[k].scheme === "bearer") {
      securityDefinitions[k].in = "header";
      securityDefinitions[k].name = "Authorization";
    }
  })

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
    .filter(_ => (_.e2 as OpenAPIV3.ApiKeySecurityScheme).in === "header")
    .map(_ => {
      const {
        name: headerName,
        type: tokenType,
        ["x-auth-scheme"]: authScheme = "none"
      } = _.e2 as ExtendedOpenAPIV2SecuritySchemeApiKey; // Because _.e2 is of type OpenAPIV2.SecuritySchemeObject which is the super type of OpenAPIV2.SecuritySchemeApiKey. In the previous step of the chain we filtered, so we're pretty sure _.e2 is of type OpenAPIV2.SecuritySchemeApiKey, but the compiler fails at it. I can add an explicit guard to the filter above, but I think the result is the same.
      return {
        authScheme,
        headerName,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        in: "header" as const, // this cast is needed otherwise "in" property will be recognized as string
        name: _.e1,
        tokenType,
        type: "string"
      };
    });
}

/**
 * Takes an array of parameters and collect each definition referenced.
 * Those will correspond to the types to be imported in typescript
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getImportedTypes = (
  parameters?: ReadonlyArray<OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject>
) =>
  new Set(
    typeof parameters !== "undefined"
      ? (parameters as ReadonlyArray<OpenAPIV3.ParameterObject>)
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
            const {e1: refType, e2} = parsed;
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const paramParsedRef = (param?: OpenAPIV3.ParameterObject) => {
  if (typeof param === "undefined") {
    return undefined;
  }
  // @ts-ignore
  const refInParam: string | undefined = param.$ref || (param.schema ? param.schema.$ref : undefined);
  if (typeof refInParam === "undefined") {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return typeFromRef(refInParam);
};

/**
 * Given a string in the form "#/<refType>/<refName>/, it returns a tuple in the form (refType, refName)"
 *
 * @param s
 *
 * @returns an ITuple object with { e1: refType, e2: refName }, undefined if the string is not the correct form
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
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
 *
 * @returns a Typescript type
 * @param parameter
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function specTypeToTs(
  parameter: OpenAPIV3.ParameterObject,
): string {

  const format = (parameter.schema as OpenAPIV3.SchemaObject).format ?? ""
  const type = (parameter.schema as OpenAPIV3.SchemaObject).type ?? ""

  if (parameter.in === "formData" && format === "binary") {
    return "File";
  }

  switch (type) {
    case "integer":
      return "number";
    default:
      return type;
  }
}

/**
 * Pick a field from an object
 *
 * @param field field to pick
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
const pick = <K extends string, T extends Record<K, any>>(field: K) => (
  elem: T
) => elem[field];

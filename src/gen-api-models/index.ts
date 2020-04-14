// tslint:disable:no-console

import * as fs from "fs-extra";
import { ITuple2, Tuple2 } from "italia-ts-commons/lib/tuples";
import * as nunjucks from "nunjucks";
import { OpenAPI, OpenAPIV2 } from "openapi-types";
import * as prettier from "prettier";
import * as SwaggerParser from "swagger-parser";

const SUPPORTED_SPEC_METHODS = ["get", "post", "put", "delete"];

/**
 * Wraps model template rendering
 * @param env
 * @param definition
 * @param definitionName
 * @param strictInterfaces
 */
function renderAsync(
  env: nunjucks.Environment,
  definition: OpenAPIV2.DefinitionsObject,
  definitionName: string,
  strictInterfaces: boolean
): Promise<string> {
  return new Promise((accept, reject) => {
    env.render(
      "model.ts.njk",
      {
        definition,
        definitionName,
        strictInterfaces
      },
      (err, res) => {
        if (err) {
          return reject(err);
        }
        accept(res || undefined);
      }
    );
  });
}

/**
 * Definition code rendering. Include code formatting
 * @param env
 * @param definitionName
 * @param definition
 * @param strictInterfaces
 */
export async function renderDefinitionCode(
  env: nunjucks.Environment,
  definitionName: string,
  definition: OpenAPIV2.DefinitionsObject,
  strictInterfaces: boolean
): Promise<string> {
  const code = await renderAsync(
    env,
    definition,
    definitionName,
    strictInterfaces
  );
  const prettifiedCode = prettier.format(code, {
    parser: "typescript"
  });
  return prettifiedCode;
}

/**
 * Uppercase on first letter of a string
 * @param s string to be capitalized
 */
function capitalize(s: string): string {
  return `${s[0].toUpperCase()}${s.slice(1)}`;
}

/**
 * Lowercase on first letter of a string
 * @param s string to be uncapitalized
 */
function uncapitalize(s: string): string {
  return `${s[0].toLowerCase()}${s.slice(1)}`;
}

/**
 * Given a string in the form "#/<refType>/<refName>/, it returns a tuple in the form (refType, refName)"
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
 * @param t
 *
 * @returns a Typescript type
 */
function specTypeToTs(t: string): string {
  switch (t) {
    case "integer":
      return "number";
    case "file":
      return "{ uri: string, name: string, type: string }";
    default:
      return t;
  }
}

/**
 * Renders the responde decoder associated to the given type.
 * Response types refer to io-ts-commons (https://github.com/pagopa/io-ts-commons/blob/master/src/requests.ts)
 * @param status http status code the decoder is associated with
 * @param type type to be decoded
 *
 * @returns a string which represents a decoder declaration
 */
function getDecoderForResponse(status: string, type: string): string {
  switch (type) {
    case "undefined":
      return `r.constantResponseDecoder<undefined, ${status}>(${status}, undefined)`;
    case "Error":
      return `r.basicErrorResponseDecoder<${status}>(${status})`;
    default:
      return `r.ioResponseDecoder<${status}, (typeof ${type})["_A"], (typeof ${type})["_O"]>(${status}, ${type})`;
  }
}

/**
 * Given a request param, parses its schema reference, if any
 * @param param a requeste parameter
 *
 * @returns an ITuple<refType, refName> if the paramenter has a reference, undefined otherwise
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
 * Parse a request parameter into an IParameterInfo structure.
 * The function has the curried form (specParameters, operationId) -> (param) -> IParameterInfo
 * @param specParameters spec's global parameters
 * @param operationId the identifier for the operation
 * @param param the request parameter to parse
 *
 * @returns a struct describing the parameter
 */
const parseParameter = (
  specParameters: OpenAPIV2.ParametersDefinitionsObject | undefined,
  operationId: string
) => (param: OpenAPIV2.ParameterObject): IParameterInfo | undefined => {
  if (param.name && param.type && param.in !== "header") {
    return {
      name: `${param.name}${param.required ? "" : "?"}`,
      in: param.in,
      type: specTypeToTs(param.type)
    };
  }
  // Paratemer is declared as ref, we need to look it up
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

  const paramName = `${uncapitalize(
    specParameters && specParameters[parsedRef.e2]
      ? specParameters[parsedRef.e2].name
      : parsedRef.e2
  )}${isParamRequired ? "" : "?"}`;

  const paramIn =
    specParameters && specParameters[parsedRef.e2]
      ? specParameters[parsedRef.e2].in
      : param.in;

  return {
    name: paramName,
    type: paramType,
    in: paramIn
  };
};

/**
 * Pich a field from an object
 * @param field field to pick
 * @param elem the base object
 */
const pick = <K extends string, T extends Record<K, any>>(field: K) => (
  elem: T
) => elem[field];

/**
 * Takes an array of parameters and collect each definition referenced.
 * Those will correspond to types to be imported in typescript
 * @param parameters
 *
 * @returns a set of definitions to be imported
 */
const getImportedTypes = (parameters?: OpenAPIV2.Parameters) =>
  new Set(
    typeof parameters !== "undefined"
      ? (parameters as OpenAPIV2.ParameterObject[])
          .map(paramParsedRef)
          .reduce(
            (
              prev: string[],
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
 * Renders the code of decoders and request types of a single operation
 * @param operationInfo
 * @param generateResponseDecoders true if decoders have to be added
 *
 * @returns the code for a single operation description
 */
export const renderOperation = (
  operationInfo: IOperationInfo,
  generateResponseDecoders: boolean
): ITuple2<string, ReadonlySet<string>> => {
  const {
    method,
    operationId,
    headers,
    responses,
    importedTypes,
    parameters
  } = operationInfo;

  const requestType = `r.I${capitalize(method)}ApiRequestType`;

  const headersCode =
    headers.length > 0 ? headers.map(_ => `"${_}"`).join("|") : "never";

  const responsesType = responses
    .map(r => `r.IResponseType<${r.e1}, ${r.e2}>`)
    .join("|");

  const paramsCode = parameters
    .map(param => `readonly ${param.name}: ${param.type}`)
    .join(",");

  // use the first 2xx type as "success type" that we allow to be overridden
  const successType = responses.find(_ => _.e1.length === 3 && _.e1[0] === "2");

  const responsesDecoderCode =
    generateResponseDecoders && successType !== undefined
      ? `
        // Decodes the success response with a custom success type
        export function ${operationId}Decoder<A, O>(type: t.Type<A, O>) { return ` +
        responses.reduce((acc, r) => {
          const d = getDecoderForResponse(
            r.e1,
            successType !== undefined && r.e1 === successType.e1 ? "type" : r.e2
          );
          return acc === "" ? d : `r.composeResponseDecoders(${acc}, ${d})`;
        }, "") +
        `; }

        // Decodes the success response with the type defined in the specs
        export const ${operationId}DefaultDecoder = () => ${operationId}Decoder(${
          successType.e2 === "undefined" ? "t.undefined" : successType.e2
        });`
      : "";

  const code =
    `
    /****************************************************************
     * ${operationId}
     */

    // Request type definition
    export type ${capitalize(
      operationId
    )}T = ${requestType}<{${paramsCode}}, ${headersCode}, never, ${responsesType}>;
  ` + responsesDecoderCode;

  return Tuple2(code, importedTypes);
};

/**
 * Parses security along with security definitions to obtain a collection of tuples in the form (keyName, headerName).
 * It works with security object both global and operation-specific.
 * see: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityRequirementObject
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject
 * @param securityDefinitions global security definition objects
 * @param security global or specific security requirements
 *
 * @returns Array of tuples in the form (keyName, headerName). Example: [{ e1: 'token', e2: 'Authorization'}]
 */
export function getAuthHeaders(
  securityDefinitions: OpenAPIV2.Document["securityDefinitions"],
  security?: OpenAPIV2.SecurityRequirementObject[]
): IAuthHeaderParameterInfo[] {
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
        type: tokenType
      } = _.e2 as OpenAPIV2.SecuritySchemeApiKey; // Because _.e2 is of type OpenAPIV2.SecuritySchemeObject which is the super type of OpenAPIV2.SecuritySchemeApiKey. In the previous step of the chain we filtered so we're pretty sure _.e2 is of type OpenAPIV2.SecuritySchemeApiKey, but the compiler fails at it. I can add an explicit guard to the filter above, but I think the result is the same.
      return {
        headerName,
        // tslint:disable-next-line: no-useless-cast
        in: "header" as "header", // this cast is needed otherwise "in" property will be recognize as string
        name: _.e1,
        type: "string",
        tokenType
      };
    });
}

/**
 * It extracts global parameters from a path definition. Parameters in body, path, query and form are of type IParameterInfo, while header parameters are of type IHeaderParameterInfo
 * @param pathSpec a pat definition
 *
 * @returns a list of parameters that applies to all methods of a path. Header parameters ship a more complete structure.
 */
const parseExtraParameters = (
  pathSpec: OpenAPIV2.PathsObject
): Array<IParameterInfo | IHeaderParameterInfo> => {
  return typeof pathSpec.parameters !== "undefined"
    ? pathSpec.parameters.reduce(
        (
          prev: Array<IParameterInfo | IHeaderParameterInfo>,
          param: {
            name: string;
            type: string | undefined;
            required: boolean;
            in: string;
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
};

type SupportedMethod = "get" | "post" | "put" | "delete";
interface IParameterInfo {
  name: string;
  type: string;
  in: string;
  headerName?: string;
}
interface IHeaderParameterInfo extends IParameterInfo {
  in: "header";
  headerName: string;
}

interface IAuthHeaderParameterInfo extends IHeaderParameterInfo {
  tokenType: "basic" | "apiKey" | "oauth2";
}

/* & (
  | { in: "query" | "body" | "formData" }
  | { in: "header"; headerName: string }) */
export interface IOperationInfo {
  method: SupportedMethod;
  operationId: string;
  parameters: IParameterInfo[];
  responses: Array<ITuple2<string, string>>;
  headers: string[];
  importedTypes: Set<string>;
  path: string;
  consumes?: string;
  produces?: string;
}

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
  extraParameters: Array<IParameterInfo | IHeaderParameterInfo>,
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
      ? (operation.parameters as OpenAPIV2.ParameterObject[])
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
    const parsedRef = typeRef ? typeFromRef(typeRef) : undefined;
    if (parsedRef !== undefined) {
      importedTypes.add(parsedRef.e2);
    }
    const responseType = parsedRef
      ? parsedRef.e2
      : responseStatus === "200"
      ? defaultSuccessType
      : defaultErrorType;
    return Tuple2(responseStatus, responseType);
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
    path: `${api.basePath}${path}`,
    consumes,
    produces
  };
};

/**
 * Checks if a parsed spec is in OA2 format
 * @param specs a parsed spec
 *
 * @returns true or false
 */
export function isOpenAPIV2(
  specs: OpenAPI.Document
): specs is OpenAPIV2.Document {
  return specs.hasOwnProperty("swagger");
}

/**
 * Given a list of operation descriptions, it renders a http client
 * @param env
 * @param operations
 *
 * @returns the code of a http client
 */
export async function renderClientCode(
  env: nunjucks.Environment,
  operations: Array<IOperationInfo | undefined>
) {
  return new Promise((resolve, reject) => {
    env.render(
      "client.ts.njk",
      {
        operations
      },
      (err, code) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(
            prettier.format(code, {
              parser: "typescript"
            })
          );
        }
      }
    );
  });
}

/**
 * Iterates over all operations in the specifications and returns a list of IOperationInfo struct describing them.
 * It also flattens global parameters and definitions by place them in each operation
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

interface IGenerateApiOptions {
  specFilePath: string | OpenAPIV2.Document;
  definitionsDirPath: string;
  tsSpecFilePath?: string | undefined;
  strictInterfaces?: boolean;
  generateRequestTypes?: boolean;
  generateResponseDecoders?: boolean;
  generateClient?: boolean;
  defaultSuccessType?: string;
  defaultErrorType?: string;
}

/**
 * Module's main method. It generates files based on a given specification url
 * @param options
 *
 *
 */
export async function generateApi(options: IGenerateApiOptions): Promise<void> {
  const {
    specFilePath,
    tsSpecFilePath,
    generateClient = false,
    definitionsDirPath,
    strictInterfaces = false,
    defaultSuccessType = "undefined",
    defaultErrorType = "undefined"
  } = options;

  const {
    generateRequestTypes = generateClient,
    generateResponseDecoders = generateClient
  } = options;

  const env = initNunJucksEnvironment();
  const api = await SwaggerParser.bundle(specFilePath);

  if (!isOpenAPIV2(api)) {
    throw new Error("The specification is not of type swagger 2");
  }

  const specCode = `
    /* tslint:disable:object-literal-sort-keys */
    /* tslint:disable:no-duplicate-string */
added this line
    // DO NOT EDIT
    // auto-generated by generated_model.ts from ${specFilePath}

    export const specs = ${JSON.stringify(api)};
  `;
  if (tsSpecFilePath) {
    console.log(`Writing TS Specs to ${tsSpecFilePath}`);
    await fs.writeFile(
      tsSpecFilePath,
      prettier.format(specCode, {
        parser: "typescript"
      })
    );
  }

  const definitions = api.definitions;
  if (!definitions) {
    console.log("No definitions found, skipping generation of model code.");
    return;
  }

  for (const definitionName in definitions) {
    if (definitions.hasOwnProperty(definitionName)) {
      const definition = definitions[definitionName];
      const outPath = `${definitionsDirPath}/${definitionName}.ts`;
      console.log(`${definitionName} -> ${outPath}`);
      const code = await renderDefinitionCode(
        env,
        definitionName,
        definition,
        strictInterfaces
      );
      await fs.writeFile(outPath, code);
    }
  }

  const renderSomeCode =
    generateClient || generateRequestTypes || generateResponseDecoders;

  if (renderSomeCode) {
    const allOperationInfos = parseAllOperations(
      api,
      defaultSuccessType,
      defaultErrorType
    );

    const operationsTypes = allOperationInfos.reduce(
      (prev: any[], operationInfo) => {
        if (typeof operationInfo === "undefined") {
          return prev;
        }
        return prev.concat(
          renderOperation(operationInfo, generateResponseDecoders)
        );
      },
      [] as Array<ITuple2<string, ReadonlySet<string>>>
    );

    const operationsImports = new Set<string>();
    const operationTypesCode = operationsTypes
      .map((op: { e1: any; e2: any } | undefined) => {
        if (op === undefined) {
          return;
        }
        const { e1: code, e2: importedTypes } = op;
        importedTypes.forEach((i: string) => operationsImports.add(i));
        return code;
      })
      .join("\n");

    const operationsCode = `
          // DO NOT EDIT THIS FILE
          // This file has been generated by gen-api-models
          // tslint:disable:max-union-size
          // tslint:disable:no-identical-functions
    
          ${generateResponseDecoders ? 'import * as t from "io-ts";' : ""}
    
          import * as r from "italia-ts-commons/lib/requests";
    
          ${Array.from(operationsImports.values())
            .map(i => `import { ${i} } from "./${i}";`)
            .join("\n\n")}
    
          ${operationTypesCode}
        `;

    const prettifiedOperationsCode = prettier.format(operationsCode, {
      parser: "typescript"
    });

    const requestTypesPath = `${definitionsDirPath}/requestTypes.ts`;

    console.log(`Generating request types -> ${requestTypesPath}`);
    await fs.writeFile(requestTypesPath, prettifiedOperationsCode);

    if (generateClient) {
      const outPath = `${definitionsDirPath}/client.ts`;
      console.log(`Client -> ${outPath}`);
      const code = await renderClientCode(env, allOperationInfos);
      await fs.writeFile(outPath, code);
    }
  }
}

//
// Configure nunjucks
//

export function initNunJucksEnvironment(): nunjucks.Environment {
  nunjucks.configure({
    trimBlocks: true
  });
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(`${__dirname}/../../templates`)
  );

  env.addFilter("contains", <T>(a: ReadonlyArray<T>, item: T) => {
    return a.indexOf(item) !== -1;
  });
  env.addFilter("startsWith", <T>(a: string, item: string) => {
    return a.indexOf(item) === 0;
  });
  env.addFilter("capitalizeFirst", (item: string) => {
    return `${item[0].toUpperCase()}${item.slice(1)}`;
  });

  env.addFilter("comment", (item: string) => {
    return "/**\n * " + item.split("\n").join("\n * ") + "\n */";
  });

  env.addFilter("camelCase", (item: string) => {
    return item.replace(/(\_\w)/g, (m: string) => {
      return m[1].toUpperCase();
    });
  });

  let imports: { [key: string]: true } = {};
  env.addFilter("resetImports", (item: string) => {
    imports = {};
  });
  env.addFilter("addImport", (item: string) => {
    imports[item] = true;
  });
  env.addFilter("getImports", (item: string) => {
    return Object.keys(imports).join("\n");
  });

  let typeAliases: { [key: string]: true } = {};
  env.addFilter("resetTypeAliases", (item: string) => {
    typeAliases = {};
  });
  env.addFilter("addTypeAlias", (item: string) => {
    typeAliases[item] = true;
  });
  env.addFilter("getTypeAliases", (item: string) => {
    return Object.keys(typeAliases).join("\n");
  });

  /**
   * Formats function arguments
   * example: { arg1: 'foo', arg2: 'bar' } -> ({ arg1, arg2 })
   * example: "arg1" -> (arg1)
   * example: ["arg1", "arg2"] -> (arg1, arg2)
   */
  env.addFilter("toFnArgs", (item: IParameterInfo[] | undefined) =>
    typeof item === "undefined"
      ? "()"
      : `({${item.map(pick("name")).join(", ")}})`
  );

  env.addFilter("keys", (item: object) => {
    return item ? Object.keys(item) : [];
  });

  env.addFilter("join", (item: any[], sep: string) => {
    return item.join(sep);
  });

  env.addFilter("first", (item: any[]) => {
    return item ? item[0] : undefined;
  });

  env.addFilter("tail", (item: any[]) =>
    item && item.length ? item.slice(1) : []
  );

  env.addFilter("push", (item: any[], toPush: any) =>
    item && item.length ? [...item, toPush] : [toPush]
  );

  env.addFilter("pick", (item: any, key: string) =>
    !item ? [] : Array.isArray(item) ? item.map(pick(key)) : pick(key)(item)
  );

  env.addFilter("strip", (item: any) => {
    const strip = (str: string) =>
      str[str.length - 1] === "?" ? str.substring(0, str.length - 1) : str;
    return !item
      ? undefined
      : Array.isArray(item)
      ? item.map(strip)
      : strip(item);
  });

  env.addFilter(
    "paramIn",
    (item: IParameterInfo[] | undefined, where: string) => {
      return item ? item.filter(e => e.in === where) : [];
    }
  );

  return env;
}

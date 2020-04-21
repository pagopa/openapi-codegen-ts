// tslint:disable:no-console

import * as fs from "fs-extra";
import { ITuple2, Tuple2 } from "italia-ts-commons/lib/tuples";
import { OpenAPI, OpenAPIV2 } from "openapi-types";
import * as prettier from "prettier";
import * as SwaggerParser from "swagger-parser";
import { render } from "../../lib/templating";
import {
  IAuthHeaderParameterInfo,
  IGenerateApiOptions,
  IHeaderParameterInfo,
  IOperationInfo,
  IParameterInfo,
  SupportedMethod,
} from "./types";

const formatCode = (code: string) =>
  prettier.format(code, {
    parser: "typescript",
  });

/**
 * Definition code rendering. Include code formatting
 * @param definitionName
 * @param definition
 * @param strictInterfaces
 */
export async function renderDefinitionCode(
  definitionName: string,
  definition: OpenAPIV2.DefinitionsObject,
  strictInterfaces: boolean
): Promise<string> {
  return render("model.ts.njk", {
    definition,
    definitionName,
    strictInterfaces,
  }).then(formatCode);
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
 * @param varName the name of the variables that holds the type decoder
 *
 * @returns a string which represents a decoder declaration
 */
function getDecoderForResponse(
  status: string,
  type: string,
  varName: string
): string {
  return type === "Error"
    ? `r.basicErrorResponseDecoder<${status}>(${status})`
    : // checks at runtime if the provided decoder is t.undefined
      `${varName}[${status}].name === "undefined" 
        ? r.constantResponseDecoder<undefined, ${status}>(${status}, undefined) 
        : r.ioResponseDecoder<${status}, (typeof ${varName}[${status}])["_A"], (typeof ${varName}[${status}])["_O"]>(${status}, ${varName}[${status}])`;
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
      type: specTypeToTs(param.type),
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
    in: paramIn,
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
    parameters,
  } = operationInfo;

  const requestType = `r.I${capitalize(method)}ApiRequestType`;

  const headersCode =
    headers.length > 0 ? headers.map((_) => `"${_}"`).join("|") : "never";

  const responsesType = responses
    .map((r) => `r.IResponseType<${r.e1}, ${r.e2}>`)
    .join("|");

  const paramsCode = parameters
    .map((param) => `readonly ${param.name}: ${param.type}`)
    .join(",");

  const responsesDecoderCode = generateResponseDecoders
    ? renderDecoderCode(operationInfo)
    : "";

  const requestTypeDefinition = `export type ${capitalize(
    operationId
  )}T = ${requestType}<{${paramsCode}}, ${headersCode}, never, ${responsesType}>;
  `;

  const code = `
    /****************************************************************
     * ${operationId}
     */

    // Request type definition
    ${requestTypeDefinition}${responsesDecoderCode}`;

  return Tuple2(code, importedTypes);
};

/**
 * Compose the code for response decoder of an operation
 * @param operationInfo the operation
 *
 * @returns {string} the composed code
 */
function renderDecoderCode({ responses, operationId }: IOperationInfo) {
  // use the first 2xx type as "success type" that we allow to be overridden
  const firstSuccessType = responses.find(
    ({ e1, e2 }) => e1.length === 3 && e1[0] === "2"
  );
  if (!firstSuccessType) {
    return "";
  }

  // the name of the var holding the set of decoders
  const typeVarName = "type";

  const decoderFunctionName = `${operationId}Decoder`;
  const defaultDecoderFunctionName = `${operationId}DefaultDecoder`;

  const decoderName = (statusCode: string) => `d${statusCode}`;
  const decoderDefinitions = responses
    .map(
      ({ e1: statusCode, e2: typeName }, i) => `
    const ${decoderName(statusCode)} = (${getDecoderForResponse(
        statusCode,
        typeName,
        typeVarName
      )}) as r.ResponseDecoder<r.IResponseType<${statusCode}, A${i}, never>>;
  `
    )
    .join("");
  const composedDecoders = responses.reduce(
    (acc, { e1: statusCode }) =>
      acc === ""
        ? decoderName(statusCode)
        : `r.composeResponseDecoders(${acc}, ${decoderName(statusCode)})`,
    ""
  );

  const responsesTGenerics = responses.reduce(
    (p: string[], r, i) => [...p, `A${i}`, `C${i}`],
    [] as string[]
  );
  const responsesTGenericsWithDefaultTypes = responses.reduce(
    (p: string[], r, i) => [...p, `A${i} = ${r.e2}`, `C${i} = ${r.e2}`],
    [] as string[]
  );
  const responsesTypeName = withGenerics(
    `${capitalize(operationId)}ResponsesT`,
    responsesTGenerics
  );

  const responsesTypeNameWithDefaultTypes = withGenerics(
    `${capitalize(operationId)}ResponsesT`,
    responsesTGenericsWithDefaultTypes
  );

  const decoderDefinitionName = withGenerics(
    decoderFunctionName,
    responsesTGenericsWithDefaultTypes
  );

  const responsesTContent = responses.map(
    ({ e1: statusCode }, i) => `${statusCode}: t.Type<A${i}, C${i}>`
  );

  // Then we create the whole type definition
  //
  // 200: t.Type<A1, C1>
  // 202: t.UndefinedC
  const responsesT = `
    export type ${responsesTypeNameWithDefaultTypes} = {
      ${responsesTContent.join(", ")}
    };
  `;

  // This is the type of the first success type
  // We need it to keep retro-compatibility
  const responsesSuccessTContent = responses.reduce(
    (p: string, r, i) =>
      r.e1 !== firstSuccessType.e1 ? p : `t.Type<A${i}, C${i}>`,
    ""
  );

  const defaultResponsesVarName = `${uncapitalize(
    operationId
  )}DefaultResponses`;

  // Create an object with the default type for each response code:
  //
  // export const ${defaultResponsesVarName} = {
  //   200: MyType,
  //   202: t.undefined,
  //   400: t.undefined
  // };
  const defaultResponses = `
    export const ${defaultResponsesVarName} = {
      ${responses
        .map((r) => `${r.e1}: ${r.e2 === "undefined" ? "t.undefined" : r.e2}`)
        .join(", ")}
    };
  `;

  // a type in the form
  //  r.ResponseDecoder<
  //    | r.IResponseType<200, A0, never>
  //    | r.IResponseType<202, A1, never>
  //  >;
  const returnType = `r.ResponseDecoder<
    ${responses
      .map(
        ({ e1: statusCode }, i) =>
          `r.IResponseType<${statusCode}, A${i}, never>`
      )
      .join("|")}
  >`;

  return `
      ${defaultResponses}
      ${responsesT}
      export function ${decoderDefinitionName}(overrideTypes: Partial<${responsesTypeName}> | ${responsesSuccessTContent} | undefined = {}): ${returnType} {
        const isDecoder = (d: any): d is ${responsesSuccessTContent} =>
          typeof d["_A"] !== "undefined";

        const ${typeVarName} = {
          ...(${defaultResponsesVarName} as unknown as ${responsesTypeName}),
          ...(isDecoder(overrideTypes) ? { ${firstSuccessType.e1}: overrideTypes } : overrideTypes)
        };

        ${decoderDefinitions}
        return ${composedDecoders}
      }

      // Decodes the success response with the type defined in the specs
      export const ${defaultDecoderFunctionName} = () => ${decoderFunctionName}();`;
}

/**
 * Renders a type or variable name extended with its generics, if any
 * Examples:
 * ("MyType") -> "MyType"
 * ("MyType", []) -> "MyType"
 * ("MyType", ["T1", "T2"]) -> "MyType<T1, T2>"
 * @param name type or variable to name to render
 * @param generics list of generics
 *
 * @returns rendered name
 */
function withGenerics(name: string, generics: string[] = []): string {
  return generics.length ? `${name}<${generics.join(", ")}>` : name;
}

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
          .filter((_) => _ !== undefined)
      : undefined;

  const securityDefs =
    securityKeys !== undefined && securityDefinitions !== undefined
      ? // If we have both security and securityDefinitions defined, we extract
        // security items mapped to their securityDefinitions definitions.
        securityKeys.map((k) => Tuple2(k, securityDefinitions[k]))
      : securityDefinitions !== undefined
      ? Object.keys(securityDefinitions).map((k) =>
          Tuple2(k, securityDefinitions[k])
        )
      : [];

  return securityDefs
    .filter((_) => _.e2 !== undefined)
    .filter((_) => (_.e2 as OpenAPIV2.SecuritySchemeApiKey).in === "header")
    .map((_) => {
      const {
        name: headerName,
        type: tokenType,
      } = _.e2 as OpenAPIV2.SecuritySchemeApiKey; // Because _.e2 is of type OpenAPIV2.SecuritySchemeObject which is the super type of OpenAPIV2.SecuritySchemeApiKey. In the previous step of the chain we filtered so we're pretty sure _.e2 is of type OpenAPIV2.SecuritySchemeApiKey, but the compiler fails at it. I can add an explicit guard to the filter above, but I think the result is the same.
      return {
        headerName,
        // tslint:disable-next-line: no-useless-cast
        in: "header" as "header", // this cast is needed otherwise "in" property will be recognize as string
        name: _.e1,
        type: "string",
        tokenType,
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
                type: specTypeToTs(param.type),
              },
            ];
          }
          return prev;
        },
        []
      )
    : [];
};

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

  const responses = Object.keys(operation.responses).map((responseStatus) => {
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
    path,
    consumes,
    produces,
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
  spec: OpenAPIV2.Document,
  operations: Array<IOperationInfo | undefined>
) {
  return render("client.ts.njk", {
    operations,
    spec,
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
    .map((path) => {
      const pathSpec = api.paths[path];
      const extraParameters = [
        ...parseExtraParameters(pathSpec),
        ...globalAuthHeaders,
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

function renderSpecCode(spec: OpenAPIV2.Document, specFilePath: string) {
  return `
  /* tslint:disable:object-literal-sort-keys */
  /* tslint:disable:no-duplicate-string */
added this line
  // DO NOT EDIT
  // auto-generated by generated_model.ts from ${specFilePath}

  export const specs = ${JSON.stringify(spec)};
`;
}

/**
 * Renders the code that includes every operation definition
 * @param allOperationInfos collection of parsed operations
 * @param generateResponseDecoders true to include decoders
 *
 * @return the rendered code
 */
function renderAllOperations(
  allOperationInfos: Array<IOperationInfo | undefined>,
  generateResponseDecoders: boolean
) {
  const operationsTypes = allOperationInfos.reduce(
    (prev: any[], operationInfo) =>
      typeof operationInfo === "undefined"
        ? prev
        : prev.concat(renderOperation(operationInfo, generateResponseDecoders)),
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
          .map((i) => `import { ${i} } from "./${i}";`)
          .join("\n\n")}
  
        ${operationTypesCode}
      `;

  return formatCode(operationsCode);
}

/**
 * Wraps file writing to expose a common interface and log consistently
 * @param name name of the piece of code to render
 * @param outPath path of the file
 * @param code code to be saved
 *
 */
function writeGeneratedCodeFile(name: string, outPath: string, code: string) {
  console.log(`${name} -> ${outPath}`);
  return fs.writeFile(outPath, code);
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
    defaultErrorType = "undefined",
  } = options;

  const {
    generateRequestTypes = generateClient,
    generateResponseDecoders = generateClient,
  } = options;

  const api = await SwaggerParser.bundle(specFilePath);

  if (!isOpenAPIV2(api)) {
    throw new Error("The specification is not of type swagger 2");
  }

  if (tsSpecFilePath) {
    await writeGeneratedCodeFile(
      "TS Spec",
      tsSpecFilePath,
      formatCode(renderSpecCode(api, tsSpecFilePath))
    );
  }

  const definitions = api.definitions;
  if (!definitions) {
    console.log("No definitions found, skipping generation of model code.");
    return;
  }

  await Promise.all(
    Object.keys(definitions).map((definitionName: string) =>
      renderDefinitionCode(
        definitionName,
        definitions[definitionName],
        strictInterfaces
      ).then((code: string) =>
        writeGeneratedCodeFile(
          definitionName,
          `${definitionsDirPath}/${definitionName}.ts`,
          code
        )
      )
    )
  );

  const needToParseOperations = generateClient || generateRequestTypes;

  if (needToParseOperations) {
    const allOperationInfos = parseAllOperations(
      api,
      defaultSuccessType,
      defaultErrorType
    );

    if (generateRequestTypes) {
      await writeGeneratedCodeFile(
        "request types",
        `${definitionsDirPath}/requestTypes.ts`,
        renderAllOperations(allOperationInfos, generateResponseDecoders)
      );
    }

    if (generateClient) {
      const code = await renderClientCode(api, allOperationInfos);
      await writeGeneratedCodeFile(
        "client",
        `${definitionsDirPath}/client.ts`,
        code
      );
    }
  }
}

/* eslint-disable sort-keys */

/**
 * Exposes a template environment instantiated with custom template functionalities defined specifically for gen-api-models command
 */

// import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import { createTemplateEnvironment } from "../../lib/templating";
import { IOperationInfo, IResponse } from "./types";

/**
 * Factory method to create a set of filters bound to a common storage.
 * The storage is in the form (key, true) where the presence of a kye indicates the flag is true
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createFlagStorageFilters = () => {
  // eslint-disable-next-line functional/no-let, functional/prefer-readonly-type
  let store: { [key: string]: true } = {};
  return {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
    reset() {
      store = {};
    },
    // eslint-disable-next-line sort-keys, @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
    add(subject: string) {
      // eslint-disable-next-line functional/immutable-data
      store[subject] = true;
    },
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
    get() {
      return Object.keys(store).join("\n");
    }
  };
};

// filters to handle the import list
const {
  reset: resetImports,
  add: addImport,
  get: getImports
} = createFlagStorageFilters();

// filters to handle the type alias list
const {
  reset: resetTypeAliases,
  add: addTypeAlias,
  get: getTypeAliases
} = createFlagStorageFilters();

/**
 * Given an array of parameter in the form { name: "value" }, it renders a function argument declaration with destructuring
 * example: [{ name: 'foo' }, { name: 'bar' }] -> '({ foo, bar })'
 *
 * @param subject the array of parameters
 *
 * @return the function argument declaration
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const toFnArgs = (
  subject: ReadonlyArray<{ readonly name: string }> | undefined
) =>
  typeof subject === "undefined"
    ? "()"
    : `({${subject.map(({ name }) => name).join(", ")}})`;

/**
 * Given an array of parameter in the form { in: "value" }, filter the items based on the provided value
 *
 * @param item
 * @param where
 *
 * @return filtered items
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const paramIn = (
  item: ReadonlyArray<{ readonly in: string }> | undefined,
  where: string
) => (item ? item.filter((e: { readonly in: string }) => e.in === where) : []);

/**
 * Given an array of parameter in the form { in: "value" }, filter the items based on the provided value
 * for taking all except the passed one
 *
 * @param item
 * @param where
 *
 * @return filtered items
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const paramNotIn = (
  item: ReadonlyArray<{ readonly in: string }> | undefined,
  where: string
) => (item ? item.filter((e: { readonly in: string }) => e.in !== where) : []);

/**
 * Given an array of parameter in the form { in: "value" }, filter the items based on the provided value
 *
 * @param item
 * @param where
 *
 * @return filtered items
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const required = (item: ReadonlyArray<{ readonly name: string }> | undefined) =>
  item
    ? item.filter(
        (e: { readonly name: string }) => e.name[e.name.length - 1] !== "?"
      )
    : [];

/**
 * Given an array of parameter in the form { in: "value" }, filter the items based on the provided value
 *
 * @param item
 * @param where
 *
 * @return filtered items
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const optional = (item: ReadonlyArray<{ readonly name: string }> | undefined) =>
  item
    ? item.filter(
        (e: { readonly name: string }) => e.name[e.name.length - 1] === "?"
      )
    : [];

/**
 * Removes decorator character from a variable name
 * example: "arg?" -> "arg"
 * example: "arg" -> "arg"
 * example: ["arg1?", "arg2"] -> ["arg1", "arg2"]
 *
 * @param subject
 *
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const stripQuestionMark = (subject: ReadonlyArray<string> | string) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type
  const strip_base = (str: string) =>
    str[str.length - 1] === "?" ? str.substring(0, str.length - 1) : str;
  return !subject
    ? undefined
    : typeof subject === "string"
    ? strip_base(subject)
    : subject.map(strip_base);
};

/**
 * Print optional symbol `?` from a variable name
 * example: "arg?" -> "?"
 * example: "arg" -> ""
 * example: ["arg1?", "arg2"] -> ["?", ""]
 *
 * @param subject
 *
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const setOptionalSymbol = (subject: ReadonlyArray<string> | string) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type
  const getOptionalSymbol = (str: string) =>
    str[str.length - 1] === "?" ? "?" : "";
  return !subject
    ? undefined
    : typeof subject === "string"
    ? getOptionalSymbol(subject)
    : subject.map(getOptionalSymbol);
};

/**
 * Filter an array based on a paramenter and a value to match
 */
const filterByParameterIn = <T>(
  array: ReadonlyArray<Record<string, T>>,
  parameterName: string,
  value: ReadonlyArray<T>
): ReadonlyArray<Record<string, T>> | undefined =>
  array === undefined
    ? undefined
    : array.filter(a => value.includes(a[parameterName]));
/**
 * Filter an array based on a paramenter and a value to match
 */
const filterByParameterNotIn = <T>(
  array: ReadonlyArray<Record<string, T>>,
  parameterName: string,
  value: ReadonlyArray<T>
): ReadonlyArray<Record<string, T>> | undefined =>
  array === undefined
    ? undefined
    : array.filter(a => !value.includes(a[parameterName]));

/**
 * Build the IResponse type based on OpenApi response values
 *
 * @param response
 * @returns
 */
const openapiResponseToTSCommonsResponse = (response: IResponse): string => {
  const returnType = response.e2 ?? "undefined";
  // const statusCode: HttpStatusCodeEnum = +response.e1 as HttpStatusCodeEnum;
  const statusCode = +response.e1;

  switch (statusCode) {
    // 2xx
    case 200:
      return `IResponseSuccessJson<${returnType}>`;
    case 201:
      return `IResponseSuccessRedirectToResource<${returnType}, ${returnType}>`;
    case 202:
      return `IResponseSuccessAccepted<${returnType}>`;
    case 204:
      // TODO: add to ts-commons
      return `IResponse<"IResponseSuccessNoContent">`;

    // 3xx
    case 301:
      return `IResponsePermanentRedirect`;
    case 303:
      return `IResponseSeeOtherRedirect`;

    // 4xx
    case 400:
      return `IResponseErrorValidation`;
    case 401:
      // TODO: add to ts-commons
      return `IResponse<"IResponseErrorUnauthorized">`;
    case 403:
      return `IResponseErrorForbiddenNotAuthorized`;
    case 404:
      return `IResponseErrorNotFound`;
    case 409:
      return `IResponseErrorConflict`;
    case 410:
      return `IResponseErrorGone`;
    case 429:
      return `IResponseErrorTooManyRequests`;

    // 5xx
    case 500:
      return `IResponseErrorInternal`;
    case 503:
      return `IResponseErrorServiceUnavailable`;
    case 504:
      // TODO: add to ts-commons
      return `IResponse<"IResponseGatewayTimeout">`;
    default:
      throw Error(`Status code ${response.e1} not implemented`);
  }
};

/**
 * Write operations' imports once
 */
const toUniqueImports = (
  operations: ReadonlyArray<IOperationInfo>
): ReadonlySet<string> =>
  new Set<string>(
    operations
      .map(o => o.importedTypes)
      .reduce((prev, curr) => [...prev, ...curr], [] as ReadonlyArray<string>)
  );

/**
 * Debug utility for printing a json object
 */
const jsonToString = (obj: unknown): string => JSON.stringify(obj, null, "\t");

/**
 * Debug utility for logging values in nunjucks template
 */
// eslint-disable-next-line no-console
const log = console.log;

/**
 *
 */
export default createTemplateEnvironment({
  customFilters: {
    resetImports,
    addImport,
    getImports,
    resetTypeAliases,
    addTypeAlias,
    getTypeAliases,
    toFnArgs,
    paramIn,
    stripQuestionMark,

    required,
    optional,
    paramNotIn,
    filterByParameterIn,
    filterByParameterNotIn,
    setOptionalSymbol,
    openapiResponseToTSCommonsResponse,
    toUniqueImports,
    jsonToString,
    log
  }
});

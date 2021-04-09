/**
 * Exposes a template environment instantiated with custom template functionalities defined specifically for gen-api-models command
 */

import { createTemplateEnvironment } from "../../lib/templating";

/**
 * Factory method to create a set of filters bound to a common storage.
 * The storage is in the form (key, true) where the presence of a kye indicates the flag is true
 */
const createFlagStorageFilters = () => {
  let store: { [key: string]: true } = {};
  return {
    reset() {
      store = {};
    },
    add(subject: string) {
      store[subject] = true;
    },
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
const paramIn = (
  item: ReadonlyArray<{ readonly in: string }> | undefined,
  where: string
) => (item ? item.filter((e: { readonly in: string }) => e.in === where) : []);

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
const stripQuestionMark = (subject: ReadonlyArray<string> | string) => {
  const strip_base = (str: string) =>
    str[str.length - 1] === "?" ? str.substring(0, str.length - 1) : str;
  return !subject
    ? undefined
    : typeof subject === "string"
    ? strip_base(subject)
    : subject.map(strip_base);
};

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
    stripQuestionMark
  }
});

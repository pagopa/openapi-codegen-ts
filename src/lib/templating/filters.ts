/**
 * This module is a collection of custom filters to be used in Nunjucks templates
 */

/**
 * Wheater or not an array contains an item
 * @param subject the provided array
 * @param item item to search
 *
 * @return true if item is found
 */
export const contains = <T>(subject: ReadonlyArray<T>, item: T) =>
  subject.indexOf(item) !== -1;

/**
 * Wheater or not the first caracter of the string is the provided item
 * @param subject
 * @param item
 *
 * @returns true or false
 */
export const startsWith = (subject: string, item: string) =>
  subject.indexOf(item) === 0;

/**
 * First letter to uppercase
 *
 * @param subject string to capitalize
 */
export const capitalizeFirst = (subject: string) =>
  `${subject[0].toUpperCase()}${subject.slice(1)}`;

/**
 * Wraps given text in a block comment
 * @param subject the given text
 *
 * @returns the wrapped comment
 */
export const comment = (subject: string) =>
  `/**\n * ${subject.split("\n").join("\n * ")} \n */`;

/**
 * Converts a string to camel cased
 * @param subject provided string
 *
 * @returns camel cased string
 *
 */
export const camelCase = (subject: string) =>
  subject.replace(/(\_\w)/g, ([, firstLetter]: string) =>
    typeof firstLetter === "undefined" ? "" : firstLetter.toUpperCase()
  );
/**
 * Object.keys
 * @param subject provided object
 *
 * @returns a list of keys
 */
export const keys = (subject: object) => {
  return subject ? Object.keys(subject) : [];
};

/**
 * The first element of an array, if defined
 * @param subject
 *
 * @return the first element if present, undefined otherwise
 */
export const first = <T>(subject: ReadonlyArray<T> | undefined) => {
  return subject ? subject[0] : undefined;
};

/**
 * Array.join
 * @param subject
 * @param separator
 *
 * @return the joined string
 */
export const join = <T>(subject: ReadonlyArray<T>, separator: string) => {
  return subject.join(separator);
};

/**
 * Given an array, returns all the elements except the first
 * example: [1,2,3] -> [2,3]
 * example: [] -> []
 * @param subject provided array
 *
 * @returns the array tail
 */
export const tail = <T>(subject: ReadonlyArray<T>) =>
  subject && subject.length ? subject.slice(1) : [];

/**
 * Returns an array containing all the elements of a given array plus the element to push
 * @param subject provided array
 * @param toPush element to push
 */
export const push = <T, R>(
  subject: ReadonlyArray<T> | undefined,
  toPush: T | R
) => (subject && subject.length ? [...subject, toPush] : [toPush]);

/**
 * Given an hash set, returns the value of a given key. If an array of hash sets is given, an array of values os returned
 * @param subject a hash set or an array of hash set
 * @param key the key to pick
 *
 * @returns a value or an array of value
 */
export const pick = <T extends Record<string, any>>(
  subject: T[] | T | undefined,
  key: keyof T
) =>
  !subject
    ? []
    : Array.isArray(subject)
    ? subject.map(({ [key]: value }) => value)
    : subject[key];

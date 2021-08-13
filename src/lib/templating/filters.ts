/**
 * This module is a collection of custom filters to be used in Nunjucks templates
 */

import { identifier } from "safe-identifier";
import { pipe } from "../utils";

/**
 * Apply a filter function indiscriminately to a single subject or to an array of subjects
 * In most cases nunjucks filters work for both strings or array of strings, so it's worth to handle this mechanism once forever
 *
 * @param subject
 */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const oneOrMany = (filterFn: (str: string) => string) => (
  subject: ReadonlyArray<string> | string
) =>
  !subject
    ? undefined
    : typeof subject === "string"
    ? filterFn(subject)
    : subject.map(filterFn);

/**
 * Wheater or not an array contains an item
 *
 * @param subject the provided array
 * @param item item to search
 *
 * @return true if item is found
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const contains = <T>(subject: ReadonlyArray<T>, item: T) =>
  subject.indexOf(item) !== -1;

/**
 * Wheater or not the first caracter of the string is the provided item
 *
 * @param subject
 * @param item
 *
 * @returns true or false
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const startsWith = (subject: string, item: string) =>
  subject.indexOf(item) === 0;

/**
 * First letter to uppercase
 *
 * @param subject string to capitalize
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const capitalizeFirst = (subject: string) =>
  `${subject[0].toUpperCase()}${subject.slice(1)}`;

/**
 * Wraps given text in a block comment
 *
 * @param subject the given text
 *
 * @returns the wrapped comment
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const comment = (subject: string) =>
  `/**\n * ${subject.split("\n").join("\n * ")} \n */`;

/**
 * Converts a string to camel cased
 *
 * @param subject provided string
 *
 * @returns camel cased string
 *
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const camelCase = (subject: string) =>
  // eslint-disable-next-line no-useless-escape
  subject.replace(/(\_\w)/g, ([, firstLetter]: string) =>
    typeof firstLetter === "undefined" ? "" : firstLetter.toUpperCase()
  );

/**
 * Sanitise a string to be used as a javascript identifier
 * see https://developer.mozilla.org/en-US/docs/Glossary/Identifier#:~:text=An%20identifier%20is%20a%20sequence,not%20start%20with%20a%20digit.
 *
 * @param subject provided string or array of strings
 *
 * @returns Sanitised string or array of sanitised strings
 *
 * @example
 * ("9-my invalid_id1") -> "myInvalidId1"
 */
export const safeIdentifier = oneOrMany(subject =>
  pipe((v: string) => v.replace(/^[0-9]+/, ""), identifier, camelCase)(subject)
);

/**
 * Sanitise a string to be used as an object field name when destructuring.
 * The use case is when the template is composing a function declaration and the parameter is destructured
 *
 * @param subject provided string or array of strings
 *
 * @returns Sanitised string or array of sanitised strings
 *
 * @example
 * ("9-my invalid_id1") -> "[\"9-my invalid_id1\"]: myInvalidId1"
 */
export const safeDestruct = oneOrMany(
  (subject: string) => `["${subject}"]: ${safeIdentifier(subject)}`
);

/**
 * Object.keys
 *
 * @param subject provided object
 *
 * @returns a list of keys
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/ban-types
export const keys = (subject: object) => (subject ? Object.keys(subject) : []);

/**
 * The first element of an array, if defined
 *
 * @param subject
 *
 * @return the first element if present, undefined otherwise
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const first = <T>(subject: ReadonlyArray<T> | undefined) =>
  subject ? subject[0] : undefined;

/**
 * Array.join
 *
 * @param subject
 * @param separator
 *
 * @return the joined string
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const join = <T>(subject: ReadonlyArray<T>, separator: string) =>
  subject.join(separator);

/**
 * Given an array, returns all the elements except the first
 * example: [1,2,3] -> [2,3]
 * example: [] -> []
 *
 * @param subject provided array
 *
 * @returns the array tail
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const tail = <T>(subject: ReadonlyArray<T>) =>
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  subject && subject.length ? subject.slice(1) : [];

/**
 * Returns an array containing all the elements of a given array plus the element to push
 *
 * @param subject provided array
 * @param toPush element to push
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const push = <T, R>(
  subject: ReadonlyArray<T> | undefined,
  toPush: T | R
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
) => (subject && subject.length ? [...subject, toPush] : [toPush]);

/**
 * Given an hash set, returns the value of a given key. If an array of hash sets is given, an array of values os returned
 *
 * @param subject a hash set or an array of hash set
 * @param key the key to pick
 *
 * @returns a value or an array of value
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-explicit-any
export const pick = <T extends Record<string, any>>(
  // eslint-disable-next-line functional/prefer-readonly-type
  subject: T[] | T | undefined,
  key: keyof T
) =>
  !subject
    ? []
    : Array.isArray(subject)
    ? subject.map(({ [key]: value }) => value)
    : subject[key];

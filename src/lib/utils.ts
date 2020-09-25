/**
 * Uppercase on first letter of a string
 * @param s string to be capitalized
 */
export function capitalize(s: string): string {
  return `${s[0].toUpperCase()}${s.slice(1)}`;
}

/**
 * Lowercase on first letter of a string
 * @param s string to be uncapitalized
 */
export function uncapitalize(s: string): string {
  return `${s[0].toLowerCase()}${s.slice(1)}`;
}

/**
 * Wrap a string in doublequote
 * @param s string to be wrapped
 */
export const doubleQuote = (s: string) => `"${s}"`;

/**
 * Converts an array of terms into a string representing a union of literals
 * @param arr array of literals to be converted
 * @param onEmpty what to return in case of empty union
 */
export const toUnionOfLiterals = (arr: string[], onEmpty = "never"): string =>
  arr.length ? arr.map(doubleQuote).join(" | ") : onEmpty;

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
export function withGenerics(name: string, generics: string[] = []): string {
  return generics.length ? `${name}<${generics.join(", ")}>` : name;
}

export const pipe = (...fns: Array<(a: any) => any>) => (value: any) =>
  fns.reduce((p, f) => f(p), value);

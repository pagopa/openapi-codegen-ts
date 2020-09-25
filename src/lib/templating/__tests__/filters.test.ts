import { safeIdentifier, safeDestruct } from "../filters";

describe("safeIdentifier", () => {
    it.each`
      name                     | value                           | expected
      ${"valid identifier"}    | ${"validId"}                    | ${"validId"}
      ${"with dashes"}         | ${"my-identifier"}              | ${"myIdentifier"}
      ${"with spaces"}         | ${"my identifier"}              | ${"myIdentifier"}
      ${"with leading number"} | ${"999myIdentifier"}            | ${"myIdentifier"}
      ${"array of values"}     | ${["validId", "my-identifier"]} | ${["validId", "myIdentifier"]}
    `("should safe '$name'", ({ value, expected }) => {
      const result = safeIdentifier(value);
      expect(result).toEqual(expected);
    });
});

describe("safeDestruct", () => {
  it.each`
    name                  | value                           | expected
    ${"valid identifier"} | ${"validId"}                    | ${'["validId"]: validId'}
    ${"with dashes"}      | ${"my-identifier"}              | ${'["my-identifier"]: myIdentifier'}
    ${"array of values"}  | ${["validId", "my-identifier"]} | ${['["validId"]: validId', '["my-identifier"]: myIdentifier']}
  `("should safe '$name'", ({ value, expected }) => {
    const result = safeDestruct(value);
    expect(result).toEqual(expected);
  });
});
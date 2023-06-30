import config from "../../config";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

import { WithinRangeExclusiveMaximumIntegerTest } from "../../generated/testapi/WithinRangeExclusiveMaximumIntegerTest";
import { WithinRangeExclusiveMaximumNumberTest } from "../../generated/testapi/WithinRangeExclusiveMaximumNumberTest";
import { WithinRangeExclusiveMinimumIntegerTest } from "../../generated/testapi/WithinRangeExclusiveMinimumIntegerTest";
import { WithinRangeExclusiveMinimumNumberTest } from "../../generated/testapi/WithinRangeExclusiveMinimumNumberTest";
import { WithinRangeExclusiveMinMaxNumberTest } from "../../generated/testapi/WithinRangeExclusiveMinMaxNumberTest";

import { ConstantIntegerTest } from "../../generated/testapi/ConstantIntegerTest";

import { WithinRangeIntegerTest } from "../../generated/testapi/WithinRangeIntegerTest";
import { WithinRangeNumberTest } from "../../generated/testapi/WithinRangeNumberTest";
import { WithinRangeStringTest } from "../../generated/testapi/WithinRangeStringTest";

import { DisabledUserTest } from "../../generated/testapi/DisabledUserTest";
import { DisjointUnionsUserTest } from "../../generated/testapi/DisjointUnionsUserTest";
import { EnabledUserTest } from "../../generated/testapi/EnabledUserTest";
import { EnumFalseTest } from "../../generated/testapi/EnumFalseTest";
import { EnumTrueTest } from "../../generated/testapi/EnumTrueTest";
import { AllOfWithOneElementTest } from "../../generated/testapi/AllOfWithOneElementTest";
import { AllOfWithOneRefElementTest } from "../../generated/testapi/AllOfWithOneRefElementTest";
import { AdditionalPropsTest } from "../../generated/testapi/AdditionalPropsTest";

import * as E from "fp-ts/lib/Either";

const { generatedFilesDir } = config.specs.testapi;

// if there's no need for this suite in this particular run, just skip it

const loadModule = (name: string) =>
  import(`${generatedFilesDir}/${name}.ts`).then(mod => {
    if (!mod) {
      fail(`Cannot load module ${generatedFilesDir}/${name}.ts`);
    }
    return mod;
  });

describe("FiscalCode definition", () => {
  it("should generate FiscalCode decoder", async () => {
    const { FiscalCode } = await loadModule("FiscalCode");
    expect(FiscalCode).toBeDefined();
  });

  it.each`
    title                                | example               | expected
    ${"should fail decoding empty"}      | ${""}                 | ${false}
    ${"should decode valid cf"}          | ${"RSSMRA80A01F205X"} | ${true}
    ${"should fail decoding invalid cf"} | ${"INVALIDCFFORMAT"}  | ${false}
  `("$title", async ({ example, expected }) => {
    const { FiscalCode } = await loadModule("FiscalCode");
    const result = E.isRight(FiscalCode.decode(example));
    expect(result).toEqual(expected);
  });
});

describe("Profile defintion", () => {
  it("should generate Profile decoder", async () => {
    const { Profile } = await loadModule("Profile");
    expect(Profile).toBeDefined();
  });

  const basicProfile = {
    family_name: "Rossi",
    fiscal_code: "RSSMRA80A01F205X",
    has_profile: true,
    is_email_set: false,
    name: "Mario",
    version: 123
  };
  const completeProfile = {
    family_name: "Rossi",
    fiscal_code: "RSSMRA80A01F205X",
    has_profile: true,
    is_email_set: false,
    name: "Mario",
    version: 123,
    email: "fake@email.com"
  };
  const profileWithPayload = {
    family_name: "Rossi",
    fiscal_code: "RSSMRA80A01F205X",
    has_profile: true,
    is_email_set: false,
    name: "Mario",
    version: 123,
    payload: { foo: "bar" }
  };

  it.each`
    title                                   | example               | expected
    ${"should fail decoding empty"}         | ${""}                 | ${false}
    ${"should fail decoding non-object"}    | ${"value"}            | ${false}
    ${"should decode basic profile"}        | ${basicProfile}       | ${true}
    ${"should decode complete profile"}     | ${completeProfile}    | ${true}
    ${"should decode profile with payload"} | ${profileWithPayload} | ${true}
  `("$title", async ({ example, expected }) => {
    const { Profile } = await loadModule("Profile");
    const result = E.isRight(Profile.decode(example));
    expect(result).toEqual(expected);
  });
});

describe("ConstantIntegerTest definition", () => {
  it.each`
    value  | expected
    ${100} | ${true}
    ${99}  | ${false}
    ${101} | ${false}
    ${199} | ${false}
  `("should decode $value with ConstantIntegerTest", ({ value, expected }) => {
    const result = ConstantIntegerTest.decode(value);
    expect(E.isRight(result)).toEqual(expected);
  });
});

describe("WithinRangeIntegerTest defintion", () => {
  // WithinRangeIntegerTest is defined min=0 max=10 in the spec
  it.each`
    value        | expected
    ${0}         | ${true /* lower bound */}
    ${-1}        | ${false}
    ${5}         | ${true}
    ${9.9999}    | ${false /* not an integer */}
    ${10}        | ${true /* upper bound */}
    ${10.0001}   | ${false /* not an integer */}
    ${11}        | ${false}
    ${100}       | ${false}
    ${undefined} | ${false}
  `(
    "should decode $value with WithinRangeIntegerTest",
    ({ value, expected }) => {
      const result = WithinRangeIntegerTest.decode(value);
      expect(E.isRight(result)).toEqual(expected);
    }
  );
});

describe("WithinRangeNumberTest defintion", () => {
  // WithinRangeNumberTest is defined min=0 max=10 in the spec
  it.each`
    value        | expected
    ${0}         | ${true /* lower bound */}
    ${-1}        | ${false}
    ${5}         | ${true}
    ${9.9999999} | ${true}
    ${10}        | ${true /* upper bound */}
    ${10.000001} | ${false}
    ${11}        | ${false}
    ${100}       | ${false}
    ${undefined} | ${false}
  `(
    "should decode $value with WithinRangeNumberTest",
    ({ value, expected }) => {
      const result = WithinRangeNumberTest.decode(value);
      expect(E.isRight(result)).toEqual(expected);
    }
  );

  describe("WithinRangeExclusiveMinimumNumberTest definition", () => {
    // WithinRangeExclusiveMinimumNumberTest is defined min=0 max=10 exclusiveMinimum: true in the spec
    it.each`
      value        | expected
      ${-1}        | ${false}
      ${0}         | ${false}
      ${0.1}       | ${true}
      ${0.5}       | ${true}
      ${1}         | ${true}
      ${9.9999999} | ${true}
      ${10}        | ${true /* upper bound */}
      ${10.000001} | ${false}
      ${11}        | ${false}
      ${100}       | ${false}
      ${undefined} | ${false}
    `(
      "should decode $value with WithinRangeExclusiveMinimumNumberTest",
      ({ value, expected }) => {
        const result = WithinRangeExclusiveMinimumNumberTest.decode(value);
        expect(E.isRight(result)).toEqual(expected);
      }
    );
  });
  describe("WithinRangeExclusiveMaximumNumberTest definition", () => {
    // WithinRangeExclusiveMaximumNumberTest is defined min=0 max=10 exclusiveMaximum: true in the spec
    it.each`
      value        | expected
      ${-1}        | ${false}
      ${0}         | ${true /* lower bound */}
      ${1.5}       | ${true}
      ${5.5}       | ${true}
      ${9}         | ${true}
      ${9.5}       | ${true}
      ${9.999}     | ${true}
      ${10}        | ${false}
      ${11}        | ${false}
      ${100}       | ${false}
      ${undefined} | ${false}
    `(
      "should decode $value with WithinRangeExclusiveMaximumNumberTest",
      ({ value, expected }) => {
        const result = WithinRangeExclusiveMaximumNumberTest.decode(value);
        expect(E.isRight(result)).toEqual(expected);
      }
    );
  });

  describe("WithinRangeExclusiveMinMaxNumberTest definition", () => {
    // WithinRangeExclusiveMinMaxNumberTest is defined min=0 max=10 exclusiveMaximum: true exclusiveMinimum: true in the spec
    it.each`
      value        | expected
      ${-1}        | ${false}
      ${0}         | ${false}
      ${0.1}       | ${true}
      ${1.5}       | ${true}
      ${5.5}       | ${true}
      ${9}         | ${true}
      ${9.5}       | ${true}
      ${9.999}     | ${true}
      ${10}        | ${false}
      ${11}        | ${false}
      ${100}       | ${false}
      ${undefined} | ${false}
    `(
      "should decode $value with WithinRangeExclusiveMinMaxNumberTest",
      ({ value, expected }) => {
        const result = WithinRangeExclusiveMinMaxNumberTest.decode(value);
        expect(E.isRight(result)).toEqual(expected);
      }
    );
  });
  /*   it("should have correct ts types", () => {
    // value is actually "any"
    const value1: WithinRangeNumberTest = WithinRangeNumberTest.decode(10).getOrElseL(err => {
      throw new Error(readableReport(err))
    });
    // should this be ok? value1 can be 10 and it's not in [0, 10)
    const asRangedValue: IWithinRangeNumberTag<0, 10> = value1;
    const asRangedValue3: IWithinRangeNumberTag<0, 10> = value1;
    // should this be ok? value1 can be in [0, 10) and it's not 10
    const asRangedValue2: 10 = value1;
    const asRangedValue5: WithinRangeNumberTest = 10;
  }) */
});

describe("WithinRangeExclusiveMinimumIntegerTest definition", () => {
  // WithinRangeExclusiveMinimumIntegerTest is defined min=0 max=10 exclusiveMinimum: true in the spec
  it.each`
    value        | expected
    ${0}         | ${false}
    ${-1}        | ${false}
    ${1}         | ${true /* lower bound */}
    ${5}         | ${true}
    ${9}         | ${true}
    ${10}        | ${true /* upper bound */}
    ${11}        | ${false}
    ${100}       | ${false}
    ${undefined} | ${false}
  `(
    "should decode $value with WithinRangeExclusiveMinimumIntegerTest",
    ({ value, expected }) => {
      const result = WithinRangeExclusiveMinimumIntegerTest.decode(value);
      expect(E.isRight(result)).toEqual(expected);
    }
  );
});

describe("WithinRangeExclusiveMaximumIntegerTest definition", () => {
  // WithinRangeExclusiveMaximumIntegerTest is defined min=0 max=10 exclusiveMaximum: true in the spec
  it.each`
    value        | expected
    ${0}         | ${true /* lower bound */}
    ${-1}        | ${false}
    ${1}         | ${true}
    ${5}         | ${true}
    ${9}         | ${true}
    ${10}        | ${false /* upper bound */}
    ${11}        | ${false}
    ${100}       | ${false}
    ${undefined} | ${false}
  `(
    "should decode $value with WithinRangeExclusiveMaximumIntegerTest",
    ({ value, expected }) => {
      const result = WithinRangeExclusiveMaximumIntegerTest.decode(value);
      expect(E.isRight(result)).toEqual(expected);
    }
  );
});

describe("WithinRangeStringTest defintion", () => {
  // WithinRangeStringTest is defined min=8 max=10 in the spec
  it.each`
    value             | expected
    ${"a".repeat(7)}  | ${false}
    ${"a".repeat(8)}  | ${true /* lower bound */}
    ${"a".repeat(9)}  | ${true}
    ${"a".repeat(10)} | ${true /* upper bound */}
    ${"a".repeat(11)} | ${false}
    ${undefined}      | ${false}
  `(
    "should decode $value with WithinRangeStringTest",
    ({ value, expected }) => {
      const result = WithinRangeStringTest.decode(value);
      expect(E.isRight(result)).toEqual(expected);
    }
  );
});

describe("EnumTrueTest definition", () => {
  const statusOk = { flag: true };
  const statusKo = { flag: false };

  it("should decode statusOk with EnumTrueTest", () => {
    const result = EnumTrueTest.decode(statusOk);
    expect(E.isRight(result)).toBe(true);
  });

  it("should not decode statusKo with EnumTrueTest", () => {
    const result = EnumTrueTest.decode(statusKo);

    expect(E.isLeft(result)).toBe(true);
  });
});

describe("EnumFalseTest definition", () => {
  const statusOk = { flag: false };
  const statusKo = { flag: true };

  it("should decode statusOk with EnumFalseTest", () => {
    const result = EnumFalseTest.decode(statusOk);
    expect(E.isRight(result)).toBe(true);
  });

  it("should not decode statusKo with EnumFalseTest", () => {
    const result = EnumFalseTest.decode(statusKo);

    expect(E.isLeft(result)).toBe(true);
  });
});

describe("AllOfWithOneElementTest definition", () => {
  const okElement = { key: "string" };
  const notOkElement = { key: 1 };

  it("Should return a right", () => {
    expect(E.isRight(AllOfWithOneElementTest.decode(okElement))).toBeTruthy();
  });

  it("Should return a left", () => {
    expect(E.isLeft(AllOfWithOneElementTest.decode(notOkElement))).toBeTruthy();
  });
});

describe("AdditionalPropsTest should be an object with a string as key and an array of number as value", () => {
  const okElement = { okElementProperty: [1, 2, 3] };
  const notOkElement = { notOkElementProperty: ["1", "2", "3"] };

  it("Should return a right with a valid type", () => {
    expect(E.isRight(AdditionalPropsTest.decode(okElement))).toBeTruthy();
  });

  it("Should return a left with a non valid element", () => {
    expect(E.isLeft(AdditionalPropsTest.decode(notOkElement))).toBeTruthy();
  });

  it("Should return a left with undefined input", () => {
    expect(E.isLeft(AdditionalPropsTest.decode(undefined))).toBeTruthy();
  });
});

describe("AllOfWithOneRefElementTest", () => {
  const basicProfile = {
    family_name: "Rossi",
    fiscal_code: "RSSMRA80A01F205X",
    has_profile: true,
    is_email_set: false,
    name: "Mario",
    version: 123
  };

  it("Should return a right", () => {
    expect(
      E.isRight(AllOfWithOneRefElementTest.decode(basicProfile))
    ).toBeTruthy();
  });
});

describe("DisjointUnionsUserTest definition", () => {
  const enabledUser = {
    description: "Description for the user",
    enabled: true,
    username: "user"
  };
  const disabledUser = {
    enabled: false,
    reason: "reason for the user",
    username: "user"
  };

  const invalidUser = {
    description: "Description for the user",
    enabled: false,
    username: "user"
  };

  it("should decode enabledUser with DisjointUnionsUserTest", () => {
    const userTest = DisjointUnionsUserTest.decode(enabledUser);
    const enabledUserTest = EnabledUserTest.decode(enabledUser);
    const disabledUserTest = DisabledUserTest.decode(enabledUser);

    expect(E.isRight(userTest)).toBe(true);
    expect(E.isRight(enabledUserTest)).toBe(true);
    expect(E.isLeft(disabledUserTest)).toBe(true);
  });

  it("should decode disabledUser with DisjointUnionsUserTest", () => {
    const userTest = DisjointUnionsUserTest.decode(disabledUser);
    const enabledUserTest = EnabledUserTest.decode(disabledUser);
    const disabledUserTest = DisabledUserTest.decode(disabledUser);

    expect(E.isRight(userTest)).toBe(true);
    expect(E.isRight(disabledUserTest)).toBe(true);
    expect(E.isLeft(enabledUserTest)).toBe(true);
  });

  it("should not decode invalidUser with DisjointUnionsUserTest", () => {
    const userTest = DisjointUnionsUserTest.decode(invalidUser);
    const enabledUserTest = EnabledUserTest.decode(invalidUser);
    const disabledUserTest = DisabledUserTest.decode(invalidUser);

    expect(E.isLeft(userTest)).toBe(true);
    expect(E.isLeft(disabledUserTest)).toBe(true);
    expect(E.isLeft(enabledUserTest)).toBe(true);
  });
});

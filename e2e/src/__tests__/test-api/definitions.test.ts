import config from "../../config";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

import {
  IWithinRangeIntegerTag,
  IWithinRangeNumberTag
} from "italia-ts-commons/lib/numbers";
import { WithinRangeExclusiveMaximumIntegerTest } from "../../generated/testapi/WithinRangeExclusiveMaximumIntegerTest";
import { WithinRangeExclusiveMaximumNumberTest } from "../../generated/testapi/WithinRangeExclusiveMaximumNumberTest";
import { WithinRangeExclusiveMinimumIntegerTest } from "../../generated/testapi/WithinRangeExclusiveMinimumIntegerTest";
import { WithinRangeExclusiveMinimumNumberTest } from "../../generated/testapi/WithinRangeExclusiveMinimumNumberTest";
import { WithinRangeIntegerTest } from "../../generated/testapi/WithinRangeIntegerTest";
import { WithinRangeNumberTest } from "../../generated/testapi/WithinRangeNumberTest";
import { WithinRangeStringTest } from "../../generated/testapi/WithinRangeStringTest";
import { WithinRangeString } from "italia-ts-commons/lib/strings";
import { readableReport } from "italia-ts-commons/lib/reporters";

const { generatedFilesDir, isSpecEnabled } = config.specs.testapi;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = isSpecEnabled ? describe : describe.skip;

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
    const result = FiscalCode.decode(example).isRight();
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
    const result = Profile.decode(example).isRight();
    expect(result).toEqual(expected);
  });
});

describe("WithinRangeIntegerTest defintion", () => {
  //WithinRangeIntegerTest is defined min=0 max=10 in the spec
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
      expect(result.isRight()).toEqual(expected);
    }
  );
});

describe("WithinRangeNumberTest defintion", () => {
  //WithinRangeNumberTest is defined min=0 max=10 in the spec
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
      expect(result.isRight()).toEqual(expected);
    }
  );

  describe("WithinRangeExclusiveMinimumNumberTest definition", () => {
    //WithinRangeExclusiveMinimumNumberTest is defined min=0 max=10 exclusiveMinimum: true in the spec
    it.each`
      value        | expected
      ${-1}        | ${false}
      ${0}         | ${false}
      ${0.1}       | ${false}
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
        expect(result.isRight()).toEqual(expected);
      }
    );
  });
  describe("WithinRangeExclusiveMaximumNumberTest definition", () => {
    //WithinRangeExclusiveMaximumNumberTest is defined min=0 max=10 exclusiveMaximum: true in the spec
    it.each`
      value        | expected
      ${0}         | ${true /* lower bound */}
      ${-1}        | ${false}
      ${1.5}       | ${true}
      ${5.5}       | ${true}
      ${9}         | ${true}
      ${9.5}       | ${true}
      ${10}        | ${false}
      ${11}        | ${false}
      ${100}       | ${false}
      ${undefined} | ${false}
    `(
      "should decode $value with WithinRangeExclusiveMaximumNumberTest",
      ({ value, expected }) => {
        const result = WithinRangeExclusiveMaximumNumberTest.decode(value);
        expect(result.isRight()).toEqual(expected);
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
  //WithinRangeExclusiveMinimumIntegerTest is defined min=0 max=10 exclusiveMinimum: true in the spec
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
      expect(result.isRight()).toEqual(expected);
    }
  );
});

describe("WithinRangeExclusiveMaximumIntegerTest definition", () => {
  //WithinRangeExclusiveMaximumIntegerTest is defined min=0 max=10 exclusiveMaximum: true in the spec
  it.each`
    value        | expected
    ${0}         | ${true /* lower bound */}
    ${-1}        | ${false}
    ${1}         | ${true}
    ${5}         | ${true}
    ${9}         | ${true /* upper bound */}
    ${10}        | ${false}
    ${11}        | ${false}
    ${100}       | ${false}
    ${undefined} | ${false}
  `(
    "should decode $value with WithinRangeExclusiveMaximumIntegerTest",
    ({ value, expected }) => {
      const result = WithinRangeExclusiveMaximumIntegerTest.decode(value);
      expect(result.isRight()).toEqual(expected);
    }
  );
});

describe("WithinRangeStringTest defintion", () => {
  //WithinRangeStringTest is defined min=8 max=10 in the spec
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
      expect(result.isRight()).toEqual(expected);
    }
  );
});

import * as t from "io-ts";
import mockResponse from "../../../../__mocks__/response";
import config from "../../config";
import * as requestTypes from "../../generated/testapi/requestTypes";

// @ts-ignore because leaked-handles doesn't ship type defintions
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

const { isSpecEnabled } = config.specs.testapi;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = isSpecEnabled ? describe : describe.skip;

describeSuite("Request types generated from Test API spec", () => {
  describe("testAuthBearerDecoder", () => {
    it("should be a function", async () => {
      const { testAuthBearerDecoder } = requestTypes;
      expect(testAuthBearerDecoder).toBeDefined();
      expect(testAuthBearerDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                        | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}    | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}    | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 200 with non-empty body"}   | ${mockResponse(200, { foo: "bar" })}  | ${{ status: 200, value: undefined }} | ${undefined}
      ${"should decode 200 with empty body"}       | ${mockResponse(200 /*, undefined */)} | ${{ status: 200, value: undefined }} | ${undefined}
      ${"should decode 403 with any value/string"} | ${mockResponse(403, "any value")}     | ${{ status: 403, value: undefined }} | ${undefined}
      ${"should decode 403 with any value/object"} | ${mockResponse(403, { foo: "bar" })}  | ${{ status: 403, value: undefined }} | ${undefined}
      ${"shoudln't decode unhandled http code"}    | ${mockResponse(418, { foo: "bar" })}  | ${undefined}                         | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { testAuthBearerDecoder } = requestTypes;
        const decoder = testAuthBearerDecoder();
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else if (result) {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        } else {
          fail("result should be defined");
        }
      }
    );
  });

  describe("testAuthBearerDefaultDecoder", () => {
    it("should be a function", async () => {
      const { testAuthBearerDefaultDecoder } = requestTypes;
      expect(testAuthBearerDefaultDecoder).toBeDefined();
      expect(testAuthBearerDefaultDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                        | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}    | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}    | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 200 with non-empty body"}   | ${mockResponse(200, { foo: "bar" })}  | ${{ status: 200, value: undefined }} | ${undefined}
      ${"should decode 200 with empty body"}       | ${mockResponse(200 /*, undefined */)} | ${{ status: 200, value: undefined }} | ${undefined}
      ${"should decode 403 with any value/string"} | ${mockResponse(403, "any value")}     | ${{ status: 403 }}                   | ${undefined}
      ${"should decode 403 with any value/object"} | ${mockResponse(403, { foo: "bar" })}  | ${{ status: 403 }}                   | ${undefined}
      ${"shoudln't decode unhandled http code"}    | ${mockResponse(418, { foo: "bar" })}  | ${undefined}                         | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { testAuthBearerDefaultDecoder } = requestTypes;
        const decoder = testAuthBearerDefaultDecoder();
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else if (result) {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        } else {
          fail("result should be defined");
        }
      }
    );
  });

  describe("testFileUploadDecoder", () => {
    it("should be a function", async () => {
      const { testFileUploadDecoder } = requestTypes;
      expect(testFileUploadDecoder).toBeDefined();
      expect(testFileUploadDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                      | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}  | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}  | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 200 with non-empty body"} | ${mockResponse(200, { foo: "bar" })}  | ${{ status: 200, value: undefined }} | ${undefined}
      ${"should decode 200 with empty body"}     | ${mockResponse(200 /*, undefined */)} | ${{ status: 200, value: undefined }} | ${undefined}
      ${"shoudln't decode unhandled http code"}  | ${mockResponse(418, { foo: "bar" })}  | ${undefined}                         | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { testFileUploadDecoder } = requestTypes;
        const decoder = testFileUploadDecoder();
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else if (result) {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        } else {
          fail("result should be defined");
        }
      }
    );
  });

  describe("testFileUploadDefaultDecoder", () => {
    it("should be a function", async () => {
      const { testFileUploadDefaultDecoder } = requestTypes;
      expect(testFileUploadDefaultDecoder).toBeDefined();
      expect(testFileUploadDefaultDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                      | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}  | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}  | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 200 with non-empty body"} | ${mockResponse(200, { foo: "bar" })}  | ${{ status: 200, value: undefined }} | ${undefined}
      ${"should decode 200 with empty body"}     | ${mockResponse(200 /*, undefined */)} | ${{ status: 200, value: undefined }} | ${undefined}
      ${"shoudln't decode unhandled http code"}  | ${mockResponse(418, { foo: "bar" })}  | ${undefined}                         | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { testFileUploadDefaultDecoder } = requestTypes;
        const decoder = testFileUploadDefaultDecoder();
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else if (result) {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        } else {
          fail("result should be defined");
        }
      }
    );
  });
});

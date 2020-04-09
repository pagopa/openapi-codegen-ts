import * as t from "io-ts";
import config from "../../config";

// @ts-ignore
import * as leaked from "leaked-handles";
leaked.set({ debugSockets: true });

const mockResponse = (status: number, body?: any, headers?: any) => ({
  status,
  json: async () => body,
  headers
});

const { generatedFilesDir, enabled } = config.specs.testapi;

const describeSuite = enabled ? describe : describe.skip;

describeSuite("Request types generated from Test API spec", () => {
  const loadModule = () =>
    import(`${generatedFilesDir}/requestTypes.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${generatedFilesDir}/requestTypes.ts`);
      }
      return mod;
    });

  describe("testAuthBearerDecoder", () => {
    const BodyT = t.interface({
      foo: t.string
    });
    type BodyT = t.TypeOf<typeof BodyT>;

    it("should be a function", async () => {
      const { testAuthBearerDecoder } = await loadModule();
      expect(testAuthBearerDecoder).toBeDefined();
      expect(testAuthBearerDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                        | response                                 | expectedRight                             | expectedLeft
      ${"shoudln't decode scalar value/number"}    | ${200}                                   | ${undefined}                              | ${undefined}
      ${"shoudln't decode scalar value/string"}    | ${"any value"}                           | ${undefined}                              | ${undefined}
      ${"should decode 200 with non-empty body"}   | ${mockResponse(200, { foo: "bar" })}     | ${{ status: 200, value: { foo: "bar" } }} | ${undefined}
      ${"should decode 200 with invalid body"}     | ${mockResponse(200, { invalid: "bar" })} | ${undefined}                              | ${expect.any(Object)}
      ${"should decode 200 with empty body"}       | ${mockResponse(200 /*, undefined */)}    | ${undefined}                              | ${expect.any(Object)}
      ${"should decode 403 with any value/string"} | ${mockResponse(403, "any value")}        | ${{ status: 403 }}                        | ${undefined}
      ${"should decode 403 with any value/object"} | ${mockResponse(403, { foo: "bar" })}     | ${{ status: 403 }}                        | ${undefined}
      ${"shoudln't decode unhandled http code"}    | ${mockResponse(418, { foo: "bar" })}     | ${undefined}                              | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft,
      }) => {
        const { testAuthBearerDecoder } = await loadModule();
        const decoder = testAuthBearerDecoder(BodyT);
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        }
      }
    );
  });

  describe("testAuthBearerDefaultDecoder", () => {
    it("should be a function", async () => {
      const { testAuthBearerDefaultDecoder } = await loadModule();
      expect(testAuthBearerDefaultDecoder).toBeDefined();
      expect(testAuthBearerDefaultDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                        | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}    | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}    | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 200 with non-empty body"}   | ${mockResponse(200, { foo: "bar" })}  | ${undefined}                         | ${expect.any(Object)}
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
        cannotDecode = !expectedRight && !expectedLeft,
      }) => {
        const { testAuthBearerDefaultDecoder } = await loadModule();
        const decoder = testAuthBearerDefaultDecoder();
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        }
      }
    );
  });

  describe("testFileUploadDecoder", () => {
    const BodyT = t.interface({
      foo: t.string
    });
    type BodyT = t.TypeOf<typeof BodyT>;

    it("should be a function", async () => {
      const { testFileUploadDecoder } = await loadModule();
      expect(testFileUploadDecoder).toBeDefined();
      expect(testFileUploadDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                      | response                                 | expectedRight                             | expectedLeft
      ${"shoudln't decode scalar value/number"}  | ${200}                                   | ${undefined}                              | ${undefined}
      ${"shoudln't decode scalar value/string"}  | ${"any value"}                           | ${undefined}                              | ${undefined}
      ${"should decode 200 with non-empty body"} | ${mockResponse(200, { foo: "bar" })}     | ${{ status: 200, value: { foo: "bar" } }} | ${undefined}
      ${"should decode 200 with invalid body"}   | ${mockResponse(200, { invalid: "bar" })} | ${undefined}                              | ${expect.any(Object)}
      ${"should decode 200 with empty body"}     | ${mockResponse(200 /*, undefined */)}    | ${undefined}                              | ${expect.any(Object)}
      ${"shoudln't decode unhandled http code"}  | ${mockResponse(418, { foo: "bar" })}     | ${undefined}                              | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft,
      }) => {
        const { testFileUploadDecoder } = await loadModule();
        const decoder = testFileUploadDecoder(BodyT);
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        }
      }
    );
  });

  describe("testFileUploadDefaultDecoder", () => {
    it("should be a function", async () => {
      const { testFileUploadDefaultDecoder } = await loadModule();
      expect(testFileUploadDefaultDecoder).toBeDefined();
      expect(testFileUploadDefaultDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                      | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}  | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}  | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 200 with non-empty body"} | ${mockResponse(200, { foo: "bar" })}  | ${undefined}                         | ${expect.any(Object)}
      ${"should decode 200 with empty body"}     | ${mockResponse(200 /*, undefined */)} | ${{ status: 200, value: undefined }} | ${undefined}
      ${"shoudln't decode unhandled http code"}  | ${mockResponse(418, { foo: "bar" })}  | ${undefined}                         | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft,
      }) => {
        const { testFileUploadDefaultDecoder } = await loadModule();
        const decoder = testFileUploadDefaultDecoder();
        const result = await decoder(response);
        if (cannotDecode) {
          expect(result).not.toBeDefined();
        } else {
          result.fold(
            // in case the decoding gives a left, it checks the result against the expected value
            (l: any) => expect(l).toEqual(expectedLeft),
            // in case the decoding gives a right, it checks the result against the expected value
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        }
      }
    );
  });
});

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

    [
      ["just 200", 200],
      ["just 403", 403],
      ["any value", "any string"],
      [
        "200 with non-empty body",
        mockResponse(200, { foo: "bar" }),
        { status: 200, value: { foo: "bar" } }
      ],
      [
        "200 with invalid body",
        mockResponse(200, { invalid: "bar" }),
        undefined,
        expect.any(Object)
      ],
      [
        "200 with empty body",
        mockResponse(200, undefined),
        undefined,
        expect.any(Object)
      ],
      ["403 with any value", mockResponse(403, "any value"), { status: 403 }],
      [
        "403 with another value",
        mockResponse(403, { foo: "bar" }),
        { status: 403 }
      ],
      ["unhandled status", mockResponse(418, { foo: "bar" })]
    ].forEach(
      (
        [
          name,
          response,
          expectedRight,
          expectedLeft,
          cannotDecode = !expectedRight && !expectedLeft
        ],
        i
      ) =>
        it(`should decode valid response case ${i + 1}: ${name}`, async () => {
          const { testAuthBearerDecoder } = await loadModule();
          const decoder = testAuthBearerDecoder(BodyT);
          const result = await decoder(response);
          if (cannotDecode) {
            expect(result).not.toBeDefined();
          } else {
            result.fold(
              (l: any) => expect(l).toEqual(expectedLeft),
              (r: any) => expect(r).toEqual(expectedRight)
            );
            expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
            expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
          }
        })
    );
  });

  describe("testAuthBearerDefaultDecoder", () => {
    it("should be a function", async () => {
      const { testAuthBearerDefaultDecoder } = await loadModule();
      expect(testAuthBearerDefaultDecoder).toBeDefined();
      expect(testAuthBearerDefaultDecoder).toEqual(expect.any(Function));
    });

    [
      ["just 200", 200],
      ["just 403", 403],
      ["any value", "any string"],
      [
        "200 with non-empty body",
        mockResponse(200, { foo: "bar" }),
        undefined,
        expect.any(Object)
      ],
      [
        "200 with empty body",
        mockResponse(200),
        { status: 200, value: undefined }
      ],
      ["403 with any value", mockResponse(403, "any value"), { status: 403 }],
      [
        "403 with another value",
        mockResponse(403, { foo: "bar" }),
        { status: 403 }
      ]
    ].forEach(([name, response, expectedRight, expectedLeft], i) =>
      it(`should decode valid response case ${i + 1}: ${name}`, async () => {
        const { testAuthBearerDefaultDecoder } = await loadModule();
        const decoder = testAuthBearerDefaultDecoder();
        const result = await decoder(response);
        if (expectedRight || expectedLeft) {
          result.fold(
            (l: any) => expect(l).toEqual(expectedLeft),
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        } else {
          expect(result).not.toBeDefined();
        }
      })
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

    [
      ["just 200", 200],
      ["just 403", 403],
      ["any value", "any string"],
      [
        "200 with non-empty body",
        mockResponse(200, { foo: "bar" }),
        { status: 200, value: { foo: "bar" } }
      ],
      [
        "200 with invalid body",
        mockResponse(200, { invalid: "bar" }),
        undefined,
        expect.any(Object)
      ],
      [
        "200 with empty body",
        mockResponse(200, undefined),
        undefined,
        expect.any(Object)
      ],
      ["unhandled status code with any value", mockResponse(403, "any value")],
      ["unhandled status code with empty value", mockResponse(403)]
    ].forEach(
      (
        [
          name,
          response,
          expectedRight,
          expectedLeft,
          cannotDecode = !expectedRight && !expectedLeft
        ],
        i
      ) =>
        it(`should decode valid response case ${i + 1}: ${name}`, async () => {
          const { testFileUploadDecoder } = await loadModule();
          const decoder = testFileUploadDecoder(BodyT);
          const result = await decoder(response);
          if (cannotDecode) {
            expect(result).not.toBeDefined();
          } else {
            result.fold(
              (l: any) => expect(l).toEqual(expectedLeft),
              (r: any) => expect(r).toEqual(expectedRight)
            );
            expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
            expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
          }
        })
    );
  });

  describe("testFileUploadDefaultDecoder", () => {
    it("should be a function", async () => {
      const { testFileUploadDefaultDecoder } = await loadModule();
      expect(testFileUploadDefaultDecoder).toBeDefined();
      expect(testFileUploadDefaultDecoder).toEqual(expect.any(Function));
    });

    [
      ["just 200", 200],
      ["just 403", 403],
      ["any value", "any string"],
      [
        "200 with non-empty body",
        mockResponse(200, { foo: "bar" }),
        undefined,
        expect.any(Object)
      ],
      [
        "200 with empty body",
        mockResponse(200),
        { status: 200, value: undefined }
      ],
      ["unhandled status code with any value", mockResponse(403, "any value")],
      ["unhandled status code with empty value", mockResponse(403)]
    ].forEach(([name, response, expectedRight, expectedLeft], i) =>
      it(`should decode valid response case ${i + 1}: ${name}`, async () => {
        const { testFileUploadDefaultDecoder } = await loadModule();
        const decoder = testFileUploadDefaultDecoder();
        const result = await decoder(response);
        if (expectedRight || expectedLeft) {
          result.fold(
            (l: any) => expect(l).toEqual(expectedLeft),
            (r: any) => expect(r).toEqual(expectedRight)
          );
          expect(result.isRight()).toBe(typeof expectedRight !== "undefined");
          expect(result.isLeft()).toBe(typeof expectedLeft !== "undefined");
        } else {
          expect(result).not.toBeDefined();
        }
      })
    );
  });
});

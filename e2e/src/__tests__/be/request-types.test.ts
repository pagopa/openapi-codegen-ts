import * as t from "io-ts";
import mockResponse from "../../../../__mocks__/response";
import config from "../../config";
import * as requestTypes from "../../generated/be/requestTypes";

const { isSpecEnabled } = config.specs.be;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = isSpecEnabled ? describe : describe.skip;

describeSuite("Request types generated from BE API spec", () => {
  describe("getServicesByRecipientDecoder", () => {
    it("should be a function", async () => {
      const { getServicesByRecipientDecoder } = requestTypes;
      expect(getServicesByRecipientDecoder).toBeDefined();
      expect(getServicesByRecipientDecoder).toEqual(expect.any(Function));
    });

    const paginatedServices = {
      items: [{ service_id: "foo123", version: 789 }],
      next: "http://example.com/next",
      page_size: 1
    };

    it.each`
      title                                        | response                                  | expectedRight                                           | expectedLeft
      ${"shoudln't decode scalar value/number"}    | ${200}                                    | ${undefined}                                            | ${undefined}
      ${"shoudln't decode scalar value/string"}    | ${"any value"}                            | ${undefined}                                            | ${undefined}
      ${"should decode 200 with valid body"}       | ${mockResponse(200, paginatedServices)}   | ${{ status: 200, value: paginatedServices }}            | ${undefined}
      ${"should decode 200 with invalid body"}     | ${mockResponse(200, { invalid: "body" })} | ${undefined}                                            | ${expect.any(Object)}
      ${"should decode 200 with empty body"}       | ${mockResponse(200 /*, undefined */)}     | ${undefined}                                            | ${expect.any(Object)}
      ${"should decode 400 with any value/string"} | ${mockResponse(400, "any value")}         | ${undefined}                                            | ${expect.any(Object)}
      ${"should decode 400 with any value/object"} | ${mockResponse(400, { foo: "bar" })}      | ${{ status: 400, value: { type: expect.any(String) } }} | ${undefined}
      ${"shoudln't decode unhandled http code"}    | ${mockResponse(418, { foo: "bar" })}      | ${undefined}                                            | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { getServicesByRecipientDecoder } = requestTypes;
        const decoder = getServicesByRecipientDecoder();
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

  describe("startEmailValidationProcessDecoder", () => {
    it("should be a function", async () => {
      const { startEmailValidationProcessDecoder } = requestTypes;
      expect(startEmailValidationProcessDecoder).toBeDefined();
      expect(startEmailValidationProcessDecoder).toEqual(expect.any(Function));
    });

    it.each`
      title                                      | response                              | expectedRight                        | expectedLeft
      ${"shoudln't decode scalar value/number"}  | ${200}                                | ${undefined}                         | ${undefined}
      ${"shoudln't decode scalar value/string"}  | ${"any value"}                        | ${undefined}                         | ${undefined}
      ${"should decode 202 with non-empty body"} | ${mockResponse(202, { foo: "bar" })}  | ${{ status: 202, value: undefined }} | ${undefined}
      ${"should decode 202 with empty body"}     | ${mockResponse(202 /*, undefined */)} | ${{ status: 202, value: undefined }} | ${undefined}
      ${"shoudln't decode unhandled http code"}  | ${mockResponse(418, { foo: "bar" })}  | ${undefined}                         | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { startEmailValidationProcessDecoder } = requestTypes;
        const decoder = startEmailValidationProcessDecoder();
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

  describe("getUserMetadataDecoder", () => {
    it("should be a function", async () => {
      const { getUserMetadataDecoder } = requestTypes;
      expect(getUserMetadataDecoder).toBeDefined();
      expect(getUserMetadataDecoder).toEqual(expect.any(Function));
    });

    const validUserMetadata = { version: 123, metadata: "meta:data" };
    const invalidUserMetadata = { invalid: "body" };

    it.each`
      title                                      | response                                  | expectedRight                                | expectedLeft
      ${"shoudln't decode scalar value/number"}  | ${200}                                    | ${undefined}                                 | ${undefined}
      ${"shoudln't decode scalar value/string"}  | ${"any value"}                            | ${undefined}                                 | ${undefined}
      ${"should decode 204 with non-empty body"} | ${mockResponse(204, { foo: "bar" })}      | ${{ status: 204, value: undefined }}         | ${undefined}
      ${"should decode 204 with empty body"}     | ${mockResponse(204 /*, undefined */)}     | ${{ status: 204, value: undefined }}         | ${undefined}
      ${"should decode 200 with empty body"}     | ${mockResponse(200 /*, undefined */)}     | ${undefined}                                 | ${expect.any(Object)}
      ${"should decode 200 with invalid body"}   | ${mockResponse(200, invalidUserMetadata)} | ${undefined}                                 | ${expect.any(Object)}
      ${"should decode 200 with valid body"}     | ${mockResponse(200, validUserMetadata)}   | ${{ status: 200, value: validUserMetadata }} | ${undefined}
      ${"shoudln't decode unhandled http code"}  | ${mockResponse(418, { foo: "bar" })}      | ${undefined}                                 | ${undefined}
    `(
      "$title",
      async ({
        response,
        expectedRight,
        expectedLeft,
        cannotDecode = !expectedRight && !expectedLeft
      }) => {
        const { getUserMetadataDecoder } = requestTypes;
        const decoder = getUserMetadataDecoder();
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

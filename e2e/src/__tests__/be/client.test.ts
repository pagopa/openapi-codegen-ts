import nodeFetch from "node-fetch";
import config from "../../config";
import { Client } from "../../generated/be/client";

const { skipClient } = config;
const { mockPort, isEnabled } = config.specs.be;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = skipClient || !isEnabled ? describe.skip : describe;

const VALID_TOKEN = "Bearer valid-token";
const INVALID_TOKEN = undefined;

describeSuite("Http client generated from BE API spec", () => {
  it("should be a valid module", () => {
    expect(Client).toBeDefined();
    expect(Client).toEqual(expect.any(Function));
  });

  describe("getService", () => {
    it("should retrieve a single service", async () => {
      const { getService } = Client(
        `http://localhost:${mockPort}`,
        (nodeFetch as any) as typeof fetch,
        ""
      );

      const result = await getService({
        Bearer: VALID_TOKEN,
        service_id: "service123"
      });

      result.fold(
        (e: any) => fail(e),
        response => {
          expect(response.status).toBe(200);
          expect(response.value).toEqual(expect.any(Object));
        }
      );
    });
  });

  describe("getVisibleServices", () => {
    it("should retrieve a list of visible services", async () => {
      const { getVisibleServices } = Client(
        `http://localhost:${mockPort}`,
        (nodeFetch as any) as typeof fetch,
        ""
      );

      const result = await getVisibleServices({
        Bearer: VALID_TOKEN
      });

      result.fold(
        (e: any) => fail(e),
        response => {
          expect(response.status).toBe(200);
          if (response.status === 200) {
            expect(response.value).toEqual(expect.any(Object));
            expect(response.value.items).toEqual(expect.any(Array));
            expect(response.value.page_size).toEqual(expect.any(Number));
          }
        }
      );
    });

    it("should accept pagination", async () => {
      const { getVisibleServices } = Client(
        `http://localhost:${mockPort}`,
        (nodeFetch as any) as typeof fetch,
        ""
      );

      const result = await getVisibleServices({
        Bearer: VALID_TOKEN,
        cursor: "my cursor"
      });

      result.fold(
        (e: any) => fail(e),
        response => {
          expect(response.status).toBe(200);
          if (response.status === 200) {
            expect(response.value).toEqual(expect.any(Object));
            expect(response.value.items).toEqual(expect.any(Array));
            expect(response.value.page_size).toEqual(expect.any(Number));
          }
        }
      );
    });

    it("should pass parameters correctly to fetch", async () => {
      const spiedFetch = jest.fn(() => ({
        status: 200,
        json: async () => ({}),
        headers: {}
      }));
      const { getVisibleServices } = Client(
        `http://localhost:${mockPort}`,
        (spiedFetch as any) as typeof fetch,
        ""
      );

      await getVisibleServices({
        Bearer: VALID_TOKEN,
        cursor: "my_cursor"
      });

      expect(spiedFetch).toBeCalledWith(
        expect.stringContaining("cursor=my_cursor"),
        expect.objectContaining({
          headers: { Authorization: expect.stringContaining(VALID_TOKEN) }
        })
      );
    });
  });
});

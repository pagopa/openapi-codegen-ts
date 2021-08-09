import nodeFetch from "node-fetch";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import config from "../../config";
import { createClient, WithDefaultsT } from "../../generated/be/client";

const { skipClient } = config;
const { mockPort, isSpecEnabled } = config.specs.be;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = skipClient || !isSpecEnabled ? describe.skip : describe;

const VALID_TOKEN = "Bearer valid-token";
const INVALID_TOKEN = undefined;

describeSuite("Http client generated from BE API spec", () => {
  it("should be a valid module", () => {
    expect(createClient).toBeDefined();
    expect(createClient).toEqual(expect.any(Function));
  });

  describe("getService", () => {
    it("should retrieve a single service", async () => {
      const { getService } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        fetchApi: (nodeFetch as any) as typeof fetch,
        basePath: ""
      });

      const result = await getService({
        Bearer: VALID_TOKEN,
        service_id: "service123"
      });

      pipe(
        result,
        E.fold(
          (e: any) => fail(e),
          response => {
            expect(response.status).toBe(200);
            expect(response.value).toEqual(expect.any(Object));
          }
        )
      );
    });

    it("should use a common token", async () => {
      const withBearer: WithDefaultsT<"Bearer"> = op => params => {
        return op({
          ...params,
          Bearer: VALID_TOKEN
        });
      };

      const { getService } = createClient<"Bearer">({
        baseUrl: `http://localhost:${mockPort}`,
        basePath: "",
        fetchApi: (nodeFetch as any) as typeof fetch,
        withDefaults: withBearer
      });

      // please not we're not passing Bearer
      const result = await getService({
        service_id: "service123"
      });

      pipe(
        result,
        E.fold(
          (e: any) => fail(e),
          response => {
            expect(response.status).toBe(200);
            expect(response.value).toEqual(expect.any(Object));
          }
        )
      );
    });
  });

  describe("getVisibleServices", () => {
    it("should retrieve a list of visible services", async () => {
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        fetchApi: (nodeFetch as any) as typeof fetch,
        basePath: ""
      });

      const result = await getVisibleServices({
        Bearer: VALID_TOKEN
      });

      pipe(
        result,
        E.fold(
          (e: any) => fail(e),
          response => {
            expect(response.status).toBe(200);
            if (response.status === 200) {
              expect(response.value).toEqual(expect.any(Object));
              expect(response.value.items).toEqual(expect.any(Array));
              expect(response.value.page_size).toEqual(expect.any(Number));
            }
          }
        )
      );
    });

    it("should accept pagination", async () => {
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        fetchApi: (nodeFetch as any) as typeof fetch,
        basePath: ""
      });

      const result = await getVisibleServices({
        Bearer: VALID_TOKEN,
        cursor: "my cursor"
      });

      pipe(
        result,
        E.fold(
          (e: any) => fail(e),
          response => {
            expect(response.status).toBe(200);
            if (response.status === 200) {
              expect(response.value).toEqual(expect.any(Object));
              expect(response.value.items).toEqual(expect.any(Array));
              expect(response.value.page_size).toEqual(expect.any(Number));
            }
          }
        )
      );
    });

    it("should pass parameters correctly to fetch", async () => {
      const spiedFetch = jest.fn(() => ({
        status: 200,
        json: async () => ({}),
        headers: {}
      }));
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        fetchApi: (spiedFetch as any) as typeof fetch,
        basePath: ""
      });

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

    it("should pass parameters correctly to fetch (using dafault parameters adapter)", async () => {
      const spiedFetch = jest.fn(() => ({
        status: 200,
        json: async () => ({}),
        headers: {}
      }));

      const withBearer: WithDefaultsT<"Bearer"> = op => params => {
        return op({
          ...params,
          Bearer: VALID_TOKEN
        });
      };

      // please note we're not passing a K type to createClient, is being inferred from witBearer
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchApi: (spiedFetch as any) as typeof fetch,
        basePath: "",
        withDefaults: withBearer
      });

      await getVisibleServices({
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

import nodeFetch from "node-fetch";
import {
  ReplaceRequestParams,
  RequestParams,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import config from "../../config";
import { createClient } from "../../generated/be/client";
import {
  GetServicesByRecipientT,
  GetServiceT,
  GetUserMetadataT,
  GetVisibleServicesT,
  StartEmailValidationProcessT
} from "../../generated/be/requestTypes";

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
        basePath: "",
        fetchApi: (nodeFetch as any) as typeof fetch
      });

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

    it("should use a common token", async () => {
      function withBearer(
        op: TypeofApiCall<GetServiceT>
      ): TypeofApiCall<
        ReplaceRequestParams<
          GetServiceT,
          Omit<RequestParams<GetServiceT>, "Bearer">
        >
      >;
      function withBearer(
        op: TypeofApiCall<GetServicesByRecipientT>
      ): TypeofApiCall<
        ReplaceRequestParams<
          GetServicesByRecipientT,
          Omit<RequestParams<GetServicesByRecipientT>, "Bearer">
        >
      >;
      function withBearer(
        op: TypeofApiCall<GetUserMetadataT>
      ): TypeofApiCall<
        ReplaceRequestParams<
          GetUserMetadataT,
          Omit<RequestParams<GetUserMetadataT>, "Bearer">
        >
      >;
      function withBearer(
        op: TypeofApiCall<StartEmailValidationProcessT>
      ): TypeofApiCall<
        ReplaceRequestParams<
          StartEmailValidationProcessT,
          Omit<RequestParams<StartEmailValidationProcessT>, "Bearer">
        >
      >;
      function withBearer(
        op: TypeofApiCall<GetVisibleServicesT>
      ): TypeofApiCall<
        ReplaceRequestParams<
          GetVisibleServicesT,
          Omit<RequestParams<GetVisibleServicesT>, "Bearer">
        >
      >;
      function withBearer(
        op: // tslint:disable-next-line: max-union-size
        | TypeofApiCall<GetServiceT>
          | TypeofApiCall<GetServicesByRecipientT>
          | TypeofApiCall<GetVisibleServicesT>
          | TypeofApiCall<GetUserMetadataT>
          | TypeofApiCall<StartEmailValidationProcessT>
      ) {
        return (
          params: Omit<
            RequestParams<GetServiceT> &
              RequestParams<GetServicesByRecipientT> &
              RequestParams<GetUserMetadataT> &
              RequestParams<StartEmailValidationProcessT> &
              RequestParams<GetVisibleServicesT>,
            "Bearer"
          >
        ) => op({ ...params, Bearer: "456" });
      }

      const { getService } = createClient<"Bearer">({
        baseUrl: `http://localhost:${mockPort}`,
        basePath: "",
        fetchApi: (nodeFetch as any) as typeof fetch,
        preOp: withBearer
      });

      const result = await getService({
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
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        basePath: "",
        fetchApi: (nodeFetch as any) as typeof fetch
      });

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
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        basePath: "",
        fetchApi: (nodeFetch as any) as typeof fetch
      });

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
      const { getVisibleServices } = createClient({
        baseUrl: `http://localhost:${mockPort}`,
        basePath: "",
        fetchApi: (spiedFetch as any) as typeof fetch
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
  });
});

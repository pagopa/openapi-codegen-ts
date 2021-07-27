import {
  ProblemJson,
  ResponseErrorInternal,
  ResponseSuccessAccepted,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import {
  ITestAuthBearerRequestHandler,
  ITestFileUploadRequestHandler,
  ITestMultipleSuccessRequestHandler,
  ITestParameterWithDashRequestHandler,
  ITestSimpleTokenRequestHandler,
  ITestWithTwoParamsRequestHandler,
  setupTestAuthBearerEndpoint,
  setupTestFileUploadEndpoint,
  setupTestMultipleSuccessEndpoint,
  setupTestParameterWithDashEndpoint,
  setupTestWithTwoParamsEndpoint
} from "../../generated/testapi/server";

import * as request from "supertest";
import { Message } from "../../generated/testapi/Message";
import { isNone, isSome } from "fp-ts/lib/Option";

describe("server", () => {
  let app: express.Express;
  beforeEach(() => {
    //Setup express
    app = express();
  });

  afterEach(() => {
    app.emit("server:stop");
  });

  // ITestAuthBearerRequestHandler - TODO: query param
  it("should be able to build GetService Endpoint", async () => {
    const handler: ITestAuthBearerRequestHandler<{}> = ({}) => {
      return Promise.resolve(ResponseSuccessJson(undefined));
    };

    setupTestAuthBearerEndpoint(app, handler);

    const res = await request(app).get("/api/v1/test-auth-bearer");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // TestMultipleSuccess - 200
  it("should be able to build TestMultipleSuccess Endpoint", async () => {
    const handler: ITestMultipleSuccessRequestHandler<{}> = ({}) => {
      return Promise.resolve(ResponseSuccessJson({ id: "42" } as Message));
    };

    setupTestMultipleSuccessEndpoint(app, handler);

    const res = await request(app).get("/api/v1/test-multiple-success");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "42" });
  });

  // TestMultipleSuccess - 202
  it("should be able to build TestMultipleSuccess Endpoint", async () => {
    const handler: ITestMultipleSuccessRequestHandler<{}> = ({}) => {
      return Promise.resolve(ResponseSuccessAccepted());
    };

    setupTestMultipleSuccessEndpoint(app, handler);

    const res = await request(app).get("/api/v1/test-multiple-success");
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({});
  });

  // testFileUpload - 202 -- TODO: add formData
  it("should be able to build RestFileUpload Endpoint", async () => {
    const handler: ITestFileUploadRequestHandler<{}> = ({}) => {
      return Promise.resolve(ResponseSuccessJson(undefined));
    };

    setupTestFileUploadEndpoint(app, handler);

    const res = await request(app).post("/api/v1/test-file-upload");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // test-parameter-with-dash
  it("should be able to build test-parameter-with-dash Endpoint", async () => {
    const handler: ITestParameterWithDashRequestHandler<{}> = ({
      pathParam
    }) => {
      if (isSome(pathParam) && pathParam.value === "42")
        return Promise.resolve(ResponseSuccessJson(undefined));
      else return Promise.resolve(ResponseErrorInternal("pathparam undefined"));
    };

    setupTestParameterWithDashEndpoint(app, handler);

    const res = await request(app).get("/api/v1/test-parameter-with-dash/42");

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // est-parameter-with-two-dash
  it("should be able to build test-parameter-with-two-dash Endpoint", async () => {
    const handler: ITestWithTwoParamsRequestHandler<{}> = ({
      firstParam,
      secondParam
    }) => {
      if (isSome(firstParam) && secondParam === 42)
        return Promise.resolve(ResponseSuccessJson(undefined));
      else return Promise.resolve(ResponseErrorInternal("pathparam undefined"));
    };

    setupTestWithTwoParamsEndpoint(app, handler);

    const res = await request(app).get("/api/v1/test-two-path-params/1/42");

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // test-parameter-with-two-dash - 400 ProblemJson result
  it("should be able to build test-parameter-with-dash Endpoin - Validation error ( > 100)", async () => {
    const handler: ITestWithTwoParamsRequestHandler<{}> = ({}) =>
      Promise.resolve(ResponseSuccessJson(undefined));
    setupTestWithTwoParamsEndpoint(app, handler);

    const res = await request(app).get(
      "/api/v1/test-two-path-params/1/101"
    );

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      detail: 'value [\"101\"] at [root.0] is not a valid [number >= 0 and < 100]\nvalue [\"101\"] at [root.1] is not a valid [100]',
      status: 400,
      title: "Invalid (number >= 0 and < 100 | 100)"
    });
  });

  // test-parameter-with-two-dash - 400 ProblemJson result
  it("should be able to build test-two-path-params Endpoint returning a validation error", async () => {
    const handler: ITestWithTwoParamsRequestHandler<{}> = ({
      firstParam,
      secondParam
    }) => {
      return Promise.resolve(ResponseSuccessJson(undefined));
    };

    setupTestWithTwoParamsEndpoint(app, handler);

    const res = await request(app).get(
      "/api/v1/test-two-path-params/1/aString"
    );

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      detail: 'value [\"aString\"] at [root.0] is not a valid [number >= 0 and < 100]\nvalue [\"aString\"] at [root.1] is not a valid [100]',
      status: 400,
      title: "Invalid (number >= 0 and < 100 | 100)"
    });
  });
});

import {
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
  setupTestAuthBearerEndpoint,
  setupTestFileUploadEndpoint,
  setupTestMultipleSuccessEndpoint,
  setupTestParameterWithDashEndpoint
} from "../../generated/testapi/server";

import * as request from "supertest";
import { Message } from "../../generated/testapi/Message";
import { isSome } from "fp-ts/lib/Option";

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
});

import * as express from "express";
import { isSome } from "fp-ts/lib/Option";
import {
  ResponseErrorInternal,
  ResponseSuccessAccepted,
  ResponseSuccessJson,
  ResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";
import {
  ITestAuthBearerRequestHandler,
  ITestFileUploadRequestHandler,
  ITestMultipleSuccessRequestHandler,
  ITestParameterWithDashRequestHandler,
  ITestParameterWithReferenceRequestHandler,
  ITestWithTwoParamsRequestHandler,
  setupTestAuthBearerEndpoint,
  setupTestFileUploadEndpoint,
  setupTestMultipleSuccessEndpoint,
  setupTestParameterWithDashEndpoint,
  setupTestParameterWithReferenceEndpoint,
  setupTestWithTwoParamsEndpoint
} from "../../generated/testapi/server";

import { Message } from "../../generated/testapi/Message";
import { MessageBodyMarkdown } from "../../generated/testapi/MessageBodyMarkdown";
import { MessageSubject } from "../../generated/testapi/MessageSubject";

import * as bodyParser from "body-parser";

import * as request from "supertest";

describe("server", () => {
  let app: express.Express;
  beforeEach(() => {
    //Setup express
    app = express();
    app.use(bodyParser.json());
    // Parse an urlencoded body.
    app.use(bodyParser.urlencoded({ extended: true }));
  });

  afterEach(() => {
    app.emit("server:stop");
  });

  // ITestAuthBearerRequestHandler - TODO: query param
  it("should be able to build GetService Endpoint", async () => {
    //handler.ts
    const handler: ITestAuthBearerRequestHandler = async ({ qr }) =>
      ResponseSuccessJson(undefined);

    // index.ts
    setupTestAuthBearerEndpoint(app, handler);

    //test
    const res = await request(app).get("/api/v1/test-auth-bearer?qr=prova");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // TestMultipleSuccess - 200
  it("should be able to build TestMultipleSuccess Endpoint", async () => {
    //handler.ts
    const handler: ITestMultipleSuccessRequestHandler = async ({}) =>
      ResponseSuccessJson({ id: "42" } as Message);

    // index.ts
    setupTestMultipleSuccessEndpoint(app, handler);

    // test
    const res = await request(app).get("/api/v1/test-multiple-success");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "42" });
  });

  // TestMultipleSuccess - 202
  it("should be able to build TestMultipleSuccess Endpoint", async () => {
    //handler.ts
    const handler: ITestMultipleSuccessRequestHandler = ({}) => {
      return Promise.resolve(ResponseSuccessAccepted());
    };

    // index.ts
    setupTestMultipleSuccessEndpoint(app, handler);

    //test
    const res = await request(app).get("/api/v1/test-multiple-success");
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({});
  });

  // testFileUpload - 202 -- TODO: add formData
  it("should be able to build RestFileUpload Endpoint", async () => {
    //handler.ts
    const handler: ITestFileUploadRequestHandler = ({}) => {
      return Promise.resolve(ResponseSuccessJson(undefined));
    };

    // index.ts
    setupTestFileUploadEndpoint(app, handler);

    //test
    const res = await request(app).post("/api/v1/test-file-upload");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // test-parameter-with-dash
  it("should be able to build test-parameter-with-dash Endpoint", async () => {
    //handler.ts
    const handler: ITestParameterWithDashRequestHandler = async ({
      pathParam
    }) => {
      if (isSome(pathParam) && pathParam.value === "42")
        return ResponseSuccessJson(undefined);
      else return ResponseErrorInternal("pathparam undefined");
    };

    // index.ts
    setupTestParameterWithDashEndpoint(app, handler);

    //test
    const res = await request(app).get("/api/v1/test-parameter-with-dash/42");

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });

  // test-parameter-with-reference - Middleware validation error
  it("should be able to build test-parameter-with-reference Endpoint (Middleware validation result)", async () => {
    //handler.ts
    const handler: ITestParameterWithReferenceRequestHandler = async ({
      createdMessage
    }) => ResponseSuccessRedirectToResource(undefined, "", undefined);
    
    // index.ts
    setupTestParameterWithReferenceEndpoint(app, handler);

    //test
    const res = await await request(app).post(
      "/api/v1/test-parameter-with-reference"
    );

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      detail:
        "value [undefined] at [root.0.id] is not a valid [string]\n" +
        "value [undefined] at [root.0.content] is not a valid [Exact<MessageContent>]",
      status: 400,
      title: "Invalid Exact<Message>"
    });
  });

  // Post with  body - Success
  it("should be able to build test-parameter-with-reference Endpoint", async () => {
    //handler.ts
    const handler: ITestParameterWithReferenceRequestHandler = async ({
      createdMessage
    }) => ResponseSuccessRedirectToResource(undefined, "anUrl", undefined);

    // index.ts
    setupTestParameterWithReferenceEndpoint(app, handler);

    const message: Message = {
      id: "anId",
      content: {
        markdown: "a".repeat(81) as MessageBodyMarkdown,
        subject: "s".repeat(80) as MessageSubject
      }
    };

    // test
    const res = await request(app)
      .post("/api/v1/test-parameter-with-reference")
      .send(message);

    expect(res.status).toBe(201);
    expect(res.get("Location")).toEqual("anUrl");
  });

  // test-parameter-with-two-dash
  it("should be able to build test-parameter-with-two-dash Endpoint", async () => {
    //handler.ts
    const handler: ITestWithTwoParamsRequestHandler = async ({
      firstParam,
      secondParam
    }) => {
      if (
        isSome(firstParam) &&
        isSome(secondParam) &&
        secondParam.value === "42"
      )
        return ResponseSuccessJson(undefined);
      else return ResponseErrorInternal("pathparam undefined");
    };

    // index.ts
    setupTestWithTwoParamsEndpoint(app, handler);

    //test
    const res = await request(app).get("/api/v1/test-two-path-params/1/42");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });
});

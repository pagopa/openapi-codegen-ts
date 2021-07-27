import {
  ProblemJson,
  ResponseErrorInternal,
  ResponseSuccessAccepted,
  ResponseSuccessJson,
  ResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import {
  ITestAuthBearerRequestHandler,
  ITestFileUploadRequestHandler,
  ITestMultipleSuccessRequestHandler,
  ITestParameterWithDashRequestHandler,
  ITestParameterWithReferenceRequestHandler,
  ITestSimpleTokenRequestHandler,
  ITestWithTwoParamsRequestHandler,
  setupTestAuthBearerEndpoint,
  setupTestFileUploadEndpoint,
  setupTestMultipleSuccessEndpoint,
  setupTestParameterWithDashEndpoint,
  setupTestParameterWithReferenceEndpoint,
  setupTestWithTwoParamsEndpoint
} from "../../generated/testapi/server";

import * as request from "supertest";
import { Message } from "../../generated/testapi/Message";
import { isNone, isSome } from "fp-ts/lib/Option";
import { MessageBodyMarkdown } from "../../generated/testapi/MessageBodyMarkdown";
import { MessageSubject } from "../../../../e2e/src/generated/testapi/MessageSubject";
import * as bodyParser from "body-parser";

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

  // test-parameter-with-reference - Middleware validation error
  it("should be able to build test-parameter-with-reference Endpoint (Middleware validation result)", async () => {
    const handler: ITestParameterWithReferenceRequestHandler<{}> = ({
      createdMessage
    }) => {
      return Promise.resolve(
        ResponseSuccessRedirectToResource(undefined, "", undefined)
      );
    };

    setupTestParameterWithReferenceEndpoint(app, handler);

    const res = await await request(app)
      .post("/api/v1/test-parameter-with-reference");

    console.log(res.body);
    console.log(res.headers);

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
    const handler: ITestParameterWithReferenceRequestHandler<{}> = ({
      createdMessage
    }) => {
      return Promise.resolve(
        ResponseSuccessRedirectToResource(undefined, "anUrl", undefined)
      );
    };

    setupTestParameterWithReferenceEndpoint(app, handler);

    const message: Message = {
      id: "anId",
      content: {
        markdown: "a".repeat(81) as MessageBodyMarkdown,
        subject: "s".repeat(80) as MessageSubject
      }
    };
    const res = await request(app)
      .post("/api/v1/test-parameter-with-reference")
      .send(message);

    console.log(res.body);
    console.log(res.headers);

    expect(res.status).toBe(201);
    expect(res.get("Location")).toEqual("anUrl");
  });

  // test-parameter-with-two-dash
  it("should be able to build test-parameter-with-two-dash Endpoint", async () => {
    const handler: ITestWithTwoParamsRequestHandler<{}> = ({
      firstParam,
      secondParam
    }) => {
      if (
        isSome(firstParam) &&
        isSome(secondParam) &&
        secondParam.value === "42"
      )
        return Promise.resolve(ResponseSuccessJson(undefined));
      else return Promise.resolve(ResponseErrorInternal("pathparam undefined"));
    };

    setupTestWithTwoParamsEndpoint(app, handler);

    const res = await request(app).get("/api/v1/test-two-path-params/1/42");

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({});
  });
});

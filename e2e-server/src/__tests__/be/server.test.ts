import {
  ResponseErrorInternal,
  ResponseSuccessAccepted,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { PaginatedServiceTupleCollection } from "../../generated/be/PaginatedServiceTupleCollection";
import {
  IGetServiceRequestHandler,
  IGetServicesByRecipientRequestHandler,
  IStartEmailValidationProcessRequestHandler,
  setupGetServiceEndpoint,
  setupGetServicesByRecipientEndpoint,
  setupStartEmailValidationProcessEndpoint
} from "../../generated/be/server";
import { ServicePublic } from "../../generated/be/ServicePublic";

import * as request from "supertest";

describe("server", () => {
  let app: express.Express;
  beforeEach(() => {
    //Setup express
    app = express();
  });

  afterEach(() => {
    app.emit("server:stop");
  });

  // GetService - Success
  it("should be able to build GetService Endpoint", async () => {
    const result = (id: string) => ({
      service_id: id
    });

    // handler.ts
    const handler: IGetServiceRequestHandler<{}> = async ({ serviceId }) =>
      ResponseSuccessJson((result(serviceId) as any) as ServicePublic);

    // index.ts
    setupGetServiceEndpoint(app, handler);

    // test
    const res = await request(app).get("/api/v1/services/3");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(result("3"));
  });

  // GetService - Failure 500
  it("should be able to build GetService Endpoint", async () => {
    // handler.ts
    const handler: IGetServiceRequestHandler<{}> = async ({ serviceId }) =>
      ResponseErrorInternal("error");

    // index.ts
    setupGetServiceEndpoint(app, handler);

    // test
    const res = await request(app).get("/api/v1/services/0");
    expect(res.status).toBe(500);
  });

  // GetServicesByRecipient - Success
  it("should be able to build GetServicesByRecipient Endpoint ", async () => {
    const result = { page_size: 10 };
    // handler.ts
    const handler: IGetServicesByRecipientRequestHandler<{}> = async () =>
      ResponseSuccessJson((result as any) as PaginatedServiceTupleCollection);

    // index.ts
    setupGetServicesByRecipientEndpoint(app, handler);

    // test
    const res = await request(app).get("/api/v1/profile/sender-services");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(result);
  });

  // email-validation-process - Success
  it("should be able to build StartEmailValidationProcess Endpoint ", async () => {
    // handler.ts
    const handler: IStartEmailValidationProcessRequestHandler<{}> = async () =>
      ResponseSuccessAccepted();

    //index.ts
    setupStartEmailValidationProcessEndpoint(app, handler);

    // test
    const res = await request(app).post("/api/v1/email-validation-process");
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({});
  });

  // email-validation-process - Success
  it("should be able to build StartEmailValidationProcess Endpoint ", async () => {
    // handler.ts
    const handler: IStartEmailValidationProcessRequestHandler<{}> = async () =>
      ResponseSuccessAccepted();

    // index.ts
    setupStartEmailValidationProcessEndpoint(app, handler);

    // test
    const res = await request(app).post("/api/v1/email-validation-process");
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({});
  });
});

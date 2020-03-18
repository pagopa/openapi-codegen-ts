/* tslint:disable:no-duplicate-string */

import * as SwaggerParser from "swagger-parser";

import {
  initNunJucksEnvironment,
  renderDefinitionCode,
  renderOperation
} from "../gen-api-models";

const env = initNunJucksEnvironment();

const isErrorCode = code => `${code}`[0] !== "2";

let spec;
beforeAll(
  async () => (spec = await SwaggerParser.bundle(`${__dirname}/petstore.yaml`))
);

describe("petstore", () => {
  it(`should not generate definitions`, async () => {
    expect(spec.definitions).toBeDefined();
  });

  ["Order", "ApiResponse", "User", "Tag", "Pet", "Category"].forEach(
    definitionName =>
      it(`should not generate ${definitionName} definition`, async () => {
        expect(spec.definitions).toBeDefined();
        if (spec.definitions === undefined) {
          fail("unexpected specs");
          return;
        }
        const definition = spec.definitions[definitionName];
        expect(definition).toBeDefined();
        const code = await renderDefinitionCode(
          env,
          definitionName,
          definition,
          false
        );
        expect(code).toBeDefined();
        const snapshotName = `definition-${definitionName.toLowerCase()}`;
        expect(code).toMatchSnapshot(snapshotName);
      })
  );

  [
    ["/pet", "put", "post"],
    ["/pet/{petId}", "get", "post", "delete"],
    ["/pet/{petId}/uploadImage", "post"],
    ["/pet/findByStatus", "get"],
    ["/pet/findByTags", "get"],
    ["/store/inventory", "get"],
    ["/store/order/{orderId}", "get", "delete"],
    ["/store/order", "post"],
    ["/user/{username}", "get", "put", "delete"],
    ["/user/login", "get"],
    ["/user/logout", "get"],
    ["/user", "post"],
    ["/user/createWithArray", "post"],
    ["/user/createWithList", "post"]
  ].forEach(([path, ...verbs]) =>
    verbs.forEach(verb => {
      it(`should generate the operator definition`, async () => {
        const operation = spec.paths[path][verb];
        const defaultSuccessType = "defSuccessType";
        const defaultErrorType = "defErrorType";
        const { e1: code } = renderOperation(
          verb,
          operation.operationId,
          operation,
          spec.parameters,
          spec.securityDefinitions,
          [],
          {},
          "undefined",
          "undefined",
          true
        );

        const snapshotName = `operation-${path}-${verb}`;
        expect(code).toMatchSnapshot(snapshotName);
      });

      it(`should generate handle each response code for ${verb.toUpperCase()} ${path}`, async () => {
        const operation = spec.paths[path][verb];
        const defaultSuccessType = "defSuccessType";
        const defaultErrorType = "defErrorType";
        const { e1: code } = renderOperation(
          verb,
          operation.operationId,
          operation,
          spec.parameters,
          spec.securityDefinitions,
          [],
          {},
          defaultSuccessType,
          defaultErrorType,
          true
        );
        const responseCodes = Object.keys(operation.responses);

        if (!responseCodes || !responseCodes.length) {
          fail("no response code found in parsed spec");
        }

        responseCodes.forEach(responseCode => {
          const expected =
            responseCode === "default"
              ? `<undefined`
              : isErrorCode(responseCode)
              ? `<${responseCode}, ${defaultErrorType}`
              : `<${responseCode}, (typeof type`;

          expect(code).toContain(expected);
        });
      });
    })
  );
});

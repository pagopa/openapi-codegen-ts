// eslint-disable no-console
import * as fs from "fs-extra";
import { OpenAPI, OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";
import { parseAllOperations, parseDefinition, parseSpecMeta } from "./parse";
import {
  renderAllOperations,
  renderClientCode,
  renderDefinitionCode,
  renderMiddlewareHelper,
  renderServerCode,
  renderSpecCode
} from "./render";
import { IGenerateApiOptions } from "./types";

/**
 * Checks if a parsed spec is in OA2 format
 *
 * @param specs a parsed spec
 *
 * @returns true or false
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function isOpenAPIV2(
  specs: OpenAPI.Document
): specs is OpenAPIV2.Document {
  // eslint-disable-next-line no-prototype-builtins
  return specs.hasOwnProperty("swagger");
}

/**
 * Wraps file writing to expose a common interface and log consistently
 *
 * @param name name of the piece of code to render
 * @param outPath path of the file
 * @param code code to be saved
 *
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
function writeGeneratedCodeFile(name: string, outPath: string, code: string) {
  // eslint-disable-next-line no-console
  console.log(`${name} -> ${outPath}`);
  return fs.writeFile(outPath, code);
}

/**
 * Module's main method. It generates files based on a given specification url
 *
 * @param options
 *
 *
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export async function generateApi(options: IGenerateApiOptions): Promise<void> {
  const {
    specFilePath,
    tsSpecFilePath,
    generateClient = false,
    generateServer = false,
    definitionsDirPath,
    strictInterfaces = false,
    defaultSuccessType = "undefined",
    defaultErrorType = "undefined",
    camelCasedPropNames = false
  } = options;

  const {
    generateRequestTypes = generateClient || generateServer,
    generateResponseDecoders = generateClient
  } = options;

  const api = await SwaggerParser.bundle(specFilePath);

  if (!isOpenAPIV2(api)) {
    throw new Error("The specification is not of type swagger 2");
  }

  await fs.ensureDir(definitionsDirPath);

  if (tsSpecFilePath) {
    await writeGeneratedCodeFile(
      "TS Spec",
      tsSpecFilePath,
      renderSpecCode(api)
    );
  }

  const definitions = api.definitions;
  if (!definitions) {
    // eslint-disable-next-line no-console
    console.log("No definitions found, skipping generation of model code.");
    return;
  }

  await Promise.all(
    Object.keys(definitions).map((definitionName: string) =>
      renderDefinitionCode(
        definitionName,
        parseDefinition(definitions[definitionName]),
        strictInterfaces,
        camelCasedPropNames
      ).then((code: string) =>
        writeGeneratedCodeFile(
          definitionName,
          `${definitionsDirPath}/${definitionName}.ts`,
          code
        )
      )
    )
  );

  const needToParseOperations =
    generateClient || generateServer || generateRequestTypes;

  if (needToParseOperations) {
    const specMeta = parseSpecMeta(api);
    const allOperationInfos = parseAllOperations(
      api,
      defaultSuccessType,
      defaultErrorType
    );

    if (generateRequestTypes) {
      await writeGeneratedCodeFile(
        "request types",
        `${definitionsDirPath}/requestTypes.ts`,
        renderAllOperations(allOperationInfos, generateResponseDecoders)
      );
    }

    if (generateClient) {
      const code = await renderClientCode(specMeta, allOperationInfos);
      await writeGeneratedCodeFile(
        "client",
        `${definitionsDirPath}/client.ts`,
        code
      );
    }

    if (generateServer) {
      const code = await renderServerCode(
        specMeta,
        allOperationInfos,
        api.parameters
      );
      await writeGeneratedCodeFile(
        "server",
        `${definitionsDirPath}/server.ts`,
        code
      );

      await writeGeneratedCodeFile(
        "middleware_helpers",
        `${definitionsDirPath}/middleware_helpers.ts`,
        await renderMiddlewareHelper()
      );
    }
  }
}

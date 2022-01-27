// eslint-disable no-console
import * as fs from "fs-extra";
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";
import { parseAllOperations, parseDefinition, parseSpecMeta } from "./parse";
import {
  renderAllOperations,
  renderClientCode,
  renderDefinitionCode,
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

export function isOpenAPIV3(
  specs: OpenAPI.Document
): specs is OpenAPIV3.Document {
  // eslint-disable-next-line no-prototype-builtins
  return specs.hasOwnProperty("openapi");
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
    definitionsDirPath,
    strictInterfaces = false,
    defaultSuccessType = "undefined",
    defaultErrorType = "undefined",
    camelCasedPropNames = false
  } = options;

  const {
    generateRequestTypes = generateClient,
    generateResponseDecoders = generateClient
  } = options;

  const api = await SwaggerParser.bundle(specFilePath);

  if (!isOpenAPIV2(api) && !isOpenAPIV3(api)) {
    throw new Error("The specification is not of type swagger 2 or openapi 3");
  }

  await fs.ensureDir(definitionsDirPath);

  if (tsSpecFilePath) {
    await writeGeneratedCodeFile(
      "TS Spec",
      tsSpecFilePath,
      renderSpecCode(api)
    );
  }

  if (isOpenAPIV2(api)) {
    if (!api.definitions) {
      // eslint-disable-next-line no-console
      console.log("No definitions found, skipping generation of model code.");
      return;
    }
    const definitions = api.definitions;
    await Promise.all(
      Object.keys(definitions).map((definitionName: string) =>
        renderDefinitionCode(
          definitionName,
          parseDefinition(definitions[definitionName]),
          strictInterfaces,
          camelCasedPropNames,
          "#/definitions/"
        ).then((code: string) =>
          writeGeneratedCodeFile(
            definitionName,
            `${definitionsDirPath}/${definitionName}.ts`,
            code
          )
        )
      )
    );

    const needToParseOperations = generateClient || generateRequestTypes;

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
    }
  } else {
    if (!api.components?.schemas) {
      // eslint-disable-next-line no-console
      console.log("No definitions found, skipping generation of model code.");
      return;
    }
    const definitions = api.components.schemas;

    await Promise.all(
      Object.keys(definitions).map((definitionName: string) =>
        renderDefinitionCode(
          definitionName,
          parseDefinition(definitions[definitionName]),
          strictInterfaces,
          camelCasedPropNames,
          "#/components/schemas/"
        ).then((code: string) =>
          writeGeneratedCodeFile(
            definitionName,
            `${definitionsDirPath}/${definitionName}.ts`,
            code
          )
        )
      )
    );

    const needToParseOperations = generateClient || generateRequestTypes;

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
    }
  }
}

// tslint:disable:no-console
import * as fs from "fs-extra";
import { OpenAPI, OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";
import { IGenerateApiOptions } from "./types";
import { parseAllOperations, parseSpecMeta } from "./parse";
import { renderAllOperations, renderDefinitionCode, renderClientCode, renderSpecCode } from "./render";

/**
 * Checks if a parsed spec is in OA2 format
 * @param specs a parsed spec
 *
 * @returns true or false
 */
export function isOpenAPIV2(
  specs: OpenAPI.Document
): specs is OpenAPIV2.Document {
  return specs.hasOwnProperty("swagger");
}

/**
 * Wraps file writing to expose a common interface and log consistently
 * @param name name of the piece of code to render
 * @param outPath path of the file
 * @param code code to be saved
 *
 */
function writeGeneratedCodeFile(name: string, outPath: string, code: string) {
  console.log(`${name} -> ${outPath}`);
  return fs.writeFile(outPath, code);
}

/**
 * Module's main method. It generates files based on a given specification url
 * @param options
 *
 *
 */
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
    console.log("No definitions found, skipping generation of model code.");
    return;
  }

  await Promise.all(
    Object.keys(definitions).map((definitionName: string) =>
      renderDefinitionCode(
        definitionName,
        definitions[definitionName],
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

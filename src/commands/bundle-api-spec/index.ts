import { OpenAPIV2 } from "openapi-types";
import * as SwaggerParser from "swagger-parser";
import * as writeYamlFile from "write-yaml-file";

export interface IBundleApiSpecOptions {
  specFilePath: string | OpenAPIV2.Document;
  outPath: string;
  version?: string;
}

/**
 * Takes an OpenAPI spec and writes a new one with only inner references
 * @param param0
 */
export async function bundleApiSpec({
  outPath,
  specFilePath,
  version
}: IBundleApiSpecOptions) {
  const bundled = await SwaggerParser.bundle(specFilePath);
  // overwrite version
  const edited = version
    ? { ...bundled, info: { ...bundled.info, version } }
    : bundled;

  return writeYamlFile(outPath, edited);
}

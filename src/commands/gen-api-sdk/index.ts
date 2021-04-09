import * as fs from "fs-extra";
import { generateApi } from "../../index";
import {
  createTemplateEnvironment,
  DEFAULT_TEMPLATE_DIR
} from "../../lib/templating";
import { bundleApiSpec } from "../bundle-api-spec";
import {
  IGenerateSdkOptions,
  IGeneratorParams,
  IPackageAttributes,
  IRegistryAttributes
} from "./types";

const { render } = createTemplateEnvironment({
  templateDir: `${DEFAULT_TEMPLATE_DIR}/sdk`
});

/**
 * Generate models as well as package scaffolding for a sdk that talks to a provided api spec
 *
 * @param options
 */
export async function generateSdk(options: IGenerateSdkOptions) {
  const { inferAttr, ...params } = options;

  await fs.ensureDir(params.outPath);

  const templateParams: IPackageAttributes &
    IRegistryAttributes &
    IGeneratorParams = inferAttr
    ? mergeParams(await inferAttributesFromPackage(), params)
    : params;

  const renderedFiles = await renderAll(listTemplates(), templateParams);
  await writeAllGeneratedCodeFiles(options.outPath, renderedFiles);
  await generateApi({
    camelCasedPropNames: options.camelCasedPropNames,
    defaultErrorType: options.defaultErrorType,
    defaultSuccessType: options.defaultSuccessType,
    definitionsDirPath: options.outPath,
    generateClient: true,
    specFilePath: options.specFilePath,
    strictInterfaces: options.strictInterfaces
  });
  await bundleApiSpec({
    outPath: `${options.outPath}/openapi.yaml`,
    specFilePath: options.specFilePath,
    version: options.version
  });
}

async function inferAttributesFromPackage(): Promise<
  IPackageAttributes & IRegistryAttributes
> {
  const pkg = await fs
    .readFile(`${process.cwd()}/package.json`)
    .then(String)
    .then(JSON.parse)
    .catch(ex => {
      throw new Error(
        `Failed to read package.json from the current directory: ${ex}`
      );
    });
  return {
    name: `${pkg.name}-sdk`,
    version: pkg.version,
    description: `Generated SDK for ${pkg.name}. ${pkg.description}`,
    author: pkg.author,
    license: pkg.license,
    registry: pkg.publishConfig?.registry,
    access: pkg.publishConfig?.access
  };
}

function mergeParams<A extends object, B extends object>(a: A, b: B): any {
  return Object.keys({ ...a, ...b }).reduce(
    (p: object, k: string) => ({
      ...p,
      [k]: b[k as keyof B] || a[k as keyof A]
    }),
    {}
  );
}

function listTemplates(): ReadonlyArray<string> {
  return ["package.json.njk", "tsconfig.json.njk", "index.ts.njk"];
}

/**
 * Renders all templates and return a hashmap in the form (filepath, renderedCode)
 *
 * @param options
 */
export async function renderAll(
  files: ReadonlyArray<string>,
  options: IPackageAttributes & IRegistryAttributes & IGeneratorParams
): Promise<Record<string, string>> {
  const allContent = await Promise.all(
    files.map(file => render(file, options))
  );
  return allContent.reduce(
    (p: Record<string, string>, rendered: string, i) => ({
      ...p,
      [files[i]]: rendered
    }),
    {}
  );
}

/**
 * Wraps file writing to expose a common interface and log consistently
 *
 * @param name name of the piece of code to render
 * @param outPath path of the file
 * @param code code to be saved
 *
 */
function writeGeneratedCodeFile(name: string, outPath: string, code: string) {
  console.log(`${name} -> ${outPath}`);
  return fs.writeFile(outPath, code);
}

function writeAllGeneratedCodeFiles(
  outPath: string,
  files: Record<string, string>
) {
  return Promise.all(
    Object.keys(files).map((filepath: string) =>
      writeGeneratedCodeFile(
        filepath,
        `${outPath}/${filepath}`.replace(".njk", ""),
        files[filepath]
      )
    )
  );
}

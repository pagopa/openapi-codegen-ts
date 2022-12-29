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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
export async function generateSdk(options: IGenerateSdkOptions) {
  // ensure target directories to exist
  await fs.ensureDir(options.outPath);
  const outPathNoStrict = `${options.outPath}/no-strict`;
  await fs.ensureDir(outPathNoStrict);

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await generatePackageFiles(options);

  // generate definitions both strict and no-strict
  // so that the users can choose which version to include in their code
  await Promise.all(
    [
      {
        definitionsDirPath: options.outPath,
        strictInterfaces: true
      },
      {
        definitionsDirPath: outPathNoStrict,
        strictInterfaces: false
      }
    ].map(({ strictInterfaces, definitionsDirPath }) =>
      generateApi({
        camelCasedPropNames: options.camelCasedPropNames,
        defaultErrorType: options.defaultErrorType,
        defaultSuccessType: options.defaultSuccessType,
        definitionsDirPath,
        generateClient: true,
        specFilePath: options.specFilePath,
        strictInterfaces
      })
    )
  );

  // resolve references in spec file and bundle
  await bundleApiSpec({
    outPath: `${options.outPath}/openapi.yaml`,
    specFilePath: options.specFilePath,
    version: options.version
  });
}

// generate and save files requires for the package to be published
const generatePackageFiles = async (
  options: IGenerateSdkOptions
): Promise<void> => {
  const { inferAttr, ...params } = options;
  const templateParams: IPackageAttributes &
    IRegistryAttributes &
    IGeneratorParams = inferAttr
    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
      mergeParams(await inferAttributesFromPackage(), params)
    : params;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const renderedFiles = await renderAll(listTemplates(), templateParams);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await writeAllGeneratedCodeFiles(options.outPath, renderedFiles);
};

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
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
    // eslint-disable-next-line sort-keys
    description: `Generated SDK for ${pkg.name}. ${pkg.description}`,
    // eslint-disable-next-line sort-keys
    author: pkg.author,
    license: pkg.license,
    registry: pkg.publishConfig?.registry,
    // eslint-disable-next-line sort-keys
    access: pkg.publishConfig?.access
  };
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions, @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function mergeParams<A extends object, B extends object>(a: A, b: B): any {
  return Object.keys({ ...a, ...b }).reduce(
    // eslint-disable-next-line @typescript-eslint/ban-types
    (p: object, k: string) => ({
      ...p,
      [k]: b[k as keyof B] || a[k as keyof A]
    }),
    {}
  );
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function listTemplates(): ReadonlyArray<string> {
  return [
    ".npmignore.njk",
    "package.json.njk",
    "tsconfig.json.njk",
    "index.ts.njk"
  ];
}

/**
 * Renders all templates and return a hashmap in the form (filepath, renderedCode)
 *
 * @param options
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
function writeGeneratedCodeFile(name: string, outPath: string, code: string) {
  // eslint-disable-next-line no-console
  console.log(`${name} -> ${outPath}`);
  return fs.writeFile(outPath, code);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
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

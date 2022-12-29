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

const inferAttributesFromPackage = async (): Promise<IPackageAttributes &
  IRegistryAttributes> => {
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
    access: pkg.publishConfig?.access,
    author: pkg.author,
    description: `Generated SDK for ${pkg.name}. ${pkg.description}`,
    license: pkg.license,
    name: `${pkg.name}-sdk`,
    registry: pkg.publishConfig?.registry,
    version: pkg.version
  };
};

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
const mergeParams = <A extends object, B extends object>(a: A, b: B): any =>
  Object.keys({ ...a, ...b }).reduce(
    // eslint-disable-next-line @typescript-eslint/ban-types
    (p: object, k: string) => ({
      ...p,
      [k]: b[k as keyof B] || a[k as keyof A]
    }),
    {}
  );

/**
 * Renders all templates and return a hashmap in the form (filepath, renderedCode)
 *
 * @param options
 */
export const renderAll = async (
  files: ReadonlyArray<string>,
  options: IPackageAttributes & IRegistryAttributes & IGeneratorParams
): Promise<Record<string, string>> => {
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
};

/**
 * Wraps file writing to expose a common interface and log consistently
 *
 * @param name name of the piece of code to render
 * @param outPath path of the file
 * @param code code to be saved
 *
 */
const writeGeneratedCodeFile = (
  name: string,
  outPath: string,
  code: string
): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`${name} -> ${outPath}`);
  return fs.writeFile(outPath, code);
};

const writeAllGeneratedCodeFiles = (
  outPath: string,
  files: Record<string, string>
): Promise<ReadonlyArray<void>> =>
  Promise.all(
    Object.keys(files).map((filepath: string) =>
      writeGeneratedCodeFile(
        filepath,
        `${outPath}/${filepath}`.replace(".njk", ""),
        files[filepath]
      )
    )
  );

const listTemplates = (): ReadonlyArray<string> => [
  ".npmignore.njk",
  "package.json.njk",
  "tsconfig.json.njk",
  "index.ts.njk"
];

// generate and save files requires for the package to be published
const generatePackageFiles = async (
  options: IGenerateSdkOptions
): Promise<void> => {
  const { inferAttr, ...params } = options;
  const templateParams: IPackageAttributes &
    IRegistryAttributes &
    IGeneratorParams = inferAttr
    ? mergeParams(await inferAttributesFromPackage(), params)
    : params;

  const renderedFiles = await renderAll(listTemplates(), templateParams);

  await writeAllGeneratedCodeFiles(options.outPath, renderedFiles);
};

/**
 * Generate models as well as package scaffolding for a sdk that talks to a provided api spec
 *
 * @param options
 */
export const generateSdk = async (
  options: IGenerateSdkOptions
): Promise<void> => {
  // ensure target directories to exist
  await fs.ensureDir(options.outPath);
  const outPathNoStrict = `${options.outPath}/no-strict`;
  await fs.ensureDir(outPathNoStrict);

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
};

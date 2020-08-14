import * as fs from "fs-extra";
import { generateApi } from "../../index";
import {
  createTemplateEnvironment,
  DEFAULT_TEMPLATE_DIR
} from "../../lib/templating";
import { IGenerateSdkOptions } from "./types";

const { render } = createTemplateEnvironment({
  templateDir: `${DEFAULT_TEMPLATE_DIR}/sdk`
});

/**
 * Generate models as well as package scaffolding for a sdk that talks to a provided api spec
 * @param options 
 */
export async function generateSdk(options: IGenerateSdkOptions) {
  const files = await listTemplates();
  const renderedFiles = await renderAll(files, options);
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
}

async function listTemplates(): Promise<string[]> {
  return ["package.json.njk", "tsconfig.json.njk", "index.ts.njk"];
}

/**
 * Renders all templates and return a hashmap in the form (filepath, renderedCode)
 * @param options
 */
export async function renderAll(
  files: ReadonlyArray<string>,
  options?: object
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

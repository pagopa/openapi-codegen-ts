/**
 * This module is executed once before every test suite. For each specification to test:
            // eslint-disable-next-line jsdoc/check-indentation
 *  - it generates files
 *  - it runs mock servers
 */

import { generateApi } from "@pagopa/openapi-codegen-ts";
import { array } from "fp-ts/lib/Array";
import { task } from "fp-ts/lib/Task";
import { right, taskEither, tryCatch } from "fp-ts/lib/TaskEither";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import config from "./config";

const noopTE = right<Error, undefined>(task.of(undefined));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const tsGenerateApi = (...p: Parameters<typeof generateApi>) =>
  tryCatch(
    () => generateApi(...p),
    reason => {
      // eslint-disable-next-line no-console
      console.error(reason);
      return new Error(`cannot create api `);
    }
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => {
  // eslint-disable-next-line no-console
  console.log("Running e2e tests with config:", config);

  const { specs, skipGeneration } = config;
  const tasks = Object.values(specs)
    .filter(({ isSpecEnabled }) => isSpecEnabled)
    .map(({ url, generatedFilesDir }) =>
      skipGeneration
        ? noopTE
        : tsGenerateApi({
            camelCasedPropNames: false,
            definitionsDirPath: generatedFilesDir,
            generateClient: true,

            generateServer: true,
            specFilePath: url,
            strictInterfaces: true
          })
    );

  const startedAt = Date.now();
  return array
    .sequence(taskEither)(tasks)
    .orElse(e => {
      throw e;
    })
    .run()
    .then(() =>
      // eslint-disable-next-line no-console
      console.log(`setup completed after ${Date.now() - startedAt}ms`)
    );
};

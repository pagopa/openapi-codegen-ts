/**
 * This module is executed once before every test suite. For each specification to test:
            // eslint-disable-next-line jsdoc/check-indentation
 *  - it generates files
 *  - it runs mock servers
 */

import { generateApi } from "@pagopa/openapi-codegen-ts";
import { sequence } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";

import * as TE from "fp-ts/lib/TaskEither";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import config from "./config";
import { startMockServer } from "./server";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const noopTE = TE.right<Error, unknown>(undefined);

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
const tsStartServer = (...p: Parameters<typeof startMockServer>) =>
  tryCatch(
    () => startMockServer(...p),
    reason => {
      // eslint-disable-next-line no-console
      console.error(reason);
      return new Error(`cannot start mock server`);
    }
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => {
  // eslint-disable-next-line no-console
  console.log("Running e2e tests with config:", config);

  const { specs, skipClient, skipGeneration } = config;
  const tasks = Object.values(specs)
    .filter(({ isSpecEnabled }) => isSpecEnabled)
    .map(({ url, mockPort, generatedFilesDir, strictInterfaces }) => {
      // eslint-disable-next-line sonarjs/prefer-immediate-return
      const p = pipe(
        skipGeneration
          ? noopTE
          : tsGenerateApi({
              camelCasedPropNames: false,
              definitionsDirPath: generatedFilesDir,
              generateClient: true,
              specFilePath: url,
              strictInterfaces
            }),
        TE.chain(() => (skipClient ? noopTE : tsStartServer(url, mockPort)))
      );

      return p;
    });

  const startedAt = Date.now();
  return pipe(
    sequence(TE.taskEither)(tasks),
    TE.orElse(e => {
      throw e;
    })
  )().then(_ =>
    // eslint-disable-next-line no-console
    console.log(`setup completed after ${Date.now() - startedAt}ms`)
  );
};

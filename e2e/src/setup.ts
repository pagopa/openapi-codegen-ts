import { array } from "fp-ts/lib/Array";
import { task } from "fp-ts/lib/Task";
import { taskEither, tryCatch, right } from "fp-ts/lib/TaskEither";
import { ensureDir } from "fs-extra";
import { generateApi } from "italia-utils";
import config from "./config";
import { startMockServer } from "./server";

const noopTE = right<Error, undefined>(task.of(undefined));

const tsEnsureDir = (dir: string) =>
  tryCatch(() => ensureDir(dir), () => new Error(`cannot create dir ${dir}`));
const tsGenerateApi = (...p: Parameters<typeof generateApi>) =>
  tryCatch(
    () => generateApi(...p),
    reason => {
      console.error(reason);
      return new Error(`cannot create api `);
    }
  );

const tsStartServer = (...p: Parameters<typeof startMockServer>) =>
  tryCatch(
    () => startMockServer(...p),
    reason => {
      console.error(reason);
      return new Error(`cannot start mock server`);
    }
  );

export default async () => {
  console.log('Running e2e tests with config:', config)
  
  const { specs, skipClient, skipGeneration } = config;
  const tasks = Object.values(specs)
    .filter(({ enabled }) => enabled)
    .map(({ url, mockPort, generatedFilesDir }) =>
      tsEnsureDir(generatedFilesDir)
        .chain(() =>
          skipGeneration
            ? noopTE
            : tsGenerateApi({
                definitionsDirPath: generatedFilesDir,
                generateClient: true,
                specFilePath: url,
                strictInterfaces: true
              })
        )
        .chain(() => (skipClient ? noopTE : tsStartServer(url, mockPort)))
    );

  const startedAt = Date.now();
  return array
    .sequence(taskEither)(tasks)
    .orElse((e: Error) => {
      throw e;
    })
    .run()
    .then(() =>
      console.log(`setup completed after ${Date.now() - startedAt}ms`)
    );
};
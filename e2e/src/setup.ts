import { array } from "fp-ts/lib/Array";
import { taskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { ensureDir } from "fs-extra";
import { generateApi } from "italia-utils";
import config from "./config";
import { startMockServer } from "./server";

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
  const { specs } = config;

  const tasks = Object.values(specs).map(
    ({ url, mockPort, generatedFilesDir }) =>
      tsEnsureDir(generatedFilesDir)
        .chain(() =>
          tsGenerateApi({
            definitionsDirPath: generatedFilesDir,
            generateClient: true,
            specFilePath: url,
            strictInterfaces: true
          })
        )
        .chain(() => tsStartServer(url, mockPort))
  );

  return array
    .sequence(taskEither)(tasks)
    .orElse((e: Error) => {
      throw e;
    })
    .run();
};

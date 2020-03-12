/* tslint:disable:no-duplicate-string */

import { spawn } from "child_process";
import { ensureDir, readFile } from "fs-extra";
import { ncp } from "ncp";
import { tmpdir } from "os";
import rimraf from "rimraf";
import { promisify } from "util";

const tmpPath = `${tmpdir()}/test_gen-api-models_${Date.now()}`;
const tscOutDir = `${tmpPath}/dist`;
const generatedOutDir = `${tmpPath}/generated`;
const specPath = `${__dirname}/api.yaml`;

jest.setTimeout(100000);

const runJob = (prog, args, cwd) => () => {
  // tslint:disable-next-line: no-commented-code
  // uncomment this line to pritn executed script
  // console.log(`executing "${prog} ${args.join(" ")}" on ${cwd}`);
  return new Promise((resolve, reject) => {
    try {
      const job = spawn(prog, args, {
        cwd
      });

      job.on("error", error => reject(error));
      job.on("exit", res => resolve(res));
    } catch (error) {
      reject(error);
    }
  });
};

const tsc = runJob(
  "node",
  [
    `${process.cwd()}/node_modules/typescript/lib/tsc.js`,
    "--outDir",
    tscOutDir
  ],
  process.cwd()
);

const genApiModels = runJob(
  "node",
  [
    `${tscOutDir}/index.js`,
    "--api-spec",
    specPath,
    "--out-dir",
    generatedOutDir
  ],
  tmpPath
);

const npmInstall = runJob("npm", ["install", "--production"], tmpPath);

const copy = promisify(ncp);

beforeAll(async () => {
  await tsc();

  await Promise.all([
    tsc(),
    copy(`${process.cwd()}/package.json`, `${tmpPath}/package.json`),
    copy(`${process.cwd()}/templates`, `${tmpPath}/templates`),
    ensureDir(generatedOutDir)
  ]);
  await npmInstall();
});

afterAll(done => {
  rimraf(tmpPath, () => {
    done();
  });
});

describe("CLI", () => {
  beforeAll(async () => {
    await genApiModels();
  });

  const expectedGeneratedFiles = [
    "AdditionalPropsTest.ts",
    "AdditionalPropsTrueTest.ts",
    "AdditionalpropsDefault.ts",
    "AllOfOneOfTest.ts",
    "AllOfTest.ts",
    "CreatedMessageWithContent.ts",
    "CustomStringFormatTest.ts",
    "EmailAddress.ts",
    "EnumTest.ts",
    "ExtendedProfile.ts",
    "FiscalCode.ts",
    "InlinePropertyTest.ts",
    "IsInboxEnabled.ts",
    "IsWebhookEnabled.ts",
    "LimitedProfile.ts",
    "Message.ts",
    "MessageContent.ts",
    "NestedObjectTest.ts",
    "NonNegativeIntegerTest.ts",
    "NonNegativeNumberTest.ts",
    "OneOfTest.ts",
    "OrganizationFiscalCode.ts",
    "OrganizationFiscalCodeTest.ts",
    "PaginationResponse.ts",
    "PreferredLanguages.ts",
    "Profile.ts",
    "ServicePublic.ts",
    "WithinRangeIntegerTest.ts",
    "WithinRangeNumberTest.ts",
    "WithinRangeStringTest.ts"
  ];

  expectedGeneratedFiles.forEach(filename =>
    it(`should generate ${filename} as in snapshot`, async () => {
      const content = await readFile(`${generatedOutDir}/${filename}`, "utf-8");
      expect(content).toMatchSnapshot();
    })
  );
});

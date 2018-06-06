#!/usr/bin/env node

import yargs = require("yargs");
import { generateApi, initNunJucksEnvironment } from "./gen-api-models";

//
// parse command line
//

const argv = yargs
  .option("api-spec", {
    demandOption: true,
    description: "Path to input OpenAPI spec file",
    normalize: true,
    string: true
  })
  .option("strict", {
    boolean: false,
    default: true,
    description: "Generate strict interfaces (default: true)"
  })
  .option("out-dir", {
    demandOption: true,
    description: "Output directory to store generated definition files",
    normalize: true,
    string: true
  })
  .option("ts-spec-file", {
    description:
      "If defined, converts the OpenAPI specs to TypeScript source and writes it to this file",
    normalize: true,
    string: true
  })
  .help().argv;

//
// Generate APIs
//

const env = initNunJucksEnvironment();
generateApi(
  env,
  argv["api-spec"],
  argv["out-dir"],
  argv["ts-spec-file"],
  argv.strict
  // tslint:disable-next-line:no-console
).then(() => console.log("done"), err => console.log(`Error: ${err}`));

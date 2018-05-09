#!/usr/bin/env node

import yargs = require("yargs");

import { initNunJucksEnvironment, generateApi } from "./gen-api-models";

//
// parse command line
//

const argv = yargs
  .option("api-spec", {
    demandOption: true,
    string: true,
    normalize: true,
    description: "Path to input OpenAPI spec file"
  })
  .option("strict", {
    boolean: false,
    default: true,
    description: "Generate strict interfaces (default: true)"
  })
  .option("out-dir", {
    demandOption: true,
    string: true,
    normalize: true,
    description: "Output directory to store generated definition files"
  })
  .option("ts-spec-file", {
    string: true,
    normalize: true,
    description:
      "If defined, converts the OpenAPI specs to TypeScript source and writes it to this file"
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
  argv["strict"]
).then(() => console.log("done"), err => console.log(`Error: ${err}`));

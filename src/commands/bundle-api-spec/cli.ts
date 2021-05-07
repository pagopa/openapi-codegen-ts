#!/usr/bin/env node

import yargs = require("yargs");
import { bundleApiSpec } from ".";

//
// parse command line
//

const CODE_GROUP = "Code generation options:";

const argv = yargs
  .option("api-spec", {
    alias: "i",
    demandOption: true,
    description: "Path to input OpenAPI spec file",
    group: CODE_GROUP,
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true
  })
  .option("out-path", {
    alias: "o",
    demandOption: true,
    description: "Output path of the spec file",
    group: CODE_GROUP,
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true
  })
  .option("api-version", {
    alias: "V",
    description:
      "Version of the api. If provided, override the version in the original spec file",
    group: CODE_GROUP,
    // eslint-disable-next-line id-blacklist
    string: true
  })
  .help().argv;

//
// BUNDLE APIs
//
bundleApiSpec({
  outPath: argv["out-path"],
  specFilePath: argv["api-spec"],
  version: argv["api-version"]
}).then(
  // eslint-disable-next-line no-console
  () => console.log("done"),
  err => {
    // eslint-disable-next-line no-console
    console.log(`Error: ${err}`);
    process.exit(1);
  }
);

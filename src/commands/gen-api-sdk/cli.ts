#!/usr/bin/env node

import yargs = require("yargs");
import { generateSdk } from ".";

//
// parse command line
//

const argv = yargs
  .option("name", {
    demandOption: true,
    description: "Name of the generated package",
    normalize: true,
    string: true
  })
  .option("version", {
    demandOption: true,
    description: "Version of the generated package",
    normalize: false,
    string: true
  })
  .option("registry", {
    demandOption: true,
    description: "Url of the registry the package is published in",
    normalize: true,
    string: true
  })
  .option("access", {
    demandOption: true,
    description:
      "Either 'public' or 'private', depending of the accessibility of the package in the registry",
    normalize: true,
    string: true
  })
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
  .option("default-success-type", {
    default: "undefined",
    description:
      "Default type for success responses (experimental, default: 'undefined')",
    normalize: true,
    string: true
  })
  .option("default-error-type", {
    default: "undefined",
    description:
      "Default type for error responses (experimental, default: 'undefined')",
    normalize: true,
    string: true
  })
  .help().argv;

//
// Generate APIs
//

generateSdk({
  name: argv.name,
  version: argv.version,
  description: argv.description,
  author: argv.author,
  license: argv.license,
  registry: argv.registry,
  access: argv.access,
  defaultErrorType: argv["default-error-type"],
  defaultSuccessType: argv["default-success-type"],
  outPath: argv["out-dir"],
  specFilePath: argv["api-spec"],
  strictInterfaces: argv.strict
}).then(
  () => console.log("done"),
  err => console.log(`Error: ${err}`)
);

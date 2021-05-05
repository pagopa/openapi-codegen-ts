#!/usr/bin/env node

import yargs = require("yargs");
import { generateApi } from ".";

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
  .option("request-types", {
    boolean: false,
    default: false,
    description: "Generate request types (experimental, default: false)"
  })
  .option("response-decoders", {
    boolean: false,
    default: false,
    description:
      "Generate response decoders (experimental, default: false, implies --request-types)"
  })
  .option("client", {
    boolean: false,
    default: false,
    description: "Generate request client SDK"
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
  .option("camel-cased", {
    boolean: false,
    default: false,
    description: "Generate camelCased properties name (default: false)"
  })
  .help().argv;

//
// Generate APIs
//

generateApi({
  camelCasedPropNames: argv["camel-cased"],
  defaultErrorType: argv["default-error-type"],
  defaultSuccessType: argv["default-success-type"],
  definitionsDirPath: argv["out-dir"],
  generateClient: argv.client,
  generateRequestTypes: argv["request-types"],
  generateResponseDecoders: argv["response-decoders"],
  specFilePath: argv["api-spec"],
  strictInterfaces: argv.strict,
  tsSpecFilePath: argv["ts-spec-file"]
}).then(
  () => console.log("done"),
  err => {
    console.log(`Error: ${err}`);
    process.exit(1);
  }
);

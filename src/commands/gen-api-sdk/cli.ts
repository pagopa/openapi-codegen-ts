#!/usr/bin/env node

/* eslint-disable sonarjs/no-duplicate-string */

import yargs = require("yargs");
import { generateSdk } from ".";

//
// parse command line
//

const PACKAGE_GROUP = "Package options:";
const CODE_GROUP = "Code generation options:";

const argv = yargs

  .option("no-infer-attrs", {
    alias: ["N"],
    // eslint-disable-next-line id-blacklist
    boolean: true,
    description:
      "Infer package attributes from a package.json file present in the current directory",
    group: PACKAGE_GROUP,
    // eslint-disable-next-line sort-keys
    default: false
  })
  .option("package-name", {
    alias: ["n", "name"],
    description: "Name of the generated package",
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .option("package-version", {
    alias: "V",
    description: "Version of the generated package",
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .option("package-description", {
    alias: ["d", "desc"],
    description: "Description of the package",
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .option("package-author", {
    alias: ["a", "author"],
    description: "The author of the API exposed",
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .option("package-license", {
    alias: ["L", "license"],
    description: "The license of the API Exposed",
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .implies("no-infer-attrs", [
    "package-name",
    "package-version",
    "package-description",
    "package-author",
    "package-license"
  ])
  .option("package-registry", {
    alias: ["r", "registry"],
    description: "Url of the registry the package is published in",
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .option("package-access", {
    alias: ["x", "access"],
    description:
      "Either 'public' or 'private', depending of the accessibility of the package in the registry",
    // eslint-disable-next-line sort-keys
    choices: ["public", "private"],
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: PACKAGE_GROUP
  })
  .implies("package-registry", "package-access")
  .option("api-spec", {
    alias: "i",
    demandOption: true,
    description: "Path to input OpenAPI spec file",
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: CODE_GROUP
  })
  .option("strict", {
    // eslint-disable-next-line id-blacklist
    boolean: false,
    default: true,
    description: "Generate strict interfaces (default: true)",
    group: CODE_GROUP
  })
  .option("out-dir", {
    alias: "o",
    demandOption: true,
    description: "Output directory to store generated definition files",
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: CODE_GROUP
  })
  .option("default-success-type", {
    default: "undefined",
    description:
      "Default type for success responses (experimental, default: 'undefined')",
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: CODE_GROUP
  })
  .option("default-error-type", {
    default: "undefined",
    description:
      "Default type for error responses (experimental, default: 'undefined')",
    normalize: true,
    // eslint-disable-next-line id-blacklist
    string: true,
    // eslint-disable-next-line sort-keys
    group: CODE_GROUP
  })
  .option("camel-cased", {
    // eslint-disable-next-line id-blacklist
    boolean: false,
    default: false,
    description: "Generate camelCased properties name (default: false)",
    group: CODE_GROUP
  })
  .help().argv;

//
// Generate APIs
//
generateSdk({
  camelCasedPropNames: argv["camel-cased"],
  inferAttr: !argv["no-infer-attr"],
  name: argv["package-name"],
  version: argv["package-version"],
  // eslint-disable-next-line sort-keys
  description: argv["package-description"],
  // eslint-disable-next-line sort-keys
  author: argv["package-author"],
  license: argv["package-license"],
  registry: argv["package-registry"],
  // eslint-disable-next-line sort-keys
  access: argv["package-access"],
  defaultErrorType: argv["default-error-type"],
  defaultSuccessType: argv["default-success-type"],
  outPath: argv["out-dir"],
  specFilePath: argv["api-spec"],
  strictInterfaces: argv.strict
}).then(
  // eslint-disable-next-line no-console
  () => console.log("done"),
  // eslint-disable-next-line no-console
  err => console.log(`Error: ${err}`)
);

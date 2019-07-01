# Utilities and tools for the Digital Citizenship initiative

This package provide some tools that are used across the projects of the
Digital Citizenship initiative.

To add the tools to a project:

```
$ yarn add -D italia-utils
```
## OpenAPI support

The current strategy is to maintain backward compatibility.
With the ability to accept the swagger and oas3 specifications, after automatically detecting the version of the specification.

To support OpenAPI we adopt this strategy:
  - function to detect the version of Spec. in use
  - added different models
  - updated packages
  - added new schemas for support new version

Has been created tests for oas3 based on current tests, added different templates for swagger 2.0 and OpenAPI 3.0.
we are updated `swagger-parser`, because the current version does not support OpenAPI 3.0
Removed `swagger-schema-official` and replace with `openapi-types`, because swagger-schema-official does not support OpenAPI 3.0
Now we are in the testing phase.

## gen-api-models

This tool generates TypeScript definitions of OpenAPI specs.

In simple terms it converts an OpenAPI spec like [this one](https://github.com/teamdigitale/digital-citizenship-functions/blob/f04666c8b7f2d4bebde19676b49b19119b03ef17/api/public_api_v1.yaml) into:

* A TypeScript [representation of the specs](https://github.com/teamdigitale/digital-citizenship-functions/blob/6798225bd725a42753b16375ce18a954a268f9b6/lib/api/public_api_v1.ts).
* An [io-ts](https://github.com/gcanti/io-ts) type definitions for [each API definition](https://github.com/teamdigitale/digital-citizenship-functions/tree/6798225bd725a42753b16375ce18a954a268f9b6/lib/api/definitions) that provides compile time types and runtime validation.

Note: the generated models requires the runtime dependency `italia-ts-commons`.

### Usage

```
$ gen-api-models --help
Options:
  --version       Show version number                                  [boolean]
  --api-spec      Path to input OpenAPI spec file            [string] [required]
  --out-dir       Output directory to store generated definition files
                                                             [string] [required]
  --ts-spec-file  If defined, converts the OpenAPI specs to TypeScript source
                  and writes it to this file                            [string]
  --help          Show help                                            [boolean]
```

Example:

```
$ gen-api-models --api-spec ./api/public_api_v1.yaml --out-dir ./lib/api/definitions --ts-spec-file ./lib/api/public_api_v1.ts
Writing TS Specs to lib/api/public_api_v1.ts
ProblemJson -> lib/api/definitions/ProblemJson.ts
NotificationChannel -> lib/api/definitions/NotificationChannel.ts
NotificationChannelStatusValue -> lib/api/definitions/NotificationChannelStatusValue.ts
...
done
```

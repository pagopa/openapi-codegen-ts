# Utilities and tools for the Digital Citizenship initiative

This package provide some tools that are used across the projects of the
Digital Citizenship initiative.

To add the tools to a project:

```
$ yarn add -D italia-utils
```
## OpenAPI 3 support

Our goal is to implement support of OAS3 specifications 
while maintaining a backward compatibility with the current swagger2 implementation.

The strategy is the following:

- [x] identify an updated version of Swagger-Parser library which now
   supports OAS3 via the OpenAPI-Types which replaces the old
   Swagger-Schema-Official library;

- [x] move the actual Swagger2 code to the new OpenAPI-Types so that
   all io-utils, io-functions, io-functions-commons test works. 
   To ensure that related projects work, we set up some circleci
   builds linked to the io-utils github branch instead of the
   version distributed on npm;

- [x] plan OAS3 tests based on the existing testlist

- [x] create a function to detect the spec version (OAS3 or Swagger2):
   all old functions now receive the spec version as an input parameter;

- [x] create two different njk models: one unchanged for Swagger2, so 
   that we retain compatibility with the previous code, and a new one
   for OAS3 where we are free to modify anything that is needed to 
   implement new features;

We think that this strategy gives us enough specification agility and
can be applied iteratively to other specifications, as you just have to:

- modify the detect-version function;
- provide a new njk model for the new spec kind.

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

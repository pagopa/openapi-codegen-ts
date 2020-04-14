# Utilities and tools for the Digital Citizenship initiative

This package provide some tools that are used across the projects of the
Digital Citizenship initiative.

To add the tools to a project:

```
$ yarn add -D io-utils
```
## important: check your openapi spec
If you need to keep the references between the generated classes, the specification file must contain all the schema definitions. See example below.

example:

if the `Pets` schema uses the `Pet`, import both into the main document 
```
components:
  schemas:
    Pets:
        $ref: "animal.yaml#/Pets"
    Pet:
        $ref: "animal.yaml#/Pet"
```
*animal.yaml*
```
Pets:
  type: array
  items:
    $ref: '#/definitions/Pet'
Pet:
  type: "object"
  required:
    - name
  properties:
    name:
      type: string
```


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

### Requirements

* `node` version >= 10.8.0


## TEST

### Unit test
Run test over utils' implementation

```sh
yarn test
```

### End-to-end test
Run test over generated files

```sh
yarn e2e
```

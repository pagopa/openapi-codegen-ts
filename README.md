# Utilities and tools for the Digital Citizenship initiative

This package provide some tools that are used across the projects of the
Digital Citizenship initiative.

To add the tools to a project:

```sh
$ yarn add -D io-utils
```
## important: check your openapi spec
If you need to keep the references between the generated classes, the specification file must contain all the schema definitions. See example below.

example:

if the `Pets` schema uses the `Pet`, import both into the main document 
```yaml
components:
  schemas:
    Pets:
        $ref: "animal.yaml#/Pets"
    Pet:
        $ref: "animal.yaml#/Pet"
```
*animal.yaml*
```yaml
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
* A http client exposing API operations as a collection of Typescript functions

Note: the generated models requires the runtime dependency `italia-ts-commons`.


### Usage

```sh
$ gen-api-models --help
Options:
  --version               Show version number                          [boolean]
  --api-spec              Path to input OpenAPI spec file    [string] [required]
  --strict                Generate strict interfaces (default: true)
                                                                 [default: true]
  --out-dir               Output directory to store generated definition files
                                                             [string] [required]
  --ts-spec-file          If defined, converts the OpenAPI specs to TypeScript
                          source and writes it to this file             [string]
  --request-types         Generate request types (default: false)
                                                                [default: false]
  --response-decoders     Generate response decoders (default:
                          false, implies --request-types)       [default: false]
  --client                Generate request client SDK           [default: false]
  --default-success-type  Default type for success responses (
                          default: 'undefined')  [string] [default: "undefined"]
  --default-error-type    Default type for error responses (
                          default: 'undefined')  [string] [default: "undefined"]
  --help                  Show help                                    [boolean]
```

Example:

```sh
$ gen-api-models --api-spec ./api/public_api_v1.yaml --out-dir ./lib/api/definitions --ts-spec-file ./lib/api/public_api_v1.ts
Writing TS Specs to lib/api/public_api_v1.ts
ProblemJson -> lib/api/definitions/ProblemJson.ts
NotificationChannel -> lib/api/definitions/NotificationChannel.ts
NotificationChannelStatusValue -> lib/api/definitions/NotificationChannelStatusValue.ts
...
done
```

### Generated client
The http client is defined in `client.ts` module file. It exports the following:
* a type `Client<K>` which define the set of operations
* * `K` a union of keys that represent the parameters omitted by the operations (see `withDefaults` below)
* a function `createClient<K>(parameters): Client<K>` accepting the following parameters:
* * `baseUrl` the base hostname of the api, including protocol and port
* * `fetchApi` an implementation of the [fetch-api](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) as defined in your platform (for example: `node-fetch` if you are in node)
* * `basePath` (optional) if defined, is appended to `baseUrl` for every operations. Its default is the basePath value defined in the specification
* * `withDefaults` (optional) an adapter function that wraps every operations. It may shadow some parameters to the wrapped operations. The use case is: you have a parameter which is common to many operations and you want it to be fixed (example: a session token). 
* a type `WithDefaultsT<K>` that defines an adapter function to be used as `withDefaults`
* * `K` the set of parameters that the adapter will shadow

#### Example
```typescript
import { createClient, WithDefaultsT } from "my-api/client";


// Without withDefaults
const simpleClient: Client = createClient({
    baseUrl: `http://localhost:8080`,
    fetchApi: (nodeFetch as any) as typeof fetch
});

// myOperation is defined to accept { id: string; Bearer: string; }
const result = await simpleClient.myOperation({
    id: "id123",
    Bearer: "VALID_TOKEN"
});


// with withDefaults
const withBearer: WithDefaultsT<"Bearer"> = 
    wrappedOperation => 
        params => { // wrappedOperation and params are correctly inferred
            return wrappedOperation({
              ...params,
              Bearer: "VALID_TOKEN"
            });
          };
//  this is the same of using createClient<"Bearer">. K type is being inferred from withBearer
const clientWithGlobalToken: Client<"Bearer"> = createClient({
    baseUrl: `http://localhost:8080`,
    fetchApi: (nodeFetch as any) as typeof fetch,
    withDefaults: withBearer
});

// myOperation doesn't require "Bearer" anymore, as it's defined in "withBearer" adapter 
const result = await clientWithGlobalToken.myOperation({
    id: "id123"
});
```


## gen-api-sdk
Bundles a generated api models and clients into a node package ready to be published into a registry.

### Usage
```sh
$ gen-api-sdk --help
Package options:
  --package-name, -n, --name          Name of the generated package
                                                             [string] [required]
  --package-version, -V               Version of the generated package
                                                             [string] [required]
  --package-description, -d, --desc   Description of the package
                                                             [string] [required]
  --package-registry, -r, --registry  Url of the registry the package is
                                      published in                      [string]
  --package-access, -x, --access      Either 'public' or 'private', depending of
                                      the accessibility of the package in the
                                      registry
                                         [string] [choices: "public", "private"]
  --package-author, -a, --author      The author of the API exposed
                                                             [string] [required]
  --package-license, -L, --license    The license of the API Exposed
                                                             [string] [required]

Code generation options:
  --api-spec, -i          Path to input OpenAPI spec file    [string] [required]
  --strict                Generate strict interfaces (default: true)
                                                                 [default: true]
  --out-dir, -o           Output directory to store generated definition files
                                                             [string] [required]
  --default-success-type  Default type for success responses (
                          default: 'undefined')  [string] [default: "undefined"]
  --default-error-type    Default type for error responses (
                          default: 'undefined')  [string] [default: "undefined"]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```


## bundle-api-spec
Takes a given api spec file and resolves its esternal references by creating a new file with only internal refereces

```sh
$ bundle-api-spec --help
Code generation options:
  --api-spec, -i     Path to input OpenAPI spec file         [string] [required]
  --out-path, -o     Output path of the spec file            [string] [required]
  --api-version, -V  Version of the api. If provided, override the version in
                     the original spec file                             [string]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
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

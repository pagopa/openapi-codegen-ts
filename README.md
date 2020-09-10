# Utilities and tools for the Digital Citizenship initiative

This package provide some tools that are used across the projects of the
Digital Citizenship initiative.

To add the tools to a project:

```sh
$ yarn add -D italia-utils
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
The script is expected to be executed in the root of an application exposing an API, thus it infers package attributes from the expected `./package.json` file. Values can be still overridden by provinding the respective CLI argument. To avoid this behavior, use `--no-infer-attrs` or `-N`.

### Usage
```sh
$ gen-api-sdk --help
Package options:
  --no-infer-attr, -N                 Infer package attributes from a
                                      package.json file present in the current
                                      directory       [boolean] [default: false]
  --package-name, -n, --name          Name of the generated package     [string]
  --package-version, -V               Version of the generated package  [string]
  --package-description, -d, --desc   Description of the package        [string]
  --package-author, -a, --author      The author of the API exposed     [string]
  --package-license, -L, --license    The license of the API Exposed    [string]
  --package-registry, -r, --registry  Url of the registry the package is
                                      published in                      [string]
  --package-access, -x, --access      Either 'public' or 'private', depending of
                                      the accessibility of the package in the
                                      registry
                                         [string] [choices: "public", "private"]

Code generation options:
  --api-spec, -i          Path to input OpenAPI spec file    [string] [required]
  --strict                Generate strict interfaces (default: true)
                                                                 [default: true]
  --out-dir, -o           Output directory to store generated definition files
                                                             [string] [required]
  --default-success-type  Default type for success responses (experimental,
                          default: 'undefined')  [string] [default: "undefined"]
  --default-error-type    Default type for error responses (experimental,
                          default: 'undefined')  [string] [default: "undefined"]
  --camel-cased           Generate camelCased properties name (default: false)
                                                                [default: false]

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

## Known issues, tradeoffs and throubleshooting
### A model file for a definition is not generated
When using `gen-api-models` against a specification file which references an external definition file, some of such remote definitions do not result in a dedicated model file. This is somehow intended and the rationale is explained [here](https://github.com/pagopa/io-utils/pull/197). Quick takeaway is that to have a definition to result in a model file, it must be explicitly referenced by the specification file.


## Migration from old versions
Generated code is slightly different from `v4` as it implements some bug fixes that result in breaking changes. Here's a list of what to be aware of:
#### from 4.3.0 to 5.x
* On request type definitions, parameters are named after the `name` field in the spec. This applies to both local and global parameters. In the previous version, this used to be true only for local ones, while global parameters were named after the parameter's definition name. 
* The above rule doesn't apply to headers: in case of a security definition or a global parameter which has `in: header`, the definition name is considered, as the `name` attribute refers to the actual header name to be used as for OpenApi specification.
* Generated decoders now support multiple success codes (i.e. 200 and 202), so we don't need to write custom decoders for such case as [we used to do](https://github.com/pagopa/io-backend/compare/174376802-experiment-with-sdk?expand=1#diff-cf7a83babfaf6e5babe84dffe22f64e4L81). 
* When using `gen-api-models` command, `--request-types` flag must be used explicitly in order to have `requestTypes` file generated.
#### from 4.0.0 to 4.3.0
* Attributes with `type: string` and `format: date` used to result in a `String` definition, while now produce `Date`. [#184](https://github.com/pagopa/io-utils/pull/184)
* Allow camel-cased prop names. [#183](https://github.com/pagopa/io-utils/pull/183)
* Numeric attributes with maximum value now produce a `WithinRangeInteger` which maximum is the next integer to solve off-by-one comparison error. [#182](https://github.com/pagopa/io-utils/pull/182)

# IO-UTILS E2E TEST SUITE
In this folder is defined a barebone project used to test `gen-api-models`' generated files in real-world scenarios. 

## Usage

```sh
$ yarn install --frozen-lockfile
$ yarn start
$ yarn start --verbose # for a detailed list of executed test cases
```

Please be sure that the `italia-utils` module has been compiled first.

## How it works

This project installs `italia-utils` and try to reproduce user interactions with the module. It ships several OpenApi specifications and for each it performs the relative code generation. At each specification is associated a name and a set of test suites that load generated modules and execute them in their intended scenarios. In order to test generated http clients, a http server for each specification is instantiated, serving a mock representation of the intendend api.

## Global configuration

The `src/config.ts` file contains global values shared over all the suites. 

#### config object
| name | description
|-|-|
| `generatedFilesBaseDir` | directory in which generated files are saved
| `skipClient` |  if true, test suites regarding generated clients are skipped and mock servers aren't executed. Default: `false`
| `skipGeneration` |  if true, files aren't generated before test suites are executed. Files already in `generatedFilesBaseDir` are considered. Default: `false`
| `specs` | key-value set of OpenApi specification to test. Pairs are in the form _(specName, specInfo)_. See below for _specInfo_ documentation.

#### specInfo object
| name | description
|-|-|
|`generatedFilesDir`| directory in which generated files for this specification are stored. Is subdirectory of `generatedFilesBaseDir` |
|`isEnabled`| wheater test suites for this specification have to be executed or not. Default: `true`
|`mockPort`| port the mock server exposing this specification is listening at |
|`url`| path of the OpenApi spcification, being local or remote |



## Env Variables

For development purpose, it might be useful to avoid some steps and have a quicker response. The following environment variables may assist:

| name | type | default | descriptions |
|-|-|-|-|
| SKIP_CLIENT | boolean| false | Skip tests on generated http clients. This mean no mock server has to be run
| SKIP_GENERATION| boolean | false | Skip file generation
| INCLUDE_SPECS| string | ∅ | Comma-separated list of specification names on which execute tests. Specification names are the ones included in `config.specs` configuration object. Empty means all. 



# IO-UTILS E2E TEST SUITE
In this folder is defined a barebone project used to test `gen-api-models`' generated files in real-world scenarios. 

## Usage

```sh
$ yarn install --frozen-lockfile
$ yarn start
$ yarn start --verbose # for a detailed list of executed test cases
```

Please be sure that the `italia-utils` module has been compiled first. Otherwise you can use the `run.sh` script that does everything for you.

```sh
$ cd .. # io-utils source root
$ ./run.sh
```

or you can specify source root as a parameter

```sh
$ ./run.sh /path/to/source
```

## Env Variables

For development purpose, it might be useful to avoid some steps and have a quicker response. The following environment variables may assist:

| name | type | default | descriptions |
|-|-|-|-|
| SKIP_CLIENT | boolean| false | Skip tests on client. This mean no mock server has to be run
| SKIP_GENERATION| boolean | false | Skip tests on client. This mean no mock server has to be run
| INCLUDE_SPECS| string | ∅ | Comma-separated list of specifications on which execute tests. Empty means all. 



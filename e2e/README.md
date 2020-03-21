# IO-UTILS E2E TEST SUITE
In this folder is defined a barebone project used to test `gen-api-models`' generated files in real-world scenarios. 

## Usage
The entrypoint is the `run.sh` script which does the following:
1. Compiles the `gen-api-models` program from source
2. Execute `gen-api-models` against a test api specification
3. Run tests against generated files

### Examples

```sh
$ cd .. # io-utils source root
$ ./run.sh
```

or you can specify source root as a parameter

```sh
$ ./run.sh /path/to/source
```

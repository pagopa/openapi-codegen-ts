# IO-UTILS E2E TEST SUITE
In this folder is defined a barebone project used to test `gen-api-models`' generated files in real-world scenarios. 

## Usage

```sh
$ yarn install --frozen-lockfile
$ yarn start
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

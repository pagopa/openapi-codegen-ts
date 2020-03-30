#!/bin/bash
set -e

SOURCE_ROOT=${1:-$(pwd)}
E2E_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )";

# compile generator 
cd "$SOURCE_ROOT"
yarn build

# execute e2e suite
cd "$E2E_ROOT"
yarn install --frozen-lockfile
yarn start
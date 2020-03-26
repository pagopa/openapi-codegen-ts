#!/bin/bash
set -e

SOURCE_ROOT=${1:-$(pwd)}
DIST_ROOT="$SOURCE_ROOT/dist"
E2E_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )";
OUTPUT_DIR="$E2E_ROOT/generated/test-api"
E2E_TEST_API_SPEC="$E2E_ROOT/api.yaml"

# compile generator 
cd "$SOURCE_ROOT"
yarn build

# generate files from api spec
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
node "$DIST_ROOT/index.js" --api-spec "$E2E_TEST_API_SPEC" --out-dir "$OUTPUT_DIR" --client

# execute e2e suite
cd "$E2E_ROOT"
yarn install --frozen-lockfile
yarn test
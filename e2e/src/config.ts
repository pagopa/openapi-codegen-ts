const ROOT_DIRECTORY_FOR_E2E = `${process.cwd()}`;
const GENERATED_BASE_DIR = `${ROOT_DIRECTORY_FOR_E2E}/src/generated`;

/**
 * parse a string value into a boolean
 *
 * @param v string value to be parsed
 *
 * @returns true or false
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const truthy = (v: string | undefined) =>
  v === "true" || v === "TRUE" || v === "1";

/**
 *
 * @param list a comma-separated list. Can be undefined or empty
 * @param item an item to find
 * @param defaultIfUndefined wheater a search on an undefined/empty list is to be considered as a successful search
 *
 * @returns true of false wheater list include item
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const includeInList = (
  list: string | undefined,
  item: string,
  defaultIfUndefined: boolean = true
) => (list ? list.split(",").includes(item) : defaultIfUndefined);

export default {
  generatedFilesBaseDir: GENERATED_BASE_DIR,
  skipClient: truthy(process.env.SKIP_CLIENT),
  skipGeneration: truthy(process.env.SKIP_GENERATION),
  specs: {
    be: {
      generatedFilesDir: `${GENERATED_BASE_DIR}/be`,
      isSpecEnabled: includeInList(process.env.INCLUDE_SPECS, "be"),
      mockPort: 4102,
      url: `${ROOT_DIRECTORY_FOR_E2E}/../__mocks__/be.yaml`
    },
    testapi: {
      generatedFilesDir: `${GENERATED_BASE_DIR}/testapi`,
      isSpecEnabled: includeInList(process.env.INCLUDE_SPECS, "testapi"),
      mockPort: 4101,
      url: `${ROOT_DIRECTORY_FOR_E2E}/../__mocks__/api.yaml`
    },
    testapiV3: {
      generatedFilesDir: `${GENERATED_BASE_DIR}/testapiV3`,
      isSpecEnabled: includeInList(process.env.INCLUDE_SPECS, "testapiV3"),
      mockPort: 4103,
      url: `${ROOT_DIRECTORY_FOR_E2E}/../__mocks__/openapi_v3/api.yaml`
    },
    testapiWithDefaults: {
      generatedFilesDir: `${GENERATED_BASE_DIR}/testapiWithDefaults`,
      isSpecEnabled: includeInList(
        process.env.INCLUDE_SPECS,
        "testapiWithDefaults"
      ),
      mockPort: 4104,
      url: `${ROOT_DIRECTORY_FOR_E2E}/../__mocks__/api_test_defaults.yaml`
    }
  }
};

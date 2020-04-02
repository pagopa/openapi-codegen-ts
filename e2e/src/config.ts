const ROOT = `${process.cwd()}`;
const GENERATED_BASE_DIR = `${ROOT}/src/generated`;

const truthy = (v: string | undefined) =>
  v === "true" || v === "TRUE" || v === "1";
const include = (
  list: string | undefined,
  item: string,
  defaultIfUndefined: boolean = true
) => (list ? list.split(",").includes(item) : defaultIfUndefined);
export default {
  generatedFilesBaseDir: GENERATED_BASE_DIR,
  skipClient: truthy(process.env.SKIP_CLIENT),
  skipGeneration: truthy(process.env.SKIP_GENERATION),
  specs: {
    testapi: {
      enabled: include(process.env.INCLUDE_SPECS, "testapi"),
      generatedFilesDir: `${GENERATED_BASE_DIR}/testapi`,
      mockPort: 4101,
      url: `${ROOT}/api.yaml`
    }
  }
};

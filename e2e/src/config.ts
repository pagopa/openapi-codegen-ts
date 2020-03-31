const ROOT = `${process.cwd()}`;
const GENERATED_BASE_DIR = `${ROOT}/generated`;
export default {
  generatedFilesBaseDir: GENERATED_BASE_DIR,
  specs: {
    testapi: {
      url: `${ROOT}/api.yaml`,
      mockPort: 4101,
      generatedFilesDir: `${GENERATED_BASE_DIR}/testapi`
    }
  }
};

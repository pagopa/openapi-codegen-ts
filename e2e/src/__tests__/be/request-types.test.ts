import * as t from "io-ts";
import config from "../../config";

const mockResponse = (status: number, body?: any, headers?: any) => ({
  status,
  json: async () => body,
  headers
});

const { generatedFilesDir, isSpecEnabled } = config.specs.be;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = isSpecEnabled ? describe : describe.skip;

describeSuite("Request types generated from BE API spec", () => {
  const loadModule = () =>
    import(`${generatedFilesDir}/requestTypes.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${generatedFilesDir}/requestTypes.ts`);
      }
      return mod;
    });

  it("should just pass", () => {
    expect(1).toBe(1);
  });
});

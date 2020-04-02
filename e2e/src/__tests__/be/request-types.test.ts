import * as t from "io-ts";
import config from "../../config";

const mockResponse = (status: number, body?: any, headers?: any) => ({
  status,
  json: async () => body,
  headers
});

const { generatedFilesDir, enabled } = config.specs.be;

const describeSuite = enabled ? describe : describe.skip;

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

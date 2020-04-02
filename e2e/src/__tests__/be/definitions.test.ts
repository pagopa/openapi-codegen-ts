import config from "../../config";

const { generatedFilesDir, enabled } = config.specs.be;

const describeSuite = enabled ? describe : describe.skip;

describeSuite("Decoders generated from BE API spec defintions", () => {
  const loadModule = (name: string) =>
    import(`${generatedFilesDir}/${name}.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${generatedFilesDir}/${name}.ts`);
      }
      return mod;
    });
});

describe("Http client generated from Test API spec", () => {
  const MODULE_PATH = process.env.OUTPUT_DIR;
  const loadModule = () =>
    import(`${MODULE_PATH}/client.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${MODULE_PATH}/client.ts`);
      }
      return mod;
    });

  it("should be a valid module", async () => {
    const { Client } = await loadModule();

    expect(Client).toBeDefined();
    expect(Client).toEqual(expect.any(Function));
  });
});

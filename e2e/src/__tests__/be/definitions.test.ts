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

  describe("ServicePublic definition", () => {
    it("should expose ServicePublic decoder", async () => {
      const { ServicePublic } = await loadModule("ServicePublic");
      expect(ServicePublic).toBeDefined();
    });

    [
      ["empty", "", false],
      ["non-object", "INVALID", false],
      [
        "invalid fiscal code",
        {
          service_id: "sid1234",
          service_name: "my service",
          organization_name: "my org",
          department_name: "my dep",
          organization_fiscal_code: "invalid",
          version: 123
        },
        false
      ],
      [
        "valid service",
        {
          service_id: "sid1234",
          service_name: "my service",
          organization_name: "my org",
          department_name: "my dep",
          organization_fiscal_code: "12345678901",
          version: 123
        },
        true
      ]
    ].forEach(([name, example, expected], i) => {
      const title = expected
        ? `should decode example case ${i + 1}: ${name}`
        : `should fail decoding example case ${i + 1}: ${name}`;
      it(title, async () => {
        const { ServicePublic } = await loadModule("ServicePublic");
        const result = ServicePublic.decode(example).isRight();
        expect(result).toEqual(expected);
      });
    });
  });
});

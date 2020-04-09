import config from "../../config";

const { generatedFilesDir, enabled } = config.specs.be;

const describeSuite = enabled ? describe : describe.skip;

describeSuite("Decoders generated from BE API spec defintions", () => {
  const loadModule = (name: string) =>
    import(`${generatedFilesDir}/${name}.ts`).then((mod) => {
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

    const validService = {
      service_id: "sid1234",
      service_name: "my service",
      organization_name: "my org",
      department_name: "my dep",
      organization_fiscal_code: "12345678901",
      version: 123,
    };
    const withInvalidFiscalCode = {
      service_id: "sid1234",
      service_name: "my service",
      organization_name: "my org",
      department_name: "my dep",
      organization_fiscal_code: "invalid",
      version: 123,
    };

    it.each`
      title                                     | example                  | expectedRight
      ${"should fail decoding empty"}           | ${undefined}             | ${false}
      ${"should fail decoding non-object"}      | ${"INVALID"}             | ${false}
      ${"should fail decoding invalid service"} | ${withInvalidFiscalCode} | ${false}
      ${"should decode valid service"}          | ${validService}          | ${true}
    `("$title", async ({ example, expectedRight }) => {
      const { ServicePublic } = await loadModule("ServicePublic");
      const result = ServicePublic.decode(example).isRight();
      expect(result).toEqual(expectedRight);
    });
  });
});

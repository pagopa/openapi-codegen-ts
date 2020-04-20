import config from "../../config";

const { generatedFilesDir, isSpecEnabled } = config.specs.be;

// if there's no need for this suite in this particular run, just skip it
const describeSuite = isSpecEnabled ? describe : describe.skip;

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

    const validService = {
      service_id: "sid1234",
      service_name: "my service",
      organization_name: "my org",
      department_name: "my dep",
      organization_fiscal_code: "12345678901",
      version: 123
    };
    const withInvalidFiscalCode = {
      service_id: "sid1234",
      service_name: "my service",
      organization_name: "my org",
      department_name: "my dep",
      organization_fiscal_code: "invalid",
      version: 123
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

  describe("PaginatedServiceTupleCollection definition", () => {
    it("should expose PaginatedServiceTupleCollection decoder", async () => {
      const { PaginatedServiceTupleCollection } = await loadModule(
        "PaginatedServiceTupleCollection"
      );
      expect(PaginatedServiceTupleCollection).toBeDefined();
    });

    const paginatedServices = {
      items: [{ service_id: "foo123", version: 789 }],
      next: "http://example.com/next",
      page_size: 1
    };

    it.each`
      title                                           | example              | expectedRight
      ${"should fail decoding empty"}                 | ${undefined}         | ${false}
      ${"should fail decoding non-object"}            | ${"INVALID"}         | ${false}
      ${"should decode valid paginated service list"} | ${paginatedServices} | ${true}
    `("$title", async ({ example, expectedRight }) => {
      const { PaginatedServiceTupleCollection } = await loadModule(
        "PaginatedServiceTupleCollection"
      );
      const result = PaginatedServiceTupleCollection.decode(example).isRight();
      expect(result).toEqual(expectedRight);
    });
  });
});

describe("Decoders generated from Test API spec defintions", () => {
  const MODULE_PATH = `${__dirname}/../../../generated`;
  const loadModule = (name: string) =>
    import(`${MODULE_PATH}/${name}.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${MODULE_PATH}/${name}.ts`);
      }
      return mod;
    });

  describe("FiscalCode definition", () => {
    it("should expose FiscalCode decoder", async () => {
      const { FiscalCode } = await loadModule("FiscalCode");
      expect(FiscalCode).toBeDefined();
    });

    test.each`
      title                                | example               | expected
      ${"should fail decoding empty"}      | ${""}                 | ${false}
      ${"should decode valid cf"}          | ${"RSSMRA80A01F205X"} | ${true}
      ${"should fail decoding invalid cf"} | ${"INVALIDCFFORMAT"}  | ${false}
    `("$title", async ({ example, expected }) => {
      const { FiscalCode } = await loadModule("FiscalCode");
      const result = FiscalCode.decode(example).isRight();
      expect(result).toEqual(expected);
    });
  });

  describe("Profile defintion", () => {
    it("should expose Profile decoder", async () => {
      const { Profile } = await loadModule("Profile");
      expect(Profile).toBeDefined();
    });

    const basicProfile = {
      family_name: "Rossi",
      fiscal_code: "RSSMRA80A01F205X",
      has_profile: true,
      is_email_set: false,
      name: "Mario",
      version: 123
    };
    const completeProfile = {
      family_name: "Rossi",
      fiscal_code: "RSSMRA80A01F205X",
      has_profile: true,
      is_email_set: false,
      name: "Mario",
      version: 123,
      email: "fake@email.com"
    };
    const profileWithPayload = {
      family_name: "Rossi",
      fiscal_code: "RSSMRA80A01F205X",
      has_profile: true,
      is_email_set: false,
      name: "Mario",
      version: 123,
      payload: { foo: "bar" }
    };

    test.each`
      title                                   | example               | expected
      ${"should fail decoding empty"}         | ${""}                 | ${false}
      ${"should fail decoding non-object"}    | ${"value"}            | ${false}
      ${"should decode basic profile"}        | ${basicProfile}       | ${true}
      ${"should decode complete profile"}     | ${completeProfile}    | ${true}
      ${"should decode profile with payload"} | ${profileWithPayload} | ${true}
    `("$title", async ({ example, expected }) => {
      const { Profile } = await loadModule("Profile");
      const result = Profile.decode(example).isRight();
      expect(result).toEqual(expected);
    });
  });
});

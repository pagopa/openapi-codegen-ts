describe("Decoders generated from Test API spec defintions", () => {
  const MODULE_PATH = `${process.cwd()}/generated/test-api`;
  const loadModule = (name: string) =>
    import(`${MODULE_PATH}/${name}.ts`).then(mod => {
      if (!mod) {
        fail(`Cannot load module ${MODULE_PATH}/${name}.ts`);
      }
      return mod;
    });

  describe("FiscalCode defintion", () => {
    it("should expose FiscalCode decoder", async () => {
      const { FiscalCode } = await loadModule("FiscalCode");
      expect(FiscalCode).toBeDefined();
    });

    [
      ["empty", "", false],
      ["valid cf", "RSSMRA80A01F205X", true],
      ["invalid cf", "INVALIDCFFORMAT", false]
    ].forEach(([name, example, expected], i) => {
      const title = expected
        ? `should decode example case ${i + 1}: ${name}`
        : `should fail decoding example case ${i + 1}: ${name}`;
      it(title, async () => {
        const { FiscalCode } = await loadModule("FiscalCode");
        const result = FiscalCode.decode(example).isRight();
        expect(result).toEqual(expected);
      });
    });
  });

  describe("Profile defintion", () => {
    it("should expose Profile decoder", async () => {
      const { Profile } = await loadModule("Profile");
      expect(Profile).toBeDefined();
    });

    [
      ["empty", {}, false],
      ["non-object", "value", false],
      [
        "basic profile",
        {
          family_name: "Rossi",
          fiscal_code: "RSSMRA80A01F205X",
          has_profile: true,
          is_email_set: false,
          name: "Mario",
          version: 123
        },
        true
      ],
      [
        "complete profile",
        {
          family_name: "Rossi",
          fiscal_code: "RSSMRA80A01F205X",
          has_profile: true,
          is_email_set: false,
          name: "Mario",
          version: 123,
          email: "fake@email.com"
        },
        true
      ],
      [
        "with payload",
        {
          family_name: "Rossi",
          fiscal_code: "RSSMRA80A01F205X",
          has_profile: true,
          is_email_set: false,
          name: "Mario",
          version: 123,
          payload: { foo: "bar" }
        },
        true
      ]
    ].forEach(([name, example, expected], i) => {
      const title = expected
        ? `should decode example case ${i + 1}: ${name}`
        : `should fail decoding example case ${i + 1}: ${name}`;
      it(title, async () => {
        const { Profile } = await loadModule("Profile");
        const result = Profile.decode(example).isRight();
        expect(result).toEqual(expected);
      });
    });
  });
});

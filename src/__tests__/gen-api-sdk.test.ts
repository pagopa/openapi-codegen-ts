import { renderAll } from "../commands/gen-api-sdk/index";

describe("gen-api-skd", () => {
  it("should render multiple templates", async () => {
    const result = await renderAll(["tsconfig.json.njk", "index.ts.njk"], {});

    expect(result).toEqual({
      "tsconfig.json.njk": expect.any(String),
      "index.ts.njk": expect.any(String)
    });
  });
});

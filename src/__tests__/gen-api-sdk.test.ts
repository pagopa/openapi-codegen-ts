import { renderAll } from "../commands/gen-api-sdk/index";
import {
  IGeneratorParams,
  IPackageAttributes
} from "../commands/gen-api-sdk/types";

describe("gen-api-skd", () => {
  it("should render multiple templates", async () => {
    const result = await renderAll(
      ["tsconfig.json.njk", "index.ts.njk"],
      {} as IPackageAttributes & IGeneratorParams
    );

    expect(result).toEqual({
      "tsconfig.json.njk": expect.any(String),
      "index.ts.njk": expect.any(String)
    });
  });
});

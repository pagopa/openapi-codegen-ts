import * as SwaggerParser from "swagger-parser";

test("Validate Schema OpenApi 3.0 ", () => {
  let flag = false;
  SwaggerParser.validate(`${__dirname}/api_oa3.yaml`, (err, api) => {
    if (err) {
      console.error(err);
    } else {
      flag = true;
      console.log(
        "API name: %s, Version: %s",
        api.info.title,
        api.info.version
      );
    }
  });
  expect(flag).toBe(true);
});

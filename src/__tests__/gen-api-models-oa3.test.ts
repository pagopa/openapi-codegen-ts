import * as SwaggerParser from "swagger-parser";

test("Validate Schema OpenApi 3.0 ", () => {
  SwaggerParser.validate(`${__dirname}/api_oa3.yaml`, (err, api) => {
    if (err) {
      console.error(err);
    } else {
      console.log(
        "API name: %s, Version: %s",
        api.info.title,
        api.info.version
      );
    }
    expect(err).toBeNull();
  });
});

test("Fail invalid OpenApi schema", () => {
  SwaggerParser.validate(`${__dirname}/api_oa3_invalid.yaml`, (err, api) => {
    if (err) {
      console.log(err);
    } else {
      console.error(
        "API name: %s, Version: %s",
        api.info.title,
        api.info.version
      );
    }
    expect(err).not.toBeNull();
  });
});
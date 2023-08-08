import {getParser} from "./utils/parser.utils";
import {renderDefinitionCode} from "../render";
import * as SwaggerParser from "swagger-parser";
import {OpenAPIV3} from "openapi-types";
import * as fs from "fs";

it("should render a client", async () => {
    let specPath = `${process.cwd()}/__mocks__/openapi_v3/__tmp_oneOf.yaml`;

    let spec = (await SwaggerParser.bundle(specPath)) as
        | OpenAPIV3.Document;

    const allOperations = getParser(spec).parseDefinition(
        // @ts-ignore
        spec.components.schemas["DubidubiduResponse"]
    );

    const code = await renderDefinitionCode("DubidubiduResponse", allOperations, true);
});
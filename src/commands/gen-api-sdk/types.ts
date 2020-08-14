import { OpenAPIV2 } from "openapi-types";

export interface IGenerateSdkOptions {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  registry?: string;
  access?: string;
  specFilePath: string | OpenAPIV2.Document;
  outPath: string;
  strictInterfaces?: boolean;
  defaultSuccessType?: string;
  defaultErrorType?: string;
  camelCasedPropNames: boolean;
}

import { OpenAPIV2 } from "openapi-types";

export interface IRegistryAttributes {
  registry?: string;
  access?: string;
}

export interface IGeneratorParams {
  specFilePath: string | OpenAPIV2.Document;
  outPath: string;
  strictInterfaces?: boolean;
  defaultSuccessType?: string;
  defaultErrorType?: string;
  camelCasedPropNames: boolean;
}

export interface IPackageAttributes {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
}

export type IGenerateSdkOptions = IGeneratorParams &
  IRegistryAttributes &
  (
    | ({
        inferAttr: false;
      } & IPackageAttributes)
    | ({
        inferAttr: true;
      } & Partial<IPackageAttributes>)
  );

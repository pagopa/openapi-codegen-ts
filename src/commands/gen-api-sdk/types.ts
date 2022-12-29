import { OpenAPIV2 } from "openapi-types";

export interface IRegistryAttributes {
  readonly registry?: string;
  readonly access?: string;
}

export interface IGeneratorParams {
  readonly specFilePath: string | OpenAPIV2.Document;
  readonly outPath: string;
  readonly defaultSuccessType?: string;
  readonly defaultErrorType?: string;
  readonly camelCasedPropNames: boolean;
}

export interface IPackageAttributes {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
}

export type IGenerateSdkOptions = IGeneratorParams &
  IRegistryAttributes &
  (
    | ({
        readonly inferAttr: false;
      } & IPackageAttributes)
    | ({
        readonly inferAttr: true;
      } & Partial<IPackageAttributes>)
  );

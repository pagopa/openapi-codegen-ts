# Utilities and tools for the Digital Citizenship initiative

This package provide some tools that are used across the projects of the
Digital Citizenship initiative.

To add the tools to a project:

```
$ yarn add -D italia-utils
```

## gen-api-models

This tool generates TypeScript definitions of OpenAPI specs.

Example:

```
$ gen-api-models --api-spec ./api/public_api_v1.yaml --out-dir ./lib/api/definitions --ts-spec-file ./lib/api/public_api_v1.ts
Writing TS Specs to lib/api/public_api_v1.ts
ProblemJson -> lib/api/definitions/ProblemJson.ts
NotificationChannel -> lib/api/definitions/NotificationChannel.ts
NotificationChannelStatusValue -> lib/api/definitions/NotificationChannelStatusValue.ts
...
done
```

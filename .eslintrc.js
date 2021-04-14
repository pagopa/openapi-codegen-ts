module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "ignorePatterns": [
        "node_modules",
        "generated",
        "**/__tests__/*",
        "**/__mocks__/*",
        "Dangerfile.*",
        "*.d.ts"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": ".eslint.project.json",
        "sourceType": "module"
    },
    "extends": [
        "@pagopa/eslint-config/strong",
    ],
    "rules": {
        "jsdoc/check-indentation": "off"
    }
}

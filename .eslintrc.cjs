module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "tsdoc"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:tsdoc/recommended",
        "prettier",
    ],
    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/consistent-type-imports": "error",
    },
    ignorePatterns: ["dist", "node_modules"],
}; 

module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-standard-scss"],
  rules: {
    "color-function-notation": "modern",
    "selector-class-pattern": null
  },
  ignoreFiles: ["**/dist/**", "**/node_modules/**"]
};

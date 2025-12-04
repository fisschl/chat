import withNuxt from "./.nuxt/eslint.config.mjs";
import prettier from "eslint-plugin-prettier/recommended";
import oxlint from "eslint-plugin-oxlint";
import { globalIgnores } from "eslint/config";

export default withNuxt(
  prettier,
  ...oxlint.configs["flat/recommended"],
  globalIgnores(["**/generated/**", "**/assets/**", "**/*.js", "**/*.mjs", "**/*.d.ts"]),
);

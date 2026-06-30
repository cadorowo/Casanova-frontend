import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**",
      "components/casino-game/assets/**",
      "components/casino-game/common/**",
      "components/casino-game/index.tsx",
      "components/casino-game/Game.ts",
      "components/casino-game/responsiveModule.ts",
    ],
  },
];

export default eslintConfig;

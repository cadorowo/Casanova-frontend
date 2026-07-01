import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "components/casino-game/assets/**",
      "components/casino-game/common/**",
      "components/casino-game/index.tsx",
      "components/casino-game/Game.ts",
      "components/casino-game/responsiveModule.ts",
      "public/js/**"
    ]
  }
];

export default eslintConfig;

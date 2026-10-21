import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "tmp/**", "data/**", "public/**", "next-env.d.ts", "app.js"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;

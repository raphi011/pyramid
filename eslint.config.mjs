import nextConfig from "eslint-config-next";

const config = [
  { ignores: ["storybook-static/"] },
  ...nextConfig,
];

export default config;

import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Disable new stricter rules from react-hooks 7.x to maintain compatibility
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
    },
  },
]

export default eslintConfig

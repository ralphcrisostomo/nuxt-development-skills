import { defineConfig } from "terraform-scaffold";

export default defineConfig({
  functionPrefix: "{{FUNCTION_PREFIX}}",
  environments: ["staging", "production"],
  awsProfile: "{{AWS_PROFILE}}",
  paths: {
    servicesDir: "services",
    utilsDir: "utils",
  },
});

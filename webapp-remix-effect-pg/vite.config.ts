import { vitePlugin } from "@remix-run/dev";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    babel({
      filter: new RegExp(/\.tsx?$/),
    }),
    tsconfigPaths(),
    vitePlugin(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    }),
  ],
  build: {
    outDir: "build",
    copyPublicDir: false,
    minify: "terser",
    sourcemap: true,
  },
  publicDir: "./public",
});

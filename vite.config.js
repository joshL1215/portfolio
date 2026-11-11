import { defineConfig } from "vite";

// "./" makes every built path relative, so the site works both at
// joshl1215.github.io/portfolio/ and on a custom domain later.
export default defineConfig({
  base: "./",
});

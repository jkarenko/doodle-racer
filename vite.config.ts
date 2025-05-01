import {defineConfig} from "vite";
import {resolve} from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@scenes": resolve(__dirname, "src/scenes"),
      "@systems": resolve(__dirname, "src/systems"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});

import {defineConfig} from "vite";
import {resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/doodle-racer/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@scenes": resolve(__dirname, "src/scenes"),
      "@systems": resolve(__dirname, "src/systems"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
});

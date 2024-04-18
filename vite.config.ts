import path from "path";
import { defineConfig } from "vite";

export default defineConfig((opt) => {
  return {
    root: "src",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      // watch: {
      //   include: [
      //     "style.css",
      //     "options/*",
      //     "scripts/*",
      //     "images/*",
      //     "add_schedule/*",
      //   ],
      // },
      rollupOptions: {
        input: {
          content: path.resolve(__dirname, "src/content.ts"),
          add_schedule: path.resolve(
            __dirname,
            "src/add_schedule/add_schedule.html"
          ),
          options: path.resolve(__dirname, "src/options/options.html"),
        },
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
    // assetsInclude: ["src/images/*"],
    // esbuild: {
    //   include: ["scripts/*", "add_schedule/*", "options/*"],
    // },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
      watch: {
        usePolling: true,
      },
    },
  };
});

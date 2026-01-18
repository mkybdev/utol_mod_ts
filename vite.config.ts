import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
	return {
		root: "src",
		build: {
			outDir: "../dist",
			emptyOutDir: true,
			rollupOptions: {
				input: {
					content: path.resolve(__dirname, "src/content.ts"),
					popup: path.resolve(__dirname, "src/popup/popup.html"),
				},
				output: {
					entryFileNames: "[name].js",
				},
			},
		},
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

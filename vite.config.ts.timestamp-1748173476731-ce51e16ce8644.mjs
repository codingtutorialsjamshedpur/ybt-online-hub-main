// vite.config.ts
import { defineConfig } from "file:///C:/Users/shour/Desktop/ALL%20WEB%20FOLDERS/New%20folder/ybt-online-hub-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/shour/Desktop/ALL%20WEB%20FOLDERS/New%20folder/ybt-online-hub-main/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/shour/Desktop/ALL%20WEB%20FOLDERS/New%20folder/ybt-online-hub-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\shour\\Desktop\\ALL WEB FOLDERS\\New folder\\ybt-online-hub-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  // Base path set to '/' for production builds
  base: "/",
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Ensure proper asset handling
    assetsDir: "assets",
    // Generate sourcemaps for easier debugging
    sourcemap: mode !== "production",
    // Optimize output for production
    minify: mode === "production"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzaG91clxcXFxEZXNrdG9wXFxcXEFMTCBXRUIgRk9MREVSU1xcXFxOZXcgZm9sZGVyXFxcXHlidC1vbmxpbmUtaHViLW1haW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNob3VyXFxcXERlc2t0b3BcXFxcQUxMIFdFQiBGT0xERVJTXFxcXE5ldyBmb2xkZXJcXFxceWJ0LW9ubGluZS1odWItbWFpblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc2hvdXIvRGVza3RvcC9BTEwlMjBXRUIlMjBGT0xERVJTL05ldyUyMGZvbGRlci95YnQtb25saW5lLWh1Yi1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgfSxcbiAgLy8gQmFzZSBwYXRoIHNldCB0byAnLycgZm9yIHByb2R1Y3Rpb24gYnVpbGRzXG4gIGJhc2U6ICcvJyxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIEVuc3VyZSBwcm9wZXIgYXNzZXQgaGFuZGxpbmdcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIC8vIEdlbmVyYXRlIHNvdXJjZW1hcHMgZm9yIGVhc2llciBkZWJ1Z2dpbmdcbiAgICBzb3VyY2VtYXA6IG1vZGUgIT09ICdwcm9kdWN0aW9uJyxcbiAgICAvLyBPcHRpbWl6ZSBvdXRwdXQgZm9yIHByb2R1Y3Rpb25cbiAgICBtaW5pZnk6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVosU0FBUyxvQkFBb0I7QUFDbGIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQSxFQUVBLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFdBQVc7QUFBQTtBQUFBLElBRVgsV0FBVyxTQUFTO0FBQUE7QUFBQSxJQUVwQixRQUFRLFNBQVM7QUFBQSxFQUNuQjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = process.env;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Explicitly define environment variables to be injected into the frontend
      "process.env.VITE_PUBLIC_SUPABASE_URL": JSON.stringify(env.VITE_PUBLIC_SUPABASE_URL),
      "process.env.VITE_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_PUBLIC_SUPABASE_ANON_KEY),
      "process.env.VITE_BACKEND_API_BASE_URL": JSON.stringify(env.VITE_BACKEND_API_BASE_URL),
      "process.env.VITE_PUBLIC_IP_INFO_TOKEN": JSON.stringify(env.VITE_PUBLIC_IP_INFO_TOKEN),
      "process.env.VITE_RAZORPAY_KEY_ID": JSON.stringify(env.VITE_RAZORPAY_KEY_ID),
    },
  };
});

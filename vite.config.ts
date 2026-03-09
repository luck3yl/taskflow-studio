import { defineConfig, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage, ServerResponse } from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // OnlyOffice 回调处理插件（demo 用，实现文件保存逻辑）
    {
      name: "onlyoffice-callback",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/onlyoffice/callback", async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === "POST") {
            const urlObj = new URL(req.url || "", `http://${req.headers.host}`);
            const filename = urlObj.searchParams.get("filename");

            let body = "";
            req.on("data", (chunk: string) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                console.log("[OnlyOffice Callback] Status:", data.status, "File:", filename);

                // status 2 = ready for saving 
                // status 6 = force save (e.g., clicking save button)
                if ((data.status === 2 || data.status === 6) && filename && data.url) {
                  const fs = await import("fs");
                  const https = await import("https");
                  const http = await import("http");
                  const path = await import("path");

                  const savePath = path.resolve(__dirname, "public/data", filename);
                  console.log("[OnlyOffice Saving] Downloading from:", data.url, "To:", savePath);

                  const client = data.url.startsWith("https") ? https : http;

                  client.get(data.url, (fileRes) => {
                    const fileStream = fs.createWriteStream(savePath);
                    fileRes.pipe(fileStream);
                    fileStream.on("finish", () => {
                      fileStream.close();
                      console.log("[OnlyOffice Saved] Successfully saved:", filename);
                    });
                  }).on("error", (err) => {
                    console.error("[OnlyOffice Save Error]", err.message);
                  });
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: 0 }));
              } catch (e) {
                console.error("[OnlyOffice Callback Error]", e);
                res.writeHead(500);
                res.end();
              }
            });
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: 0 }));
          }
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

// Minimal static server for the built SPA (dist/) — no dependencies.
// Used by the OpenShip deployment:  startCommand = "node server.cjs"
// Serves dist/ with SPA fallback so client-side routes (/vectorvault, /auth, ...) work.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT) || 3151;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".pdf": "application/pdf",
};

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }

    let filePath = path.normalize(path.join(ROOT, pathname));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(ROOT, "index.html"); // SPA fallback
    }

    const isHtml = filePath.endsWith("index.html");
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
    });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Veritas SynapseCore serving dist/ on 0.0.0.0:${PORT}`);
  });

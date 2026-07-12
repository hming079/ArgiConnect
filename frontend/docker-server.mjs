import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { Readable } from "node:stream";
import worker from "./dist/server/server.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 5173);
const publicDir = join(process.cwd(), "dist", "client");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function serveStatic(pathname, response) {
  const filePath = normalize(join(publicDir, decodeURIComponent(pathname)));
  if (relative(publicDir, filePath).startsWith("..")) return false;

  try {
    const file = await stat(filePath);
    if (!file.isFile()) return false;
    response.writeHead(200, {
      "cache-control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0",
      "content-length": file.size,
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "EISDIR") return false;
    throw error;
  }
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if ((request.method === "GET" || request.method === "HEAD") && await serveStatic(url.pathname, response)) {
      return;
    }

    const body = request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Readable.toWeb(request);
    const fetchRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body,
      duplex: body ? "half" : undefined,
    });
    const fetchResponse = await worker.fetch(fetchRequest, process.env, {});
    const headers = Object.fromEntries(fetchResponse.headers);
    const cookies = fetchResponse.headers.getSetCookie?.();
    if (cookies?.length) headers["set-cookie"] = cookies;
    response.writeHead(fetchResponse.status, headers);

    if (fetchResponse.body) Readable.fromWeb(fetchResponse.body).pipe(response);
    else response.end();
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  }
}).listen(port, host, () => {
  console.log(`Frontend listening on http://${host}:${port}`);
});

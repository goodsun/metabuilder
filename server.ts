import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      try {
        const html = readFileSync(join(process.cwd(), "index.html"), "utf-8");
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      } catch (error) {
        return new Response("HTML file not found", { status: 404 });
      }
    }

    if (url.pathname === "/test") {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Bun Server Test</h1>
          <p>サーバーが正常に動作しています！</p>
          <p>現在時刻: ${new Date().toLocaleString("ja-JP")}</p>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:3000`);
console.log(`Test page at http://localhost:3000/test`);

/**
 * Plesk / IIS startup file for CounterPuff.
 * In Plesk Node.js settings, set Application Startup File to: server.js
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "127.0.0.1";
const app = next({ dev: process.env.NODE_ENV !== "production", hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, hostname, () => {
      console.log(`CounterPuff listening on ${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start CounterPuff", err);
    process.exit(1);
  });

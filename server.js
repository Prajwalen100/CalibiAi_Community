/**
 * Production entry point for shared-hosting panels (cPanel "Setup Node.js
 * App" / CloudLinux Node.js Selector, Passenger, and similar platforms)
 * that boot a Node app by running a startup file instead of `npm start`.
 *
 * On a VPS you can ignore this file and just run:
 *   npm run build && npm start        (respects the PORT env variable)
 *
 * Set this file as the "Application startup file" in cPanel's Setup
 * Node.js App screen. The platform injects the PORT (or socket) we must
 * listen on, so do not hardcode a port here.
 */
const { createServer } = require("node:http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Error handling request:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, hostname, () => {
      console.log(`> CalibiAI ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js:", err);
    process.exit(1);
  });

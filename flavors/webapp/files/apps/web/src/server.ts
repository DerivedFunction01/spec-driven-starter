import { createServer, type Server } from "node:http";

import type { HealthResponse, ProblemDetails } from "@starter/contract";

// The sample app: one typed server over node:http, no framework
// — the framework choice is the project's (the standards name
// the conventions it must keep). Routes validate before logic
// and answer in the contract's shapes only.
export function createAppServer(): Server {
  return createServer((req, res) => {
    if (req.url === "/health") {
      const body: HealthResponse = { status: "ok", contract: "api/1" };
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }
    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "No such route.",
    };
    res.writeHead(404, { "content-type": "application/problem+json" });
    res.end(JSON.stringify(problem));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8798);
  createAppServer().listen(port, () => {
    console.log(`web app on http://127.0.0.1:${port}`);
  });
}

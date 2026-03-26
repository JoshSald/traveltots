import { toNodeHandler } from "better-auth/node";
import { getAuth } from "./auth.js";
import { getAllowedOrigins } from "./allowed-origins.js";

type ReqLike = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};
type ResLike = {
  status: (code: number) => { json: (body: unknown) => void };
  setHeader?: (name: string, value: string) => void;
  end?: () => void;
};

let nodeHandlerPromise: Promise<ReturnType<typeof toNodeHandler>> | null = null;

async function getNodeHandler() {
  if (!nodeHandlerPromise) {
    nodeHandlerPromise = getAuth().then((auth) => toNodeHandler(auth));
  }

  return nodeHandlerPromise;
}

function getRequestOrigin(req: ReqLike) {
  const origin = req.headers?.origin;
  return Array.isArray(origin) ? origin[0] : origin;
}

function applyCorsHeaders(req: ReqLike, res: ResLike) {
  const setHeader = res.setHeader?.bind(res);
  if (!setHeader) return;

  const origin = getRequestOrigin(req);
  if (!origin) return;

  // In production, only use environment-configured origins
  // In development, allow localhost origins for local testing
  const isDev = process.env.NODE_ENV === "development";

  const baseAllowedOrigins = isDev
    ? new Set([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        ...Array.from(getAllowedOrigins()),
      ])
    : getAllowedOrigins();

  if (!baseAllowedOrigins.has(origin)) return;

  const requestHeaders = req.headers?.["access-control-request-headers"];
  const allowHeaders = Array.isArray(requestHeaders)
    ? requestHeaders.join(",")
    : requestHeaders || "content-type,authorization";

  setHeader("Access-Control-Allow-Origin", origin);
  setHeader("Access-Control-Allow-Credentials", "true");
  setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  setHeader("Access-Control-Allow-Headers", allowHeaders);
  setHeader("Vary", "Origin");
}

export async function runAuthEndpoint(
  req: ReqLike,
  res: ResLike,
  authPath: string,
  errorLabel: string,
) {
  try {
    applyCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
      if (typeof res.status === "function") {
        const statusResult = res.status(204) as any;
        if (statusResult && typeof statusResult.end === "function") {
          return statusResult.end();
        }
      }

      if (typeof res.end === "function") {
        return res.end();
      }

      return res.status(204).json({ ok: true });
    }

    const originalUrl = req.url ?? "";
    const queryIndex = originalUrl.indexOf("?");
    const query = queryIndex >= 0 ? originalUrl.slice(queryIndex) : "";

    (req as any).url = `${authPath}${query}`;
    const handler = await getNodeHandler();
    return handler(req as any, res as any);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: `${errorLabel} failed`,
      detail: error instanceof Error ? error.message : "Unknown error",
      path: req.url,
    });
  }
}

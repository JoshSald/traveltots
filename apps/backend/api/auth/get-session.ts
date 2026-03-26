import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables in serverless environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env.local") });

import { runAuthEndpoint } from "../../src/lib/auth-node-handler.js";

type ReqLike = { method?: string; url?: string };
type ResLike = { status: (code: number) => { json: (body: unknown) => void } };

export default async function getSession(req: ReqLike, res: ResLike) {
  return runAuthEndpoint(
    req,
    res,
    "/api/auth/get-session",
    "Auth get-session endpoint",
  );
}

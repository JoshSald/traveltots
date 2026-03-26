type ReqLike = { method?: string; url?: string };
type ResLike = { status: (code: number) => { json: (body: unknown) => void } };

function hasValue(key: string) {
  return Boolean(process.env[key]);
}

export default function handler(req: ReqLike, res: ResLike) {
  res.status(200).json({
    ok: true,
    message: "Auth route is mounted",
    method: req.method,
    url: req.url,
    env: {
      MONGO_URI: hasValue("MONGO_URI") || hasValue("MONGODB_URI"),
      BETTER_AUTH_URL: hasValue("BETTER_AUTH_URL"),
      BETTER_AUTH_SECRET:
        hasValue("BETTER_AUTH_SECRET") || hasValue("AUTH_SECRET"),
      GOOGLE_CLIENT_ID: hasValue("GOOGLE_CLIENT_ID"),
      GOOGLE_CLIENT_SECRET: hasValue("GOOGLE_CLIENT_SECRET"),
      FRONTEND_URL: hasValue("FRONTEND_URL"),
    },
  });
}

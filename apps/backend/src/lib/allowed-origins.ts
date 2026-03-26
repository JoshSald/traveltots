export function getAllowedOrigins() {
  const configured = [
    process.env.BETTER_AUTH_URL,
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS ?? "").split(",").map((item) => item.trim()),
  ].filter(Boolean) as string[];

  const allowed = new Set<string>();
  for (const value of configured) {
    allowed.add(value);
    try {
      allowed.add(new URL(value).origin);
    } catch {
      // Keep raw values for non-URL inputs.
    }
  }

  return allowed;
}

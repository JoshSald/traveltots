const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
const SERVER_API_BASE_URL = process.env.API_URL?.replace(/\/$/, "") || "";

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  if (typeof window !== "undefined") {
    // In browser, prefer same-origin API routing (works with Vercel dev/prod).
    return normalizedPath;
  }

  if (SERVER_API_BASE_URL) {
    return `${SERVER_API_BASE_URL}${normalizedPath}`;
  }

  return `http://localhost:5050${normalizedPath}`;
}

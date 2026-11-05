export function getRequestIp(headers: Headers) {
  return headers.get("x-real-ip")?.trim()
    ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}
/**
 * URL classification and navigation security helpers.
 *
 * Ensures external web links are safely routed to the system browser via
 * Tauri's opener plugin, prevents untrusted schemes (javascript:, data:, file:)
 * from hijacking the internal WebView, and preserves internal navigation
 * (fragments, relative paths, query strings).
 */

export type UrlClassification =
  | { type: "external"; url: string }
  | { type: "internal"; url: string; isFragment: boolean }
  | { type: "blocked"; reason: string };

const DANGEROUS_SCHEMES = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "blob:",
  "about:",
]);

/**
 * Classifies an href to determine whether it should be opened externally in
 * the system browser, navigated internally, or blocked.
 *
 * @param rawHref The target URL string from markdown or user input.
 * @param baseHref Optional base URL to resolve against (defaults to window.location.href).
 */
export function classifyUrl(
  rawHref: string | null | undefined,
  baseHref?: string,
): UrlClassification {
  if (rawHref == null) {
    return { type: "blocked", reason: "empty" };
  }

  const trimmed = rawHref.trim();
  if (!trimmed) {
    return { type: "blocked", reason: "empty" };
  }

  // 1. In-page fragment anchors: #section, #constraints, #top
  if (trimmed.startsWith("#")) {
    return { type: "internal", url: trimmed, isFragment: true };
  }

  // 2. In-page query strings: ?tab=details
  if (trimmed.startsWith("?")) {
    return { type: "internal", url: trimmed, isFragment: false };
  }

  // 3. Early sanitize check for dangerous schemes (handling obfuscated control chars / spaces)
  const stripped = trimmed.replace(/[\x00-\x1f\s]/g, "").toLowerCase();
  for (const scheme of DANGEROUS_SCHEMES) {
    if (stripped.startsWith(scheme)) {
      return { type: "blocked", reason: `unsafe_scheme:${scheme.slice(0, -1)}` };
    }
  }

  // Determine current application origin for boundary detection
  const base =
    baseHref ||
    (typeof window !== "undefined" && window.location?.href
      ? window.location.href
      : "http://localhost:1420/");

  let appOrigin = "http://localhost:1420";
  try {
    appOrigin = new URL(base).origin;
  } catch {
    // Keep fallback app origin
  }

  // 4. Protocol-relative links: //example.com or //example.com/path
  if (trimmed.startsWith("//")) {
    try {
      // Default to HTTPS for protocol-relative external web links
      const normalized = new URL(`https:${trimmed}`);
      if (normalized.protocol === "https:" || normalized.protocol === "http:") {
        if (normalized.origin === appOrigin) {
          return { type: "internal", url: normalized.href, isFragment: false };
        }
        return { type: "external", url: normalized.href };
      }
      return { type: "blocked", reason: "invalid_protocol_relative" };
    } catch {
      return { type: "blocked", reason: "malformed" };
    }
  }

  // 5. General URL parsing via standard WHATWG URL parser
  let parsed: URL;
  let isAbsolute = false;

  try {
    // Attempt parsing as an absolute URL with scheme
    parsed = new URL(trimmed);
    isAbsolute = true;
  } catch {
    // Relative path (e.g. /jobs, ./readme.md, ../faq): resolve against base
    try {
      parsed = new URL(trimmed, base);
      isAbsolute = false;
    } catch {
      return { type: "blocked", reason: "malformed" };
    }
  }

  const protocol = parsed.protocol.toLowerCase();

  // 6. Block dangerous schemes parsed by WHATWG parser
  if (DANGEROUS_SCHEMES.has(protocol)) {
    return { type: "blocked", reason: `unsafe_scheme:${protocol.slice(0, -1)}` };
  }

  // 7. HTTP and HTTPS handling
  if (protocol === "http:" || protocol === "https:") {
    // If it was explicitly absolute and origin differs from app origin -> external
    if (isAbsolute && parsed.origin !== appOrigin) {
      return { type: "external", url: parsed.href };
    }

    // If it resolves to the same origin as the application
    if (parsed.origin === appOrigin) {
      const isFrag = !isAbsolute && trimmed.startsWith("#");
      return { type: "internal", url: isFrag ? trimmed : parsed.href, isFragment: isFrag };
    }

    // Any other HTTP/HTTPS with differing origin is external
    return { type: "external", url: parsed.href };
  }

  // 8. Legitimate Tauri internal schemes (tauri://localhost)
  if (protocol === "tauri:" || parsed.origin === appOrigin) {
    return { type: "internal", url: parsed.href, isFragment: false };
  }

  // Block any unknown or unexpected scheme (e.g. telnet:, ssh:, gopher:)
  return { type: "blocked", reason: `unsupported_scheme:${protocol.slice(0, -1)}` };
}

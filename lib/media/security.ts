import path from "path";

/**
 * Ensures the target relative path does not escape the allowed base directory via path traversal
 */
export function isPathSafe(relativePath: string, baseDir: string): boolean {
  if (!relativePath || typeof relativePath !== "string") return false;

  // Check for forbidden characters/sequences
  if (relativePath.includes("\0") || relativePath.includes("..")) {
    return false;
  }

  const resolved = path.resolve(baseDir, relativePath);
  return resolved.startsWith(baseDir);
}

/**
 * Sanitizes input filename to prevent shell/script injection or path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "unnamed_file";
  // Remove directory paths
  const basename = path.basename(filename);
  // Remove dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Blocks dangerous executable extensions
 */
export function isForbiddenExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const dangerous = [
    ".exe", ".bat", ".cmd", ".sh", ".php", ".phtml", ".phar",
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py", ".rb",
    ".pl", ".cgi", ".asp", ".aspx", ".jsp", ".dll", ".so", ".dylib",
    ".htm", ".html", ".htaccess", ".config", ".env", ".vbs"
  ];
  return dangerous.includes(ext);
}

/**
 * In-memory sliding window rate limiter for upload API requests
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: record.resetTime - now,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetMs: record.resetTime - now,
  };
}

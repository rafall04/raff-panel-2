type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function redactValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  if (value.includes("@")) {
    const [local = "", domain] = value.split("@");
    if (!domain) {
      return "***";
    }
    return `${local.slice(0, 2)}***@${domain}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
  }

  if (/token|secret|password|otp|authorization/i.test(value)) {
    return "***";
  }

  return value;
}

function sanitizeContext(context: LogContext = {}): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (/token|secret|password|otp|authorization/i.test(key)) {
        return [key, "***"];
      }

      if (Array.isArray(value)) {
        return [key, value.map((item) => redactValue(item))];
      }

      return [key, redactValue(value)];
    }),
  );
}

export function logPortalServerEvent(
  level: LogLevel,
  event: string,
  context: LogContext = {},
) {
  const payload = sanitizeContext(context);
  const logger = level === "error" ? console.error : console.warn;

  logger(`[PORTAL:${event}]`, payload);
}

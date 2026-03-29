export const getSocketServerUrl = (apiBaseUrl = import.meta.env.VITE_API_URL) => {
  const browserOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const normalizedApiBaseUrl = String(apiBaseUrl || "").trim();

  if (!normalizedApiBaseUrl) {
    return browserOrigin || undefined;
  }

  try {
    const parsed = new URL(
      normalizedApiBaseUrl,
      browserOrigin || "http://localhost",
    );
    return parsed.origin;
  } catch {
    return browserOrigin || undefined;
  }
};


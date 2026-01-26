const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

console.log("API_BASE:", API_BASE);

export const fetchWithAuth = async (
  endpoint: string,
  options: FetchOptions = {},
): Promise<Response> => {
  const url = `${API_BASE}${endpoint}`;

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });
};

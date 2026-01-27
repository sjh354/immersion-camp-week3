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

  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }

  return response;
};

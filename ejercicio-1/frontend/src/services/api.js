const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
export async function api(path, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "No se pudo completar la petición");
  return data;
}

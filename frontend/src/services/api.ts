const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface Source {
  source: string;
  section: string;
  anchor: string;
  page: number | null;
  chunk: string;
  type?: string;
}

export interface Model {
  id: string;
  name: string;
}

export async function getModels(): Promise<Model[]> {
  const res = await fetch(`${BASE}/api/models`);
  const data = await res.json();
  return data.models;
}

export async function ingestFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/ingest/file`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function ingestUrl(url: string) {
  const res = await fetch(`${BASE}/api/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Modifica queryStream para recibir el modelo
export async function* queryStream(question: string, model: string) {
  const res = await fetch(`${BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, model }), // ← agrega model
  });

  if (!res.ok || !res.body) throw new Error("Query failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          // chunk incompleto
        }
      }
    }
  }
}

export async function resetCollection() {
  await fetch(`${BASE}/api/ingest/reset`, { method: "DELETE" });
}

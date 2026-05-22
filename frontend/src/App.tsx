import { useEffect, useState } from "react";
import { useChat } from "./hooks/useChat";
import {
  getModels,
  ingestFile,
  ingestUrl,
  resetCollection,
} from "./services/api";
import Landing from "./components/Landing";
import type { Source, Model } from "./services/api";

// ── Source Card ───────────────────────────────────────────────────────────────

function SourceCard({ source }: { source: Source }) {
  const href = source.anchor ? source.source + source.anchor : null;

  return (
    <div className="source-card">
      <div className="source-meta">
        <span className="source-type">{source.type ?? "doc"}</span>
        <span className="source-name">{source.source}</span>
        {source.section && (
          <span className="source-section">{source.section}</span>
        )}
        {source.page && <span className="source-section">p.{source.page}</span>}
      </div>
      <p className="source-chunk">{source.chunk}</p>
      {href && (
        <a className="source-link" href={href} target="_blank" rel="noreferrer">
          Ver fuente ↗
        </a>
      )}
    </div>
  );
}

// ── Message ───────────────────────────────────────────────────────────────────

function ChatMessage({
  role,
  content,
  sources,
  streaming,
}: {
  role: string;
  content: string;
  sources?: Source[];
  streaming?: boolean;
}) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`message message--${role}`}>
      <div className="message-bubble">
        <p className="message-text">
          {content}
          {streaming && <span className="cursor" />}
        </p>
      </div>
      {sources && sources.length > 0 && (
        <div className="sources-wrapper">
          <button
            className="sources-toggle"
            onClick={() => setShowSources((v) => !v)}>
            {showSources ? "▾" : "▸"} {sources.length} fuente
            {sources.length !== 1 ? "s" : ""}
          </button>
          {showSources && (
            <div className="sources-list">
              {sources.map((s, i) => (
                <SourceCard key={i} source={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Ingest Panel ──────────────────────────────────────────────────────────────

function IngestPanel({
  onIngested,
  model,
  models,
  onModelChange,
}: {
  onIngested: (msg: string) => void;
  model: string;
  models: Model[];
  onModelChange: (m: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Resetting...");
    try {
      await resetCollection();
      const res = await ingestFile(file);
      setStatus(`✓ ${res.chunks_stored} chunks stored`);
      onIngested(res.message);
    } catch (err: any) {
      setStatus(`✗ ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setStatus("Resetting...");
    try {
      await resetCollection();
      const res = await ingestUrl(url.trim());
      setStatus(`✓ ${res.chunks_stored} chunks stored`);
      onIngested(res.message);
      setUrl("");
    } catch (err: any) {
      setStatus(`✗ ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="ingest-panel">
      <div className="panel-header">
        <span className="logo">Distill</span>
        <span className="logo-sub">for Code</span>
      </div>

      <section className="panel-section">
        <h3 className="section-title">Upload file</h3>
        <label className="file-drop">
          <input
            type="file"
            accept=".pdf,.md,.txt"
            onChange={handleFile}
            disabled={busy}
            style={{ display: "none" }}
          />
          <span className="file-drop-icon">↑</span>
          <span>PDF, .md, .txt</span>
        </label>
      </section>
      <section className="panel-section">
        <h3 className="section-title">Model</h3>
        <select
          className="model-select"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </section>

      <section className="panel-section">
        <h3 className="section-title">Add URL</h3>
        <input
          className="url-input"
          type="url"
          placeholder="https://docs.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUrl()}
          disabled={busy}
        />
        <button
          className="btn btn--primary"
          onClick={handleUrl}
          disabled={busy || !url}>
          Ingest URL
        </button>
      </section>

      {status && <p className="status-msg">{status}</p>}
    </aside>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { messages, loading, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [screen, setScreen] = useState<"landing" | "chat">("landing");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [models, setModels] = useState<Model[]>([]);

  // Carga los modelos al montar
  useEffect(() => {
    getModels().then(setModels);
  }, []);

  function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    sendMessage(q, model);
  }

  return (
    <>
      {screen === "landing" ? (
        <Landing onStart={() => setScreen("chat")} />
      ) : (
        <div className="layout">
          <IngestPanel
            onIngested={setNotice}
            model={model}
            models={models}
            onModelChange={setModel}
          />
          <main className="chat-area">
            <div className="chat-topbar">
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setScreen("landing");
                  clearMessages();
                  setNotice("");
                }}>
                ← Back
              </button>
              {notice && <span className="notice">{notice}</span>}
              {messages.length > 0 && (
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    clearMessages();
                    setNotice("");
                  }}>
                  Clear chat
                </button>
              )}
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">Ask your docs anything</p>
                  <p className="empty-sub">
                    Upload a PDF, .md file, or paste a URL in the sidebar.
                  </p>
                </div>
              ) : (
                messages.map((m) => <ChatMessage key={m.id} {...m} />)
              )}
            </div>

            <div className="input-bar">
              <input
                className="chat-input"
                placeholder="How does authentication work?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
              <button
                className="btn btn--send"
                onClick={handleSend}
                disabled={loading || !input.trim()}>
                {loading ? "..." : "Send"}
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

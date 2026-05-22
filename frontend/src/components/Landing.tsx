interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo">Distill</span>
          <span className="logo-sub">for Code</span>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="hero-badge">RAG · Groq · ChromaDB</div>

        <h1 className="hero-title">
          Ask anything about<br />
          <span className="hero-title--accent">your documentation</span>
        </h1>

        <p className="hero-description">
          Upload a PDF, Markdown file, or any URL and get instant,
          source-grounded answers. No hallucinations — every response
          cites the exact section it came from.
        </p>

        <div className="hero-actions">
          <button className="btn-hero" onClick={onStart}>
            Start chatting →
          </button>
        </div>

        <div className="hero-features">
          <div className="feature-pill">
            <span className="feature-icon">⚡</span>
            Streaming responses
          </div>
          <div className="feature-pill">
            <span className="feature-icon">📎</span>
            PDF · Markdown · URLs
          </div>
          <div className="feature-pill">
            <span className="feature-icon">🔍</span>
            Source citations
          </div>
          <div className="feature-pill">
            <span className="feature-icon">🆓</span>
            Free embeddings
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>Built with FastAPI · LangChain · ChromaDB · React</p>
      </footer>
    </div>
  );
}
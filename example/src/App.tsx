import "./App.css";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function SearchDemo() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const searchWeb = useAction(api.example.searchWeb);
  const cached = useQuery(
    api.example.getCachedSearch,
    submittedQuery ? { query: submittedQuery } : "skip",
  );

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSubmittedQuery(query);
    await searchWeb({ query });
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px" }}>
      <h2 style={{ marginTop: 0 }}>🔍 SERP Search</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="e.g. convex database"
          style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {cached && (
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
            {cached.isFresh ? "✅ Fresh cache" : "⚠️ Stale"} — fetched {new Date(cached.fetchedAt).toLocaleTimeString()} — expires {new Date(cached.expiresAt).toLocaleTimeString()}
          </div>
          <pre style={{ background: "rgba(0,0,0,0.05)", padding: "1rem", borderRadius: "4px", overflow: "auto", maxHeight: "300px", fontSize: "0.75rem" }}>
            {JSON.stringify(JSON.parse(cached.results), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ScrapeDemo() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const scrapePage = useAction(api.example.scrapePage);
  const cached = useQuery(
    api.example.getCachedPage,
    submittedUrl ? { url: submittedUrl } : "skip",
  );

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setSubmittedUrl(url);
    await scrapePage({ url });
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px" }}>
      <h2 style={{ marginTop: 0 }}>🌐 Web Unlocker Scrape</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScrape()}
          placeholder="e.g. https://example.com"
          style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button onClick={handleScrape} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Scraping..." : "Scrape"}
        </button>
      </div>
      {cached && (
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
            {cached.isFresh ? "✅ Fresh cache" : "⚠️ Stale"} — fetched {new Date(cached.fetchedAt).toLocaleTimeString()}
          </div>
          <pre style={{ background: "rgba(0,0,0,0.05)", padding: "1rem", borderRadius: "4px", overflow: "auto", maxHeight: "300px", fontSize: "0.75rem" }}>
            {cached.content.slice(0, 2000)}…
          </pre>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <h1>convex-bright-data</h1>
      <p style={{ color: "#888", marginBottom: "2rem" }}>
        Bright Data SERP + Web Unlocker with reactive Convex caching
      </p>
      <div className="card">
        <SearchDemo />
        <ScrapeDemo />
        <p style={{ fontSize: "0.8rem", color: "#666" }}>
          Results are cached in Convex and returned reactively — no re-fetch if fresh.
        </p>
      </div>
    </>
  );
}

export default App;
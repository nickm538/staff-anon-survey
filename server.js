const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

/* ── In-memory key-value store ── */
const store = new Map();

app.get("/api/storage/list", (req, res) => {
  const prefix = req.query.prefix || "";
  const keys = [...store.keys()].filter((k) => k.startsWith(prefix));
  res.json({ keys });
});

app.get("/api/storage/get", (req, res) => {
  const key = req.query.key || "";
  const value = store.has(key) ? store.get(key) : null;
  res.json({ key, value });
});

app.post("/api/storage/set", (req, res) => {
  const { key, value } = req.body;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "key is required" });
  }
  store.set(key, value);
  res.json({ ok: true });
});

/* ── Anthropic AI proxy (optional) ── */
app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI analysis is not configured." });
  }
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "AI service unreachable." });
  }
});

/* ── Serve the built React app ── */
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
app.get("*", (_req, res) => {
  res.type("html").send(indexHtml);
});

app.listen(PORT, () => {
  console.log(`Staff Wellness Survey running on port ${PORT}`);
});

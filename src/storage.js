/**
 * Client-side storage shim.
 * Provides window.storage with list / get / set methods backed by the
 * Express server's /api/storage endpoints.
 */
export function initStorage() {
  if (window.storage) return;

  window.storage = {
    async list(prefix) {
      const res = await fetch(`/api/storage/list?prefix=${encodeURIComponent(prefix)}`);
      if (!res.ok) throw new Error("storage list failed");
      return res.json();
    },

    async get(key) {
      const res = await fetch(`/api/storage/get?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("storage get failed");
      return res.json();
    },

    async set(key, value) {
      const res = await fetch("/api/storage/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("storage set failed");
      return res.json();
    },
  };
}

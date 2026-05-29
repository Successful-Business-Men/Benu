// AI-powered menu extraction. Calls our own Vercel serverless function at
// /api/extract-menu, which holds the OpenAI key on the server. The browser
// never sees the key.
//
// If the server returns 503, AI extraction is not configured on this deploy
// and we silently fall back to the heuristic parser.

window.BMAIExtract = (function () {
  const ENABLED_STORE = "better-menu:ai-enabled";
  const ENDPOINT = "/api/extract-menu";

  function isEnabled() { return localStorage.getItem(ENABLED_STORE) !== "0"; }   // default ON
  function setEnabled(on) { localStorage.setItem(ENABLED_STORE, on ? "1" : "0"); }

  async function extract(rawText) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText }),
    });

    if (res.status === 503) {
      const err = new Error("AI extraction is not configured on this server.");
      err.notConfigured = true;
      throw err;
    }
    if (!res.ok) {
      let msg = `Server returned ${res.status}`;
      try { const j = await res.json(); if (j && j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items;
  }

  return { extract, isEnabled, setEnabled };
})();

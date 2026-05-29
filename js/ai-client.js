// Single client-side helper that wraps all the AI endpoints.
// Every call returns a normalized { ok, data, error } shape so callers
// don't have to repeat the same try/catch/status-check dance.

window.BMAI = (function () {
  async function post(path, body) {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      if (res.status === 503) return { ok: false, notConfigured: true, error: "AI is not configured on this deploy." };
      if (!res.ok) {
        let msg = `Server ${res.status}`;
        try { const j = await res.json(); if (j && j.error) msg = j.error; } catch {}
        return { ok: false, error: msg };
      }
      const data = await res.json();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Network error" };
    }
  }

  // Maps the template id to a voice keyword the description endpoint understands.
  function voiceFor(templateId) {
    if (templateId === "boutique") return "luxury";
    if (templateId === "chain")    return "delivery";
    if (templateId === "purr" || templateId === "shack") return "casual";
    return "editorial";
  }

  return {
    generateMenu(brief)        { return post("/api/generate-menu", { brief }); },
    generateDescription(name, category, templateId) {
      return post("/api/generate-description", { name, category, voice: voiceFor(templateId) });
    },
    reviewMenu(state)          { return post("/api/review-menu", { state }); },
  };
})();
